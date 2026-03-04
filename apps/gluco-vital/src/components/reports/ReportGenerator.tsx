import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { format, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Loader2, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function ReportGenerator({ userEmail, onReportGenerated }) {
  const [reportType, setReportType] = useState("weekly");
  const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 7), to: new Date() });
  const [generating, setGenerating] = useState(false);

  const quickRanges = {
    weekly: { from: startOfWeek(new Date()), to: endOfWeek(new Date()) },
    monthly: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
    quarterly: { from: startOfQuarter(new Date()), to: endOfQuarter(new Date()) }
  };

  const handleTypeChange = (type) => {
    setReportType(type);
    setDateRange(quickRanges[type]);
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      // Fetch logs for the period (check both user_email and created_by for agent-created logs)
      const allLogs = await appClient.entities.HealthLog.list('-created_date', 500);
      const userLogs = allLogs.filter(log => 
        (log.user_email === userEmail || log.created_by === userEmail) &&
        log.status !== 'corrected' && log.status !== 'deleted'
      );
      const filteredLogs = userLogs.filter(log => {
        const logDate = new Date(log.created_date);
        return logDate >= dateRange.from && logDate <= dateRange.to;
      });

      const profile = await appClient.entities.PatientProfile.filter({ user_email: userEmail });
      const patientProfile = profile?.[0];

      // Calculate stats
      const sugarLogs = filteredLogs.filter(l => l.log_type === "sugar" && l.numeric_value);
      const bpLogs = filteredLogs.filter(l => l.log_type === "blood_pressure");
      const medLogs = filteredLogs.filter(l => l.log_type === "medication");
      const mealLogs = filteredLogs.filter(l => l.log_type === "meal");
      const symptomLogs = filteredLogs.filter(l => l.log_type === "symptom");

      const sugarStats = sugarLogs.length > 0 ? {
        average: Math.round(sugarLogs.reduce((a, b) => a + b.numeric_value, 0) / sugarLogs.length),
        highest: Math.max(...sugarLogs.map(l => l.numeric_value)),
        lowest: Math.min(...sugarLogs.map(l => l.numeric_value)),
        readings_count: sugarLogs.length,
        in_target_percent: Math.round((sugarLogs.filter(l => l.numeric_value <= (patientProfile?.target_sugar_post_meal || 140)).length / sugarLogs.length) * 100)
      } : null;

      // Prepare detailed log data with full context for AI analysis
      const detailedSugarLogs = sugarLogs.slice(0, 50).map(log => ({
        date: format(new Date(log.created_date), "MMM d, h:mm a"),
        value: log.numeric_value,
        time_of_day: log.time_of_day?.replace(/_/g, ' ') || 'unknown',
        context: log.notes || 'no context provided',
        source: log.source || 'manual'
      }));

      const detailedMealLogs = mealLogs.slice(0, 30).map(log => ({
        date: format(new Date(log.created_date), "MMM d, h:mm a"),
        meal: log.value,
        notes: log.notes || ''
      }));

      const detailedSymptomLogs = symptomLogs.slice(0, 20).map(log => ({
        date: format(new Date(log.created_date), "MMM d"),
        symptom: log.value,
        notes: log.notes || ''
      }));

      // Analyze patterns
      const highReadings = sugarLogs.filter(l => l.numeric_value > 180);
      const lowReadings = sugarLogs.filter(l => l.numeric_value < 70);
      const fastingLogs = sugarLogs.filter(l => l.time_of_day === 'morning_fasting');
      const postMealLogs = sugarLogs.filter(l => l.time_of_day?.includes('after'));

      const patterns = {
        high_reading_count: highReadings.length,
        low_reading_count: lowReadings.length,
        avg_fasting: fastingLogs.length > 0 ? Math.round(fastingLogs.reduce((a, b) => a + b.numeric_value, 0) / fastingLogs.length) : null,
        avg_post_meal: postMealLogs.length > 0 ? Math.round(postMealLogs.reduce((a, b) => a + b.numeric_value, 0) / postMealLogs.length) : null,
        high_readings_with_context: highReadings.slice(0, 10).map(l => ({
          value: l.numeric_value,
          time: l.time_of_day?.replace(/_/g, ' '),
          context: l.notes || 'no context'
        }))
      };

      // Generate AI summary with FULL LOG DATA
      const aiResponse = await appClient.integrations.Core.InvokeLLM({
        prompt: `You are a caring health analyst reviewing ACTUAL patient health logs. Generate a detailed, personalized health report.

Patient: ${patientProfile?.name || 'Patient'}
Period: ${format(dateRange.from, "MMM d")} to ${format(dateRange.to, "MMM d, yyyy")}
Report Type: ${reportType}
Conditions: ${patientProfile?.conditions?.join(', ') || 'Diabetes'}
On Insulin: ${patientProfile?.is_on_insulin ? 'Yes' : 'No'}

=== ACTUAL SUGAR READINGS WITH CONTEXT ===
${JSON.stringify(detailedSugarLogs, null, 2)}

=== MEAL LOGS ===
${JSON.stringify(detailedMealLogs, null, 2)}

=== SYMPTOMS REPORTED ===
${JSON.stringify(detailedSymptomLogs, null, 2)}

=== PATTERN ANALYSIS ===
- Total readings: ${sugarLogs.length}
- High readings (>180): ${patterns.high_reading_count}
- Low readings (<70): ${patterns.low_reading_count}
- Average fasting: ${patterns.avg_fasting || 'N/A'} mg/dL
- Average post-meal: ${patterns.avg_post_meal || 'N/A'} mg/dL
- In-target percentage: ${sugarStats?.in_target_percent || 0}%

=== HIGH READINGS WITH THEIR CONTEXT ===
${JSON.stringify(patterns.high_readings_with_context, null, 2)}

=== BP READINGS ===
${bpLogs.slice(0, 20).map(l => `${format(new Date(l.created_date), "MMM d")}: ${l.value}`).join('\n')}

=== MEDICATION LOGS ===
Count: ${medLogs.length}
Prescribed: ${patientProfile?.medications?.map(m => `${m.name} ${m.dosage || ''}`).join(', ') || 'Not specified'}

Patient Targets:
- Fasting Sugar: ${patientProfile?.target_sugar_fasting || 100} mg/dL
- Post-meal Sugar: ${patientProfile?.target_sugar_post_meal || 140} mg/dL

IMPORTANT: Analyze the ACTUAL data above. Look for:
1. Specific patterns (which times are readings highest?)
2. Context correlation (what meals/activities precede high readings?)
3. Symptom patterns
4. Medication adherence gaps

Generate a personalized report with:
1. A brief summary (2-3 sentences) referencing SPECIFIC data points
2. 2-3 identified risks WITH specific examples from the logs
3. 3-4 actionable recommendations based on ACTUAL patterns found
4. 2-3 achievements or positive observations with data evidence
5. 3-5 specific questions for doctor based on THIS patient's actual data

Be specific - reference actual readings, dates, and contexts. No generic advice.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            risks: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            achievements: { type: "array", items: { type: "string" } },
            questions_for_doctor: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Create report
      const report = await appClient.entities.HealthReport.create({
        user_email: userEmail,
        report_type: reportType,
        start_date: format(dateRange.from, "yyyy-MM-dd"),
        end_date: format(dateRange.to, "yyyy-MM-dd"),
        summary: aiResponse.summary,
        sugar_stats: sugarStats,
        medication_adherence: medLogs.length > 0 ? Math.min(100, Math.round((medLogs.length / (reportType === 'weekly' ? 14 : reportType === 'monthly' ? 60 : 180)) * 100)) : 0,
        risks_identified: aiResponse.risks || [],
        recommendations: aiResponse.recommendations || [],
        achievements: aiResponse.achievements || [],
        questions_for_doctor: aiResponse.questions_for_doctor || []
      });

      toast.success("Report generated successfully!");
      onReportGenerated?.(report);
    } catch (error) {
      toast.error("Failed to generate report");
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-100">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 bg-blue-100 rounded-xl">
          <FileText className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">Generate Health Report</h3>
          <p className="text-xs text-slate-500">AI-powered analysis of your health data</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Report Type</label>
          <Select value={reportType} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly Report</SelectItem>
              <SelectItem value="monthly">Monthly Report</SelectItem>
              <SelectItem value="quarterly">Quarterly Report</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">Date Range</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {dateRange.from && dateRange.to ? (
                  `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`
                ) : "Select dates"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button 
          onClick={generateReport} 
          disabled={generating || !dateRange.from || !dateRange.to}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Report
            </>
          )}
        </Button>
      </div>
    </div>
  );
}