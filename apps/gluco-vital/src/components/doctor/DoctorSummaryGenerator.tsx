import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { subDays, format, eachDayOfInterval } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { compressForDoctor } from "@/components/flow/PatientDoctorFlow";

export default function DoctorSummaryGenerator({ patientEmail, patientName, onSummaryGenerated }) {
  const [generating, setGenerating] = useState(false);
  const [timeWindow, setTimeWindow] = useState("last_7_days");

  const generateSummary = async () => {
    setGenerating(true);
    try {
      const days = timeWindow === "last_7_days" ? 7 : timeWindow === "last_14_days" ? 14 : 30;
      const startDate = subDays(new Date(), days);

      // Fetch all data in parallel
      const [allLogs, memories, adherenceRecords] = await Promise.all([
        appClient.entities.HealthLog.list('-created_date', 500),
        appClient.entities.ConversationMemory.filter({ user_email: patientEmail }).catch(() => []),
        appClient.entities.MedicationAdherence.filter({ user_email: patientEmail }).catch(() => [])
      ]);

      // Filter logs for this patient and time window
      const patientLogs = allLogs.filter(log => 
        (log.user_email === patientEmail || log.created_by === patientEmail) &&
        log.status !== 'deleted' && log.status !== 'corrected' &&
        new Date(log.created_date) >= startDate
      );

      const recentAdherence = adherenceRecords.filter(a => 
        new Date(a.scheduled_time) >= startDate
      );

      // Use the centralized compression function
      const compressed = compressForDoctor({
        logs: patientLogs,
        memories,
        adherenceRecords: recentAdherence,
        patientEmail,
        patientName,
        timeWindow
      });

      // Calculate logging behavior for display
      const sugarLogs = patientLogs.filter(l => l.log_type === 'sugar' && l.numeric_value);
      const allDays = eachDayOfInterval({ start: startDate, end: new Date() });
      const daysWithLogs = new Set(patientLogs.map(l => format(new Date(l.created_date), 'yyyy-MM-dd')));
      const missedDays = allDays
        .filter(d => !daysWithLogs.has(format(d, 'yyyy-MM-dd')))
        .map(d => format(d, 'EEE'));

      const logConsistency = missedDays.length === 0 ? 'strong' :
                            missedDays.length <= 2 ? 'moderate' :
                            missedDays.length <= 4 ? 'declining' : 'poor';

      // Create summary using compressed data
      const summary = await appClient.entities.DoctorSummary.create({
        patient_email: patientEmail,
        patient_name: patientName,
        time_window: timeWindow,
        decision_state_distribution: compressed.decision_state_distribution,
        diabetes_fatigue: compressed.diabetes_fatigue,
        logging_behavior: {
          consistency: logConsistency,
          readings_logged: sugarLogs.length,
          expected_readings: days,
          missed_days: missedDays.slice(0, 5)
        },
        glucose_context: {
          volatility: compressed.glucose_volatility,
          avg_reading: sugarLogs.length > 0 ? Math.round(sugarLogs.reduce((a, b) => a + b.numeric_value, 0) / sugarLogs.length) : null,
          range_low: sugarLogs.length > 0 ? Math.min(...sugarLogs.map(l => l.numeric_value)) : null,
          range_high: sugarLogs.length > 0 ? Math.max(...sugarLogs.map(l => l.numeric_value)) : null
        },
        risk_flags: compressed.risk_flags,
        patient_voice: compressed.patient_voice ? {
          verbatim_excerpt: compressed.patient_voice.verbatim,
          timestamp: compressed.patient_voice.timestamp
        } : null,
        system_recommendation: compressed.system_recommendation,
        generated_at: new Date().toISOString()
      });

      toast.success("Summary generated");
      onSummaryGenerated?.(summary);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate summary");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={timeWindow} onValueChange={setTimeWindow}>
        <SelectTrigger className="w-36 h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="last_7_days">Last 7 days</SelectItem>
          <SelectItem value="last_14_days">Last 14 days</SelectItem>
          <SelectItem value="last_30_days">Last 30 days</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={generateSummary} disabled={generating} size="sm">
        {generating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4" />
        )}
        <span className="ml-1.5">Generate</span>
      </Button>
    </div>
  );
}