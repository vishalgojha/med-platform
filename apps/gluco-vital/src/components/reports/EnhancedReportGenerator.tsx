import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { format, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, differenceInDays } from "date-fns";

const IST_TIMEZONE = "Asia/Kolkata";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarIcon, Loader2, FileText, Sparkles, BarChart3, LineChart, Users, Settings2, Droplet, Heart, Pill, Activity } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export default function EnhancedReportGenerator({ userEmail, onReportGenerated }) {
  const [reportType, setReportType] = useState("weekly");
  const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 7), to: new Date() });
  const [generating, setGenerating] = useState(false);
  const [personalNotes, setPersonalNotes] = useState("");
  const [chartPreferences, setChartPreferences] = useState({
    sugar_chart_type: "line",
    bp_chart_type: "line",
    show_targets: true
  });
  const [accessibleToCaregivers, setAccessibleToCaregivers] = useState(true);
  const [dataPoints, setDataPoints] = useState({
    sugar: true,
    bloodPressure: true,
    medications: true,
    meals: true,
    symptoms: true,
    exercise: true
  });
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const quickRanges = {
    weekly: { from: startOfWeek(new Date()), to: endOfWeek(new Date()) },
    monthly: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
    quarterly: { from: startOfQuarter(new Date()), to: endOfQuarter(new Date()) },
    last7: { from: subDays(new Date(), 7), to: new Date() },
    last14: { from: subDays(new Date(), 14), to: new Date() },
    last30: { from: subDays(new Date(), 30), to: new Date() },
    last90: { from: subDays(new Date(), 90), to: new Date() }
  };

  const handleTypeChange = (type) => {
    setReportType(type);
    if (type !== "custom" && quickRanges[type]) {
      setDateRange(quickRanges[type]);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      // Fetch logs
      const allLogs = await appClient.entities.HealthLog.list('-created_date', 500);
      const userLogs = allLogs.filter(log => 
        (log.user_email === userEmail || log.created_by === userEmail) &&
        log.status !== 'corrected' && log.status !== 'deleted'
      );
      const filteredLogs = userLogs.filter(log => {
        const logDate = new Date(log.created_date);
        return logDate >= dateRange.from && logDate <= dateRange.to;
      });

      // Fetch medication adherence
      const adherenceRecords = await appClient.entities.MedicationAdherence.list('-scheduled_time', 500);
      const userAdherence = adherenceRecords.filter(a => 
        a.user_email === userEmail &&
        new Date(a.scheduled_time) >= dateRange.from &&
        new Date(a.scheduled_time) <= dateRange.to
      );

      const profile = await appClient.entities.PatientProfile.filter({ user_email: userEmail });
      const patientProfile = profile?.[0];

      // Calculate detailed stats
      const sugarLogs = filteredLogs.filter(l => l.log_type === "sugar" && l.numeric_value);
      const bpLogs = filteredLogs.filter(l => l.log_type === "blood_pressure");
      const medLogs = filteredLogs.filter(l => l.log_type === "medication");
      const mealLogs = filteredLogs.filter(l => l.log_type === "meal");
      const symptomLogs = filteredLogs.filter(l => l.log_type === "symptom");

      // Sugar stats with trends
      const fastingLogs = sugarLogs.filter(l => l.time_of_day === 'morning_fasting');
      const postMealLogs = sugarLogs.filter(l => l.time_of_day?.includes('after'));
      
      const sugarStats = sugarLogs.length > 0 ? {
        average: Math.round(sugarLogs.reduce((a, b) => a + b.numeric_value, 0) / sugarLogs.length),
        highest: Math.max(...sugarLogs.map(l => l.numeric_value)),
        lowest: Math.min(...sugarLogs.map(l => l.numeric_value)),
        readings_count: sugarLogs.length,
        in_target_percent: Math.round((sugarLogs.filter(l => l.numeric_value <= (patientProfile?.target_sugar_post_meal || 140)).length / sugarLogs.length) * 100),
        fasting_avg: fastingLogs.length > 0 ? Math.round(fastingLogs.reduce((a, b) => a + b.numeric_value, 0) / fastingLogs.length) : null,
        post_meal_avg: postMealLogs.length > 0 ? Math.round(postMealLogs.reduce((a, b) => a + b.numeric_value, 0) / postMealLogs.length) : null,
        trend: calculateTrend(sugarLogs)
      } : null;

      // BP stats
      const bpStats = bpLogs.length > 0 ? calculateBPStats(bpLogs, patientProfile) : null;

      // Medication adherence
      const adherenceStats = calculateAdherenceStats(userAdherence, medLogs, dateRange);

      // Prepare data for AI
      const detailedSugarLogs = sugarLogs.slice(0, 50).map(log => ({
        date: format(new Date(log.created_date), "MMM d, h:mm a"),
        value: log.numeric_value,
        time_of_day: log.time_of_day?.replace(/_/g, ' ') || 'unknown',
        context: log.notes || 'no context provided'
      }));

      const detailedMealLogs = mealLogs.slice(0, 30).map(log => ({
        date: format(new Date(log.created_date), "MMM d, h:mm a"),
        meal: log.value,
        notes: log.notes || ''
      }));

      // Analyze patterns
      const highReadings = sugarLogs.filter(l => l.numeric_value > 180);
      const lowReadings = sugarLogs.filter(l => l.numeric_value < 70);

      // Generate AI summary
      const aiResponse = await appClient.integrations.Core.InvokeLLM({
        prompt: `You are a caring health analyst reviewing ACTUAL patient health logs. Generate a comprehensive, personalized health report.

Patient: ${patientProfile?.name || 'Patient'}
Period: ${format(dateRange.from, "MMM d")} to ${format(dateRange.to, "MMM d, yyyy")} (${differenceInDays(dateRange.to, dateRange.from)} days)
Conditions: ${patientProfile?.conditions?.join(', ') || 'Diabetes'}
On Insulin: ${patientProfile?.is_on_insulin ? 'Yes' : 'No'}
${personalNotes ? `Patient Notes: ${personalNotes}` : ''}

=== SUGAR STATISTICS ===
${sugarStats ? `
- Total Readings: ${sugarStats.readings_count}
- Average: ${sugarStats.average} mg/dL
- Range: ${sugarStats.lowest} - ${sugarStats.highest} mg/dL
- Fasting Avg: ${sugarStats.fasting_avg || 'N/A'} mg/dL
- Post-Meal Avg: ${sugarStats.post_meal_avg || 'N/A'} mg/dL
- In Target: ${sugarStats.in_target_percent}%
- Trend: ${sugarStats.trend}
` : 'No sugar readings'}

=== BLOOD PRESSURE ===
${bpStats ? `
- Readings: ${bpStats.readings_count}
- Avg: ${bpStats.avg_systolic}/${bpStats.avg_diastolic} mmHg
- Range: ${bpStats.lowest_systolic}-${bpStats.highest_systolic} systolic
- In Target: ${bpStats.in_target_percent}%
` : 'No BP readings'}

=== MEDICATION ADHERENCE ===
${adherenceStats ? `
- Overall: ${adherenceStats.percentage}%
- Doses Taken: ${adherenceStats.total_taken}/${adherenceStats.total_expected}
- Missed: ${adherenceStats.missed_count}
` : 'No adherence data'}

=== DETAILED READINGS ===
${JSON.stringify(detailedSugarLogs.slice(0, 20), null, 2)}

=== MEALS ===
${JSON.stringify(detailedMealLogs.slice(0, 15), null, 2)}

=== HIGH READINGS (>180) ===
${highReadings.slice(0, 10).map(l => `${format(new Date(l.created_date), "MMM d h:mm a")}: ${l.numeric_value} mg/dL - ${l.notes || 'no context'}`).join('\n')}

=== LOW READINGS (<70) ===
${lowReadings.slice(0, 5).map(l => `${format(new Date(l.created_date), "MMM d h:mm a")}: ${l.numeric_value} mg/dL - ${l.notes || 'no context'}`).join('\n')}

Generate a comprehensive report with:
1. A detailed summary (3-4 sentences) with SPECIFIC data points and trends
2. 3-4 identified risks WITH specific examples from logs
3. 4-5 actionable, specific recommendations based on patterns
4. 2-3 achievements or positive observations
5. 4-6 specific questions for doctor based on this patient's data

Be specific and personalized - reference actual readings, dates, and patterns found.`,
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
        personal_notes: personalNotes,
        sugar_stats: sugarStats,
        bp_stats: bpStats,
        medication_adherence: adherenceStats?.percentage || 0,
        adherence_details: adherenceStats,
        risks_identified: aiResponse.risks || [],
        recommendations: aiResponse.recommendations || [],
        achievements: aiResponse.achievements || [],
        questions_for_doctor: aiResponse.questions_for_doctor || [],
        chart_preferences: chartPreferences,
        accessible_to_caregivers: accessibleToCaregivers
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
          <p className="text-xs text-slate-500">AI-powered comprehensive analysis</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Report Type */}
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Report Type</Label>
          <Select value={reportType} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly Report</SelectItem>
              <SelectItem value="monthly">Monthly Report</SelectItem>
              <SelectItem value="quarterly">Quarterly Report</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Date Ranges */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => { setReportType("custom"); setDateRange(quickRanges.last7); }}
            className={dateRange.from?.getTime() === quickRanges.last7.from.getTime() ? "border-blue-300 bg-blue-50" : ""}
          >
            Last 7 Days
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => { setReportType("custom"); setDateRange(quickRanges.last14); }}
            className={dateRange.from?.getTime() === quickRanges.last14.from.getTime() ? "border-blue-300 bg-blue-50" : ""}
          >
            Last 14 Days
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => { setReportType("custom"); setDateRange(quickRanges.last30); }}
            className={dateRange.from?.getTime() === quickRanges.last30.from.getTime() ? "border-blue-300 bg-blue-50" : ""}
          >
            Last 30 Days
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => { setReportType("custom"); setDateRange(quickRanges.last90); }}
            className={dateRange.from?.getTime() === quickRanges.last90.from.getTime() ? "border-blue-300 bg-blue-50" : ""}
          >
            Last 90 Days
          </Button>
        </div>

        {/* Date Range */}
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Date Range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {dateRange.from && dateRange.to ? (
                  `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")} (${differenceInDays(dateRange.to, dateRange.from)} days)`
                ) : "Select dates"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => { if(range) setDateRange(range); setReportType("custom"); }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Data Points Selection */}
        <div className="p-4 bg-white rounded-lg border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Data Points to Include
            </Label>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="text-xs"
            >
              {showAdvancedOptions ? 'Simple' : 'Advanced'}
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <DataPointToggle 
              icon={Droplet} 
              label="Blood Sugar" 
              checked={dataPoints.sugar}
              onChange={(checked) => setDataPoints(p => ({ ...p, sugar: checked }))}
              color="blue"
            />
            <DataPointToggle 
              icon={Heart} 
              label="Blood Pressure" 
              checked={dataPoints.bloodPressure}
              onChange={(checked) => setDataPoints(p => ({ ...p, bloodPressure: checked }))}
              color="red"
            />
            <DataPointToggle 
              icon={Pill} 
              label="Medications" 
              checked={dataPoints.medications}
              onChange={(checked) => setDataPoints(p => ({ ...p, medications: checked }))}
              color="green"
            />
            {showAdvancedOptions && (
              <>
                <DataPointToggle 
                  icon={Activity} 
                  label="Meals" 
                  checked={dataPoints.meals}
                  onChange={(checked) => setDataPoints(p => ({ ...p, meals: checked }))}
                  color="amber"
                />
                <DataPointToggle 
                  icon={Activity} 
                  label="Symptoms" 
                  checked={dataPoints.symptoms}
                  onChange={(checked) => setDataPoints(p => ({ ...p, symptoms: checked }))}
                  color="violet"
                />
                <DataPointToggle 
                  icon={Activity} 
                  label="Exercise" 
                  checked={dataPoints.exercise}
                  onChange={(checked) => setDataPoints(p => ({ ...p, exercise: checked }))}
                  color="cyan"
                />
              </>
            )}
          </div>
        </div>

        {/* Personal Notes */}
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Personal Notes (Optional)</Label>
          <Textarea
            value={personalNotes}
            onChange={(e) => setPersonalNotes(e.target.value)}
            placeholder="Add any context, observations, or notes you want included in this report..."
            className="min-h-[80px]"
          />
          <p className="text-xs text-slate-400 mt-1">These notes will be included in the AI analysis and printed report</p>
        </div>

        {/* Chart Preferences */}
        <div className="p-4 bg-white rounded-lg border border-slate-100">
          <Label className="text-sm font-medium text-slate-700 mb-3 block">Chart Preferences</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Sugar Chart</Label>
              <div className="flex gap-2">
                <Button 
                  variant={chartPreferences.sugar_chart_type === "line" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setChartPreferences(p => ({...p, sugar_chart_type: "line"}))}
                >
                  <LineChart className="w-4 h-4 mr-1" /> Line
                </Button>
                <Button 
                  variant={chartPreferences.sugar_chart_type === "bar" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setChartPreferences(p => ({...p, sugar_chart_type: "bar"}))}
                >
                  <BarChart3 className="w-4 h-4 mr-1" /> Bar
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">BP Chart</Label>
              <div className="flex gap-2">
                <Button 
                  variant={chartPreferences.bp_chart_type === "line" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setChartPreferences(p => ({...p, bp_chart_type: "line"}))}
                >
                  <LineChart className="w-4 h-4 mr-1" /> Line
                </Button>
                <Button 
                  variant={chartPreferences.bp_chart_type === "bar" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setChartPreferences(p => ({...p, bp_chart_type: "bar"}))}
                >
                  <BarChart3 className="w-4 h-4 mr-1" /> Bar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Caregiver Access */}
        <div className="flex items-center justify-between p-3 bg-violet-50 rounded-lg border border-violet-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-600" />
            <div>
              <Label className="text-sm text-violet-800">Share with Caregivers</Label>
              <p className="text-xs text-violet-600">Allow family caregivers to view this report</p>
            </div>
          </div>
          <Switch
            checked={accessibleToCaregivers}
            onCheckedChange={setAccessibleToCaregivers}
          />
        </div>

        <Button 
          onClick={generateReport} 
          disabled={generating || !dateRange.from || !dateRange.to}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Comprehensive Report...
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

function calculateTrend(logs) {
  if (logs.length < 4) return "stable";
  const half = Math.floor(logs.length / 2);
  const firstHalf = logs.slice(half);
  const secondHalf = logs.slice(0, half);
  const firstAvg = firstHalf.reduce((a, b) => a + b.numeric_value, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b.numeric_value, 0) / secondHalf.length;
  const diff = secondAvg - firstAvg;
  if (diff < -10) return "improving";
  if (diff > 10) return "worsening";
  return "stable";
}

function calculateBPStats(bpLogs, profile) {
  const readings = bpLogs.map(log => {
    const match = log.value?.match(/(\d+)\/(\d+)/);
    if (match) return { systolic: parseInt(match[1]), diastolic: parseInt(match[2]) };
    return null;
  }).filter(Boolean);

  if (readings.length === 0) return null;

  const targetSystolic = profile?.target_bp_systolic || 130;
  const targetDiastolic = profile?.target_bp_diastolic || 85;
  const inTarget = readings.filter(r => r.systolic <= targetSystolic && r.diastolic <= targetDiastolic);

  return {
    avg_systolic: Math.round(readings.reduce((a, b) => a + b.systolic, 0) / readings.length),
    avg_diastolic: Math.round(readings.reduce((a, b) => a + b.diastolic, 0) / readings.length),
    readings_count: readings.length,
    highest_systolic: Math.max(...readings.map(r => r.systolic)),
    lowest_systolic: Math.min(...readings.map(r => r.systolic)),
    in_target_percent: Math.round((inTarget.length / readings.length) * 100)
  };
}

function calculateAdherenceStats(adherenceRecords, medLogs, dateRange) {
  const taken = adherenceRecords.filter(a => a.status === "taken" || a.status === "late");
  const missed = adherenceRecords.filter(a => a.status === "missed" || a.status === "skipped");
  const total = adherenceRecords.length || medLogs.length;

  if (total === 0) return null;

  return {
    percentage: total > 0 ? Math.round((taken.length / total) * 100) : 0,
    total_expected: total,
    total_taken: taken.length,
    missed_count: missed.length
  };
}

function DataPointToggle({ icon: Icon, label, checked, onChange, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
    cyan: 'bg-cyan-50 border-cyan-200 text-cyan-700'
  };
  
  return (
    <div 
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
        checked ? colors[color] : 'bg-slate-50 border-slate-200 text-slate-500'
      }`}
    >
      <Checkbox checked={checked} className="pointer-events-none" />
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}