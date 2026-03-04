import { createClientFromRequest } from './_shared/server-client';
import { format, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const appClient = createClientFromRequest(req);
    const user = await appClient.auth.me();

    // Allow both user-triggered and scheduled (admin) calls
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { user_email, report_type = 'weekly', send_email = true } = body;

    // If user_email provided (scheduled job), use service role; otherwise use current user
    const targetEmail = user_email || user.email;
    const isScheduledJob = !!user_email && user.role === 'admin';

    // Fetch user's health data
    const [logs, profile, reminders, adherenceLogs] = await Promise.all([
      appClient.asServiceRole.entities.HealthLog.filter({ user_email: targetEmail }, '-created_date', 500),
      appClient.asServiceRole.entities.PatientProfile.filter({ user_email: targetEmail }),
      appClient.asServiceRole.entities.MedicationReminder.filter({ user_email: targetEmail, is_active: true }),
      appClient.asServiceRole.entities.MedicationAdherence.filter({ user_email: targetEmail }, '-scheduled_time', 200)
    ]);

    const patientProfile = profile?.[0];
    const patientName = patientProfile?.name || targetEmail.split('@')[0];

    // Calculate date range
    const now = new Date();
    let startDate, endDate, periodLabel;
    
    if (report_type === 'weekly') {
      startDate = subDays(now, 7);
      endDate = now;
      periodLabel = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
    } else {
      startDate = subMonths(now, 1);
      endDate = now;
      periodLabel = `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
    }

    // Filter logs for period
    const periodLogs = logs.filter(log => {
      const logDate = new Date(log.created_date);
      return logDate >= startDate && logDate <= endDate;
    });

    // Calculate sugar stats
    const sugarLogs = periodLogs.filter(l => l.log_type === 'sugar' && l.numeric_value);
    const sugarStats = {
      count: sugarLogs.length,
      average: sugarLogs.length > 0 ? Math.round(sugarLogs.reduce((a, b) => a + b.numeric_value, 0) / sugarLogs.length) : null,
      highest: sugarLogs.length > 0 ? Math.max(...sugarLogs.map(l => l.numeric_value)) : null,
      lowest: sugarLogs.length > 0 ? Math.min(...sugarLogs.map(l => l.numeric_value)) : null,
      fastingAvg: calculateAvgByTimeOfDay(sugarLogs, ['morning_fasting', 'before_breakfast']),
      postMealAvg: calculateAvgByTimeOfDay(sugarLogs, ['after_breakfast', 'after_lunch', 'after_dinner']),
      inTarget: calculateInTargetPercent(sugarLogs, patientProfile?.target_sugar_fasting || 100, patientProfile?.target_sugar_post_meal || 140)
    };

    // Calculate BP stats
    const bpLogs = periodLogs.filter(l => l.log_type === 'blood_pressure');
    const bpStats = {
      count: bpLogs.length,
      readings: bpLogs.slice(0, 10).map(l => ({ value: l.value, date: format(new Date(l.created_date), 'MMM d') }))
    };

    // Calculate medication adherence
    const periodAdherence = adherenceLogs.filter(a => {
      const aDate = new Date(a.scheduled_time);
      return aDate >= startDate && aDate <= endDate;
    });
    const takenCount = periodAdherence.filter(a => a.status === 'taken' || a.status === 'late').length;
    const adherencePercent = periodAdherence.length > 0 ? Math.round((takenCount / periodAdherence.length) * 100) : null;

    // Generate AI insights
    let aiInsights = [];
    try {
      const insightPrompt = `Analyze this diabetes patient's ${report_type} health data and provide 3-4 brief, actionable insights:

Sugar Readings: ${sugarStats.count} readings, Average: ${sugarStats.average || 'N/A'} mg/dL, Highest: ${sugarStats.highest || 'N/A'}, Lowest: ${sugarStats.lowest || 'N/A'}
Fasting Average: ${sugarStats.fastingAvg || 'N/A'} mg/dL, Post-meal Average: ${sugarStats.postMealAvg || 'N/A'} mg/dL
In Target Range: ${sugarStats.inTarget || 'N/A'}%
BP Readings: ${bpStats.count}
Medication Adherence: ${adherencePercent !== null ? adherencePercent + '%' : 'Not tracked'}

Provide insights in JSON format: {"insights": ["insight1", "insight2", "insight3"]}`;

      const aiResponse = await appClient.asServiceRole.integrations.Core.InvokeLLM({
        prompt: insightPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            insights: { type: "array", items: { type: "string" } }
          }
        }
      });
      aiInsights = aiResponse?.insights || [];
    } catch (e) {
      console.error('AI insights error:', e);
      aiInsights = ['Continue logging regularly for better insights.'];
    }

    // Build report summary
    const reportSummary = {
      patient_name: patientName,
      patient_email: targetEmail,
      report_type,
      period: periodLabel,
      generated_at: now.toISOString(),
      sugar_stats: sugarStats,
      bp_stats: bpStats,
      medication_adherence: adherencePercent,
      total_logs: periodLogs.length,
      insights: aiInsights
    };

    // Save report to HealthReport entity
    const savedReport = await appClient.asServiceRole.entities.HealthReport.create({
      user_email: targetEmail,
      report_type,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
      summary: aiInsights.join('\n'),
      sugar_stats: sugarStats,
      bp_stats: bpStats,
      medication_adherence: adherencePercent,
      recommendations: aiInsights
    });

    // Send email if requested
    if (send_email) {
      const emailBody = generateEmailBody(reportSummary);
      
      // Get scheduled report settings
      const scheduleSettings = await appClient.asServiceRole.entities.ScheduledReport.filter({ user_email: targetEmail });
      const settings = scheduleSettings?.[0];

      const recipients = [];
      if (!settings || settings.send_to_self !== false) {
        recipients.push(targetEmail);
      }

      // Add doctor emails
      if (settings?.send_to_doctor && settings?.doctor_emails?.length > 0) {
        recipients.push(...settings.doctor_emails);
      }

      // Add coach emails
      if (settings?.send_to_coach && settings?.coach_emails?.length > 0) {
        recipients.push(...settings.coach_emails);
      }

      // Send to all recipients
      for (const recipient of recipients) {
        try {
          await appClient.asServiceRole.integrations.Core.SendEmail({
            to: recipient,
            subject: `${report_type === 'weekly' ? 'Weekly' : 'Monthly'} Health Report for ${patientName} - ${periodLabel}`,
            body: emailBody,
            from_name: 'Gluco Vital'
          });
        } catch (emailErr) {
          console.error(`Failed to send email to ${recipient}:`, emailErr);
        }
      }

      // Update last_sent_at
      if (settings) {
        await appClient.asServiceRole.entities.ScheduledReport.update(settings.id, {
          last_sent_at: now.toISOString()
        });
      }
    }

    return Response.json({
      success: true,
      report: reportSummary,
      report_id: savedReport.id
    });

  } catch (error) {
    console.error('Generate report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateAvgByTimeOfDay(logs, timeOfDays) {
  const filtered = logs.filter(l => timeOfDays.includes(l.time_of_day));
  if (filtered.length === 0) return null;
  return Math.round(filtered.reduce((a, b) => a + b.numeric_value, 0) / filtered.length);
}

function calculateInTargetPercent(logs, fastingTarget, postMealTarget) {
  if (logs.length === 0) return null;
  const inTarget = logs.filter(l => {
    const isFasting = ['morning_fasting', 'before_breakfast'].includes(l.time_of_day);
    const target = isFasting ? fastingTarget : postMealTarget;
    return l.numeric_value <= target * 1.1; // 10% tolerance
  });
  return Math.round((inTarget.length / logs.length) * 100);
}

function generateEmailBody(report) {
  const { patient_name, period, report_type, sugar_stats, bp_stats, medication_adherence, total_logs, insights } = report;
  
  return `
Hello ${patient_name},

Here is your ${report_type} health report for ${period}.

📊 SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━
Total Health Logs: ${total_logs}

🩸 BLOOD SUGAR
• Readings: ${sugar_stats.count}
• Average: ${sugar_stats.average || 'N/A'} mg/dL
• Highest: ${sugar_stats.highest || 'N/A'} mg/dL
• Lowest: ${sugar_stats.lowest || 'N/A'} mg/dL
• Fasting Avg: ${sugar_stats.fastingAvg || 'N/A'} mg/dL
• Post-meal Avg: ${sugar_stats.postMealAvg || 'N/A'} mg/dL
• In Target: ${sugar_stats.inTarget || 'N/A'}%

❤️ BLOOD PRESSURE
• Readings: ${bp_stats.count}

💊 MEDICATION ADHERENCE
• ${medication_adherence !== null ? medication_adherence + '%' : 'Not tracked'}

💡 INSIGHTS
${insights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━

View your full report and trends at https://glucovital.fit

Keep up the great work! 💪

Best regards,
Gluco Vital Team
  `.trim();
}