import React from "react";
import { Droplet, Heart, Pill, Activity, TrendingUp, TrendingDown, Sun, Moon, AlertTriangle, Target } from "lucide-react";

export default function ProgressStats({ currentLogs, previousLogs, profile, achievements }) {
  // Sugar stats with detailed breakdown
  const currentSugarLogs = currentLogs.filter(l => l.log_type === "sugar" && l.numeric_value);
  const prevSugarLogs = previousLogs.filter(l => l.log_type === "sugar" && l.numeric_value);
  
  const currentAvgSugar = currentSugarLogs.length > 0 
    ? Math.round(currentSugarLogs.reduce((a, b) => a + b.numeric_value, 0) / currentSugarLogs.length)
    : null;
  const prevAvgSugar = prevSugarLogs.length > 0 
    ? Math.round(prevSugarLogs.reduce((a, b) => a + b.numeric_value, 0) / prevSugarLogs.length)
    : null;
  
  const sugarTrend = currentAvgSugar && prevAvgSugar 
    ? Math.round(((currentAvgSugar - prevAvgSugar) / prevAvgSugar) * 100)
    : null;

  // Time-of-day analysis
  const fastingLogs = currentSugarLogs.filter(l => l.time_of_day === 'morning_fasting');
  const postMealLogs = currentSugarLogs.filter(l => l.time_of_day?.includes('after'));
  const avgFasting = fastingLogs.length > 0 
    ? Math.round(fastingLogs.reduce((a, b) => a + b.numeric_value, 0) / fastingLogs.length)
    : null;
  const avgPostMeal = postMealLogs.length > 0 
    ? Math.round(postMealLogs.reduce((a, b) => a + b.numeric_value, 0) / postMealLogs.length)
    : null;

  // High/Low readings analysis
  const targetPostMeal = profile?.target_sugar_post_meal || 140;
  const targetFasting = profile?.target_sugar_fasting || 100;
  const highReadings = currentSugarLogs.filter(l => l.numeric_value > 180);
  const lowReadings = currentSugarLogs.filter(l => l.numeric_value < 70);
  const inTargetCount = currentSugarLogs.filter(l => l.numeric_value <= targetPostMeal && l.numeric_value >= 70).length;
  const inTargetPercent = currentSugarLogs.length > 0 
    ? Math.round((inTargetCount / currentSugarLogs.length) * 100)
    : 0;

  // Logs with context analysis
  const logsWithContext = currentSugarLogs.filter(l => l.notes && l.notes.length > 5).length;
  const contextPercent = currentSugarLogs.length > 0 
    ? Math.round((logsWithContext / currentSugarLogs.length) * 100)
    : 0;

  // BP stats
  const currentBPLogs = currentLogs.filter(l => l.log_type === "blood_pressure");

  // Medication adherence
  const expectedMeds = profile?.medications?.length || 0;
  const daysInPeriod = 30;
  const expectedTotal = expectedMeds * daysInPeriod;
  const actualMeds = currentLogs.filter(l => l.log_type === "medication").length;
  const adherence = expectedTotal > 0 ? Math.round((actualMeds / expectedTotal) * 100) : 0;

  const stats = [
    {
      label: "Avg Blood Sugar",
      value: currentAvgSugar ? `${currentAvgSugar}` : "--",
      unit: "mg/dL",
      icon: Droplet,
      color: "blue",
      trend: sugarTrend,
      improving: sugarTrend !== null && sugarTrend < 0,
      details: currentSugarLogs.length > 0 ? [
        { label: "Highest", value: Math.max(...currentSugarLogs.map(l => l.numeric_value)) },
        { label: "Lowest", value: Math.min(...currentSugarLogs.map(l => l.numeric_value)) },
        { label: "Readings", value: currentSugarLogs.length }
      ] : null
    },
    {
      label: "Fasting vs Post-Meal",
      value: avgFasting ? `${avgFasting}` : "--",
      secondValue: avgPostMeal ? `${avgPostMeal}` : "--",
      icon: Sun,
      secondIcon: Moon,
      color: "amber",
      details: [
        { label: "Fasting readings", value: fastingLogs.length },
        { label: "Post-meal readings", value: postMealLogs.length },
        { label: "Fasting target", value: `≤${targetFasting}` }
      ]
    },
    {
      label: "In-Target Rate",
      value: `${inTargetPercent}%`,
      icon: Target,
      color: inTargetPercent >= 70 ? "green" : inTargetPercent >= 50 ? "amber" : "red",
      improving: inTargetPercent >= 70,
      details: [
        { label: "In range (70-180)", value: inTargetCount },
        { label: "High (>180)", value: highReadings.length, alert: highReadings.length > 0 },
        { label: "Low (<70)", value: lowReadings.length, alert: lowReadings.length > 0 }
      ]
    },
    {
      label: "Context Logged",
      value: `${contextPercent}%`,
      icon: Activity,
      color: contextPercent >= 50 ? "green" : "amber",
      improving: contextPercent >= 50,
      details: [
        { label: "Logs with context", value: logsWithContext },
        { label: "Without context", value: currentSugarLogs.length - logsWithContext },
        { label: "Total logs", value: currentLogs.length }
      ],
      subtext: contextPercent < 50 ? "Add meal/med context for better insights" : "Good context tracking!"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, idx) => (
        <StatCard key={idx} {...stat} />
      ))}
    </div>
  );
}

function StatCard({ label, value, secondValue, unit, icon: Icon, secondIcon: SecondIcon, color, trend, improving, subtext, details }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    red: "from-red-500 to-red-600",
    purple: "from-purple-500 to-purple-600",
    green: "from-green-500 to-green-600",
    amber: "from-amber-500 to-amber-600"
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          {SecondIcon && (
            <div className={`p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg`}>
              <SecondIcon className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        {trend !== null && trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${
            improving ? 'text-green-600' : 'text-red-600'
          }`}>
            {improving ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
        {improving !== undefined && trend === null && trend === undefined && (
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            improving ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {improving ? "Good" : "Improve"}
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-2 mb-1">
        <p className="text-xl sm:text-2xl font-bold text-slate-800">{value}</p>
        {secondValue && (
          <>
            <span className="text-slate-400">/</span>
            <p className="text-xl sm:text-2xl font-bold text-indigo-600">{secondValue}</p>
          </>
        )}
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </div>
      
      <p className="text-xs sm:text-sm text-slate-500 mb-2">{label}</p>
      
      {details && details.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
          {details.map((detail, idx) => (
            <div key={idx} className="flex justify-between text-[10px] sm:text-xs">
              <span className="text-slate-400">{detail.label}</span>
              <span className={`font-medium ${detail.alert ? 'text-red-600' : 'text-slate-600'}`}>
                {detail.value}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {subtext && (
        <p className={`text-[10px] mt-2 ${improving ? 'text-green-600' : 'text-amber-600'}`}>
          {subtext}
        </p>
      )}
    </div>
  );
}