import { createClientFromRequest } from './_shared/server-client';
import { format, getDay, getDate, addDays, addMonths } from 'npm:date-fns@3.6.0';

const DAY_MAP = {
  'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
  'thursday': 4, 'friday': 5, 'saturday': 6
};

Deno.serve(async (req) => {
  try {
    const appClient = createClientFromRequest(req);
    const user = await appClient.auth.me();

    // This should only be called by admin (scheduled automation)
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date();
    const currentDay = getDay(now);
    const currentDate = getDate(now);

    // Get all active scheduled reports
    const scheduledReports = await appClient.asServiceRole.entities.ScheduledReport.filter({ is_active: true });

    const results = [];

    for (const schedule of scheduledReports) {
      let shouldSend = false;

      if (schedule.report_type === 'weekly') {
        const preferredDay = DAY_MAP[schedule.preferred_day] ?? 1; // Default Monday
        shouldSend = currentDay === preferredDay;
      } else if (schedule.report_type === 'monthly') {
        const preferredDate = schedule.preferred_date || 1;
        shouldSend = currentDate === preferredDate;
      }

      if (shouldSend) {
        try {
          // Call the generate report function
          const response = await appClient.asServiceRole.functions.invoke('generateScheduledReport', {
            user_email: schedule.user_email,
            report_type: schedule.report_type,
            send_email: true
          });

          results.push({
            user_email: schedule.user_email,
            report_type: schedule.report_type,
            status: 'sent',
            response: response.data
          });

          // Update next scheduled time
          const nextScheduled = schedule.report_type === 'weekly' 
            ? addDays(now, 7) 
            : addMonths(now, 1);

          await appClient.asServiceRole.entities.ScheduledReport.update(schedule.id, {
            last_sent_at: now.toISOString(),
            next_scheduled_at: nextScheduled.toISOString()
          });

        } catch (err) {
          console.error(`Failed to generate report for ${schedule.user_email}:`, err);
          results.push({
            user_email: schedule.user_email,
            report_type: schedule.report_type,
            status: 'failed',
            error: err.message
          });
        }
      }
    }

    return Response.json({
      success: true,
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('Process scheduled reports error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});