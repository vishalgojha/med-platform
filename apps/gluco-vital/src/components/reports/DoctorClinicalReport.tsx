import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { format, subDays, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Loader2, Stethoscope, FileText, Download, Mail, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function DoctorClinicalReport({ userEmail, patientName, profile }) {
  const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 7), to: new Date() });
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateClinicalReport = async () => {
    setGenerating(true);
    try {
      // Fetch all required data
      const [allLogs, adherenceRecords, visits] = await Promise.all([
        appClient.entities.HealthLog.list('-created_date', 500),
        appClient.entities.MedicationAdherence.list('-scheduled_time', 200),
        appClient.entities.DoctorVisit.filter({ user_email: userEmail }, '-visit_date', 5)
      ]);

      // Filter for user and date range
      const userLogs = allLogs.filter(log => 
        (log.user_email === userEmail || log.created_by === userEmail) &&
        log.status !== 'corrected' && log.status !== 'deleted'
      );
      
      const periodLogs = userLogs.filter(log => {
        const logDate = new Date(log.created_date);
        return logDate >= dateRange.from && logDate <= dateRange.to;
      });

      // Previous period for comparison
      const prevStart = subDays(dateRange.from, differenceInDays(dateRange.to, dateRange.from));
      const prevLogs = userLogs.filter(log => {
        const logDate = new Date(log.created_date);
        return logDate >= prevStart && logDate < dateRange.from;
      });

      // Categorize logs
      const glucoseLogs = periodLogs.filter(l => l.log_type === "sugar" && l.numeric_value);
      const mealLogs = periodLogs.filter(l => l.log_type === "meal");
      const symptomLogs = periodLogs.filter(l => l.log_type === "symptom");
      const sleepLogs = periodLogs.filter(l => l.log_type === "sleep");
      const medLogs = periodLogs.filter(l => l.log_type === "medication");

      // Medication adherence
      const userAdherence = adherenceRecords.filter(a => 
        a.user_email === userEmail &&
        new Date(a.scheduled_time) >= dateRange.from &&
        new Date(a.scheduled_time) <= dateRange.to
      );

      // Format glucose readings with full context
      const glucoseReadings = glucoseLogs.map(log => ({
        datetime: format(new Date(log.created_date), "MMM d, h:mm a"),
        value: log.numeric_value,
        type: log.time_of_day?.replace(/_/g, ' ') || 'unknown',
        notes: log.notes || '',
        source: log.source || 'manual'
      }));

      // Format medication adherence
      const medAdherence = userAdherence.map(a => ({
        date: format(new Date(a.scheduled_time), "MMM d"),
        medication: a.medication_name,
        status: a.status,
        taken_at: a.taken_at ? format(new Date(a.taken_at), "h:mm a") : null
      }));

      // Last visit
      const lastVisit = visits[0];
      const daysSinceVisit = lastVisit ? differenceInDays(new Date(), new Date(lastVisit.visit_date)) : null;

      // Previous week summary
      const prevGlucose = prevLogs.filter(l => l.log_type === "sugar" && l.numeric_value);
      const prevSummary = prevGlucose.length > 0 ? {
        avg: Math.round(prevGlucose.reduce((a, b) => a + b.numeric_value, 0) / prevGlucose.length),
        high_count: prevGlucose.filter(l => l.numeric_value > 250).length,
        low_count: prevGlucose.filter(l => l.numeric_value < 70).length,
        logging_days: new Set(prevGlucose.map(l => format(new Date(l.created_date), "yyyy-MM-dd"))).size
      } : null;

      // Generate clinical summary using the refined prompt
      const response = await appClient.integrations.Core.InvokeLLM({
        prompt: `You are generating a clinical summary for a physician reviewing their diabetic patient. Physicians have 2-3 minutes to review each patient. Focus on: What's happening? Why? What action is needed?

PATIENT DATA:
Name: ${patientName || 'Patient'}
Review Period: ${format(dateRange.from, "MMM d")} to ${format(dateRange.to, "MMM d, yyyy")}
${lastVisit ? `Last Appointment: ${format(new Date(lastVisit.visit_date), "MMM d, yyyy")}` : 'Last Appointment: Not recorded'}
${daysSinceVisit ? `Days Since Last Review: ${daysSinceVisit}` : ''}
Conditions: ${profile?.conditions?.join(', ') || 'Type 2 Diabetes'}
On Insulin: ${profile?.is_on_insulin ? 'Yes' : 'No'}
Medications: ${profile?.medications?.map(m => `${m.name} ${m.dosage || ''}`).join(', ') || 'Not specified'}

GLUCOSE READINGS (${glucoseReadings.length} total):
${glucoseReadings.map(r => `${r.datetime} - ${r.value} mg/dL (${r.type})${r.notes ? ` | Notes: ${r.notes}` : ''}`).join('\n') || 'No readings this period'}

CONTEXT DATA:
Sleep patterns: ${sleepLogs.map(l => `${format(new Date(l.created_date), "MMM d")}: ${l.value}`).join('; ') || 'Not logged'}
Meals: ${mealLogs.slice(0, 10).map(l => `${format(new Date(l.created_date), "MMM d h:mm a")}: ${l.value}`).join('; ') || 'Not logged'}
Symptoms: ${symptomLogs.map(l => `${format(new Date(l.created_date), "MMM d")}: ${l.value}${l.notes ? ` (${l.notes})` : ''}`).join('; ') || 'None reported'}

MEDICATION ADHERENCE:
${medAdherence.length > 0 ? medAdherence.map(m => `${m.date} - ${m.medication}: ${m.status}${m.taken_at ? ` at ${m.taken_at}` : ''}`).join('\n') : `Manual logs: ${medLogs.length} medication entries`}

${prevSummary ? `PREVIOUS WEEK COMPARISON:
Previous period average: ${prevSummary.avg} mg/dL
High readings (>250): ${prevSummary.high_count}
Low readings (<70): ${prevSummary.low_count}
Logging days: ${prevSummary.logging_days}` : 'PREVIOUS WEEK: No comparison data available'}

---

GENERATE THIS CLINICAL SUMMARY IN MARKDOWN FORMAT:

# PATIENT: ${patientName || 'Patient'} - ${format(dateRange.from, "MMM d")} to ${format(dateRange.to, "MMM d")}

## 🚨 CRITICAL ALERTS
[Only list if present, otherwise write "None ✓"]
- Severe hyperglycemia (>300 mg/dL): List with date, time, context
- Hypoglycemia (<70 mg/dL): List with date, time, context  
- Emergency symptoms: Confusion, chest pain, severe fatigue, etc.

Format: "Dec 20, 11:42 AM - 429 mg/dL (post-lunch) | Context: Felt confused and sleepy"

## ⚠️ CONCERNS THIS WEEK
[Only list if present, otherwise write "No major concerns ✓"]
- Moderate hyperglycemia (250-300): List with dates and context
- Persistent elevation pattern (180-250 for 3+ days)
- Medication non-adherence (2+ missed doses)
- Concerning symptoms without emergency status
- Gaps in logging (3+ days without data)

## 📊 WEEKLY SNAPSHOT
- Logging frequency: X/7 days logged
- Good control days (<180): X/7
- Elevated days (180-250): X/7  
- Poor control days (>250): X/7
- Medication adherence: X/7 days as prescribed

${prevSummary ? '[Add comparison:] vs Last Week: [changes in logging, high readings, control]' : ''}

## 💊 MEDICATION ADHERENCE
Days medications taken: X/7
Missed doses: [List specific dates, which medication]

[If pattern exists, note it]
[If affecting readings, note impact]

## 📈 KEY PATTERNS
[List only 2-3 CLEAR, ACTIONABLE patterns. Each must be specific and backed by data.]
- Each pattern should include specific numbers and dates
- Focus on what CORRELATES with high/low readings

## 👍 POSITIVE DEVELOPMENTS
[List if present, otherwise write "Maintaining current approach"]

## 🎯 RECOMMENDED ACTIONS
[Maximum 3 actions, priority ordered, specific and immediately actionable]
1. [Highest priority - safety/critical]
2. [Address clear patterns]
3. [Support compliance]

## 📝 PATIENT NOTES
[Include relevant self-reported information from the notes]

---

CRITICAL: 
- Write for 2-minute scan time
- Every number must be from actual data provided
- Focus on CHANGE and ACTION, not description
- Keep under 400 words total
- Use bullet points, never paragraphs
- Bold critical numbers (>250, <70)
- Clinical tone, colleague-to-colleague`,
        response_json_schema: {
          type: "object",
          properties: {
            markdown_report: { type: "string" }
          }
        }
      });

      setReport(response.markdown_report || response);
      setShowReport(true);
      toast.success("Clinical summary generated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Clinical Summary - ${patientName || 'Patient'}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.5; }
            h1 { color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; font-size: 20px; }
            h2 { color: #334155; font-size: 16px; margin-top: 20px; margin-bottom: 8px; }
            ul { margin: 8px 0; padding-left: 20px; }
            li { margin: 4px 0; }
            strong { color: #dc2626; }
            .disclaimer { background: #fef3c7; padding: 12px; border-radius: 4px; font-size: 11px; margin-top: 30px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${report.replace(/\n/g, '<br>').replace(/## /g, '<h2>').replace(/# /g, '<h1>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}
          <div class="disclaimer">
            <strong>DISCLAIMER:</strong> This AI-generated clinical summary is for informational purposes only. 
            All clinical decisions should be based on complete patient records and physician judgment.
            Generated by GlucoVital.fit on ${format(new Date(), "MMMM d, yyyy")}.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <>
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-emerald-100 rounded-xl">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Doctor Clinical Summary</h3>
            <p className="text-xs text-slate-500">Concise, actionable report for physician review</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Review Period</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {[
                { label: "Last 7 Days", days: 7 },
                { label: "Last 14 Days", days: 14 },
                { label: "Last 30 Days", days: 30 }
              ].map(opt => (
                <Button 
                  key={opt.days}
                  variant="outline" 
                  size="sm"
                  onClick={() => setDateRange({ from: subDays(new Date(), opt.days), to: new Date() })}
                  className={differenceInDays(dateRange.to, dateRange.from) === opt.days ? "border-emerald-300 bg-emerald-50" : ""}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => range && setDateRange(range)}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button 
            onClick={generateClinicalReport} 
            disabled={generating}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Clinical Summary...
              </>
            ) : (
              <>
                <Stethoscope className="w-4 h-4 mr-2" />
                Generate for Doctor
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-600" />
              Clinical Summary
            </DialogTitle>
          </DialogHeader>
          
          <div className="prose prose-sm max-w-none mt-4">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={copyToClipboard} className="flex-1">
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button variant="outline" onClick={printReport} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Print/PDF
            </Button>
          </div>

          <p className="text-xs text-slate-400 text-center mt-2">
            AI-generated summary for physician review. Not a substitute for clinical judgment.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}