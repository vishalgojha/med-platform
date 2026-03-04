import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Legend, ComposedChart, Line, Bar, Area } from "recharts";
import { GitCompare, TrendingUp, AlertTriangle, Info } from "lucide-react";
import { format, subDays, isWithinInterval, startOfDay, parseISO } from "date-fns";

const DATA_TYPES = [
  { value: "sugar", label: "Blood Sugar", unit: "mg/dL", color: "#8b5cf6" },
  { value: "blood_pressure", label: "Blood Pressure", unit: "mmHg", color: "#ef4444" },
  { value: "medication", label: "Medication Adherence", unit: "%", color: "#22c55e" },
  { value: "mood", label: "Mood", unit: "scale", color: "#f59e0b" },
  { value: "exercise", label: "Exercise", unit: "mins", color: "#3b82f6" },
  { value: "sleep", label: "Sleep", unit: "hrs", color: "#6366f1" },
  { value: "steps", label: "Steps", unit: "steps", color: "#10b981" },
  { value: "weight", label: "Weight", unit: "kg", color: "#ec4899" }
];

export default function CorrelationChart({ 
  logs = [], 
  adherenceData = [],
  defaultMetric1 = "sugar",
  defaultMetric2 = "medication"
}) {
  const [metric1, setMetric1] = useState(defaultMetric1);
  const [metric2, setMetric2] = useState(defaultMetric2);
  const [period, setPeriod] = useState(30);

  const metric1Config = DATA_TYPES.find(d => d.value === metric1);
  const metric2Config = DATA_TYPES.find(d => d.value === metric2);

  // Process and correlate data
  const { chartData, correlation, insights } = useMemo(() => {
    const startDate = subDays(new Date(), period);
    const endDate = new Date();

    // Get data for metric1
    const getMetricData = (metricType) => {
      if (metricType === "medication") {
        // Calculate daily adherence percentage
        const dailyAdherence = {};
        adherenceData.forEach(record => {
          const date = format(new Date(record.scheduled_time || record.created_date), "yyyy-MM-dd");
          if (!dailyAdherence[date]) dailyAdherence[date] = { taken: 0, total: 0 };
          dailyAdherence[date].total++;
          if (record.status === "taken") dailyAdherence[date].taken++;
        });
        
        return Object.entries(dailyAdherence).map(([date, data]) => ({
          date,
          value: Math.round((data.taken / data.total) * 100)
        }));
      }

      return logs
        .filter(log => {
          if (log.log_type !== metricType) return false;
          const logDate = new Date(log.measured_at || log.created_date);
          return isWithinInterval(logDate, { start: startDate, end: endDate });
        })
        .map(log => ({
          date: format(new Date(log.measured_at || log.created_date), "yyyy-MM-dd"),
          value: log.numeric_value || parseFloat(log.value) || 0,
          timeOfDay: log.time_of_day
        }));
    };

    const data1 = getMetricData(metric1);
    const data2 = getMetricData(metric2);

    // Merge data by date
    const mergedData = [];
    const dateMap = new Map();

    data1.forEach(d => {
      if (!dateMap.has(d.date)) {
        dateMap.set(d.date, { date: d.date, metric1Values: [], metric2Values: [] });
      }
      dateMap.get(d.date).metric1Values.push(d.value);
    });

    data2.forEach(d => {
      if (!dateMap.has(d.date)) {
        dateMap.set(d.date, { date: d.date, metric1Values: [], metric2Values: [] });
      }
      dateMap.get(d.date).metric2Values.push(d.value);
    });

    dateMap.forEach((value, key) => {
      if (value.metric1Values.length > 0 && value.metric2Values.length > 0) {
        const avg1 = value.metric1Values.reduce((a, b) => a + b, 0) / value.metric1Values.length;
        const avg2 = value.metric2Values.reduce((a, b) => a + b, 0) / value.metric2Values.length;
        mergedData.push({
          date: key,
          displayDate: format(parseISO(key), "MMM d"),
          metric1: Math.round(avg1 * 10) / 10,
          metric2: Math.round(avg2 * 10) / 10
        });
      }
    });

    mergedData.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate Pearson correlation coefficient
    let corr = null;
    if (mergedData.length >= 5) {
      const n = mergedData.length;
      const sumX = mergedData.reduce((a, d) => a + d.metric1, 0);
      const sumY = mergedData.reduce((a, d) => a + d.metric2, 0);
      const sumXY = mergedData.reduce((a, d) => a + d.metric1 * d.metric2, 0);
      const sumX2 = mergedData.reduce((a, d) => a + d.metric1 * d.metric1, 0);
      const sumY2 = mergedData.reduce((a, d) => a + d.metric2 * d.metric2, 0);
      
      const numerator = n * sumXY - sumX * sumY;
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
      
      if (denominator !== 0) {
        corr = numerator / denominator;
      }
    }

    // Generate insights
    const insightsList = [];
    if (corr !== null) {
      const absCorr = Math.abs(corr);
      const direction = corr > 0 ? "positive" : "negative";
      
      if (absCorr > 0.7) {
        insightsList.push({
          type: "strong",
          message: `Strong ${direction} correlation detected (${(corr * 100).toFixed(0)}%)`
        });
      } else if (absCorr > 0.4) {
        insightsList.push({
          type: "moderate",
          message: `Moderate ${direction} correlation (${(corr * 100).toFixed(0)}%)`
        });
      } else {
        insightsList.push({
          type: "weak",
          message: `Weak or no significant correlation found`
        });
      }

      // Specific insights based on metric combinations
      if (metric1 === "sugar" && metric2 === "medication" && corr < -0.3) {
        insightsList.push({
          type: "positive",
          message: "Higher medication adherence correlates with lower blood sugar"
        });
      }
      if (metric1 === "sugar" && metric2 === "exercise" && corr < -0.3) {
        insightsList.push({
          type: "positive",
          message: "More exercise correlates with lower blood sugar levels"
        });
      }
    }

    return { chartData: mergedData, correlation: corr, insights: insightsList };
  }, [logs, adherenceData, metric1, metric2, period]);

  const getCorrelationColor = () => {
    if (correlation === null) return "slate";
    const abs = Math.abs(correlation);
    if (abs > 0.7) return correlation > 0 ? "red" : "green";
    if (abs > 0.4) return "amber";
    return "slate";
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
        <p className="font-medium text-slate-800 mb-2">{data.displayDate}</p>
        <p className="text-sm" style={{ color: metric1Config?.color }}>
          {metric1Config?.label}: {data.metric1} {metric1Config?.unit}
        </p>
        <p className="text-sm" style={{ color: metric2Config?.color }}>
          {metric2Config?.label}: {data.metric2} {metric2Config?.unit}
        </p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-violet-500" />
            Correlation Analysis
          </CardTitle>
          <Select value={String(period)} onValueChange={(v) => setPeriod(parseInt(v))}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="14">14 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metric Selectors */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Compare</label>
            <Select value={metric1} onValueChange={setMetric1}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_TYPES.map(d => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">With</label>
            <Select value={metric2} onValueChange={setMetric2}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_TYPES.filter(d => d.value !== metric1).map(d => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Correlation Score */}
        {correlation !== null && (
          <div className={`p-3 rounded-lg bg-${getCorrelationColor()}-50 border border-${getCorrelationColor()}-200`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Correlation Strength</span>
              <span className={`font-bold text-lg text-${getCorrelationColor()}-600`}>
                {(correlation * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full bg-${getCorrelationColor()}-500`}
                style={{ width: `${Math.abs(correlation) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis 
                  yAxisId="left" 
                  tick={{ fontSize: 10 }} 
                  stroke={metric1Config?.color}
                  label={{ value: metric1Config?.unit, angle: -90, position: 'insideLeft', fontSize: 10 }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tick={{ fontSize: 10 }} 
                  stroke={metric2Config?.color}
                  label={{ value: metric2Config?.unit, angle: 90, position: 'insideRight', fontSize: 10 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="metric1" 
                  name={metric1Config?.label}
                  stroke={metric1Config?.color} 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="metric2" 
                  name={metric2Config?.label}
                  stroke={metric2Config?.color} 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
            <div className="text-center">
              <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500">Not enough data to compare</p>
              <p className="text-xs text-slate-400 mt-1">Need at least 5 days with both metrics logged</p>
            </div>
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div className="space-y-2">
            {insights.map((insight, idx) => (
              <div 
                key={idx} 
                className={`p-2 rounded-lg text-sm flex items-start gap-2 ${
                  insight.type === "strong" ? "bg-violet-50 text-violet-700" :
                  insight.type === "positive" ? "bg-green-50 text-green-700" :
                  insight.type === "moderate" ? "bg-amber-50 text-amber-700" :
                  "bg-slate-50 text-slate-600"
                }`}
              >
                <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{insight.message}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-400 text-center">
          Correlations help identify patterns but don't prove causation. Discuss findings with your doctor.
        </p>
      </CardContent>
    </Card>
  );
}