import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function ComparisonCards({ currentLogs, previousLogs, timeRange }) {
  const comparisons = [
    {
      metric: "Sugar Control",
      current: calculateSugarControl(currentLogs),
      previous: calculateSugarControl(previousLogs),
      unit: "%",
      improving: "higher"
    },
    {
      metric: "Logging Frequency",
      current: currentLogs.length,
      previous: previousLogs.length,
      unit: "logs",
      improving: "higher"
    },
    {
      metric: "Avg Sugar Level",
      current: calculateAvgSugar(currentLogs),
      previous: calculateAvgSugar(previousLogs),
      unit: "mg/dL",
      improving: "lower"
    }
  ];

  return (
    <div className="grid md:grid-cols-3 gap-4 mb-8">
      {comparisons.map((comp, idx) => (
        <ComparisonCard key={idx} {...comp} timeRange={timeRange} />
      ))}
    </div>
  );
}

function ComparisonCard({ metric, current, previous, unit, improving, timeRange }) {
  const diff = current - previous;
  const percentChange = previous > 0 ? Math.round((diff / previous) * 100) : 0;
  
  const isImproving = improving === "higher" ? diff > 0 : diff < 0;
  const isStable = Math.abs(percentChange) < 5;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <h4 className="text-sm font-medium text-slate-600 mb-3">{metric}</h4>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-slate-800">
            {current || 0}{unit === "%" ? "%" : ""}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            vs {previous || 0}{unit === "%" ? "%" : ""} prev period
          </p>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${
          isStable ? 'bg-slate-100 text-slate-600' :
          isImproving ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {isStable ? (
            <><Minus className="w-4 h-4" /> Stable</>
          ) : isImproving ? (
            <><TrendingUp className="w-4 h-4" /> +{Math.abs(percentChange)}%</>
          ) : (
            <><TrendingDown className="w-4 h-4" /> {percentChange}%</>
          )}
        </div>
      </div>
    </div>
  );
}

function calculateSugarControl(logs) {
  const sugarLogs = logs.filter(l => l.log_type === "sugar" && l.numeric_value);
  if (sugarLogs.length === 0) return 0;
  const inTarget = sugarLogs.filter(l => l.numeric_value <= 140).length;
  return Math.round((inTarget / sugarLogs.length) * 100);
}

function calculateAvgSugar(logs) {
  const sugarLogs = logs.filter(l => l.log_type === "sugar" && l.numeric_value);
  if (sugarLogs.length === 0) return 0;
  return Math.round(sugarLogs.reduce((a, b) => a + b.numeric_value, 0) / sugarLogs.length);
}