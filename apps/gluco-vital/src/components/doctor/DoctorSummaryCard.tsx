import React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, TrendingDown, Minus, MessageSquareQuote, Activity, Droplet, Calendar } from "lucide-react";

export default function DoctorSummaryCard({ summary }) {
  const { 
    patient_name, 
    time_window, 
    decision_state_distribution, 
    diabetes_fatigue, 
    logging_behavior, 
    glucose_context, 
    risk_flags = [], 
    patient_voice, 
    system_recommendation,
    generated_at
  } = summary;

  const total = (decision_state_distribution?.observe || 0) + 
                (decision_state_distribution?.stabilize || 0) + 
                (decision_state_distribution?.escalate || 0);

  const getPercent = (val) => total > 0 ? Math.round((val / total) * 100) : 0;

  const urgencyColors = {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-amber-100 text-amber-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800"
  };

  const actionLabels = {
    ignore: "No action needed",
    monitor: "Monitor",
    review: "Review needed",
    contact: "Contact patient"
  };

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-800">{patient_name || "Patient"}</p>
          <p className="text-xs text-slate-500">{time_window?.replace(/_/g, ' ')}</p>
        </div>
        {system_recommendation && (
          <Badge className={urgencyColors[system_recommendation.urgency] || urgencyColors.low}>
            {actionLabels[system_recommendation.action] || system_recommendation.action}
          </Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Decision States */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
            <Activity className="w-3 h-3" /> Decision States
          </p>
          <div className="space-y-1.5">
            <StateBar label="Observe" value={getPercent(decision_state_distribution?.observe)} color="bg-slate-400" />
            <StateBar label="Stabilize" value={getPercent(decision_state_distribution?.stabilize)} color="bg-amber-400" />
            <StateBar label="Escalate" value={getPercent(decision_state_distribution?.escalate)} color="bg-red-400" />
          </div>
        </div>

        {/* Signals */}
        <div className="grid grid-cols-2 gap-3">
          {/* Fatigue */}
          <div className="p-2.5 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Fatigue</p>
            <div className="flex items-center gap-1.5">
              {diabetes_fatigue?.status === 'detected' || diabetes_fatigue?.status === 'severe' ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              ) : null}
              <span className="text-sm font-medium text-slate-700 capitalize">
                {diabetes_fatigue?.status || 'None'}
              </span>
              {diabetes_fatigue?.trend && (
                <TrendIndicator trend={diabetes_fatigue.trend} />
              )}
            </div>
          </div>

          {/* Logging */}
          <div className="p-2.5 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Logging</p>
            <div className="flex items-center gap-1.5">
              {logging_behavior?.consistency === 'declining' || logging_behavior?.consistency === 'poor' ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              ) : null}
              <span className="text-sm font-medium text-slate-700 capitalize">
                {logging_behavior?.consistency || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Glucose Context */}
        {glucose_context && (
          <div className="p-2.5 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1.5 flex items-center gap-1">
              <Droplet className="w-3 h-3" /> Glucose
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-slate-500">Volatility:</span>
                <span className={`ml-1 font-medium ${
                  glucose_context.volatility === 'high' || glucose_context.volatility === 'critical' 
                    ? 'text-red-600' : 'text-slate-700'
                }`}>
                  {glucose_context.volatility}
                </span>
              </div>
              {logging_behavior?.missed_days?.length > 0 && (
                <div className="flex items-center gap-1 text-amber-600">
                  <Calendar className="w-3 h-3" />
                  <span>{logging_behavior.missed_days.length} gaps</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Risk Flags */}
        {risk_flags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {risk_flags.map(flag => (
              <Badge key={flag} variant="outline" className="text-xs border-red-200 text-red-700 bg-red-50">
                {flag.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        )}

        {/* Patient Voice */}
        {patient_voice?.verbatim_excerpt && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-600 mb-1 flex items-center gap-1">
              <MessageSquareQuote className="w-3 h-3" /> Patient voice
            </p>
            <p className="text-sm text-blue-800 italic">
              "{patient_voice.verbatim_excerpt}"
            </p>
            {patient_voice.timestamp && (
              <p className="text-xs text-blue-500 mt-1">
                {format(new Date(patient_voice.timestamp), "MMM d")}
              </p>
            )}
          </div>
        )}

        {/* Generated timestamp */}
        {generated_at && (
          <p className="text-xs text-slate-400 text-right">
            Generated {format(new Date(generated_at), "MMM d, h:mm a")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StateBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-16">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all`} 
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-slate-600 w-8 text-right">{value}%</span>
    </div>
  );
}

function TrendIndicator({ trend }) {
  if (trend === 'rising') return <TrendingUp className="w-3 h-3 text-red-500" />;
  if (trend === 'declining') return <TrendingDown className="w-3 h-3 text-green-500" />;
  return <Minus className="w-3 h-3 text-slate-400" />;
}