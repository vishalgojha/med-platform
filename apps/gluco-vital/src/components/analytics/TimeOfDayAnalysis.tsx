import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { Clock, Sun, Moon, Sunrise, Sunset } from "lucide-react";
import { subDays, isWithinInterval } from "date-fns";

const TIME_SLOTS = [
  { key: "morning_fasting", label: "Fasting", icon: Sunrise, time: "6-8 AM" },
  { key: "after_breakfast", label: "After Breakfast", icon: Sun, time: "8-10 AM" },
  { key: "before_lunch", label: "Before Lunch", icon: Sun, time: "11 AM-1 PM" },
  { key: "after_lunch", label: "After Lunch", icon: Sun, time: "1-3 PM" },
  { key: "before_dinner", label: "Before Dinner", icon: Sunset, time: "5-7 PM" },
  { key: "after_dinner", label: "After Dinner", icon: Moon, time: "7-9 PM" },
  { key: "bedtime", label: "Bedtime", icon: Moon, time: "9-11 PM" }
];

export default function TimeOfDayAnalysis({ logs = [], targetLow = 70, targetHigh = 180 }) {
  const [period, setPeriod] = useState(30);

  const analysisData = useMemo(() => {
    const startDate = subDays(new Date(), period);
    const endDate = new Date();

    const sugarLogs = logs.filter(log => {
      if (log.log_type !== "sugar") return false;
      const logDate = new Date(log.measured_at || log.created_date);
      return isWithinInterval(logDate, { start: startDate, end: endDate });
    });

    return TIME_SLOTS.map(slot => {
      const slotLogs = sugarLogs.filter(log => log.time_of_day === slot.key);
      
      if (slotLogs.length === 0) {
        return { ...slot, avg: null, count: 0, min: null, max: null, inTarget: null };
      }

      const values = slotLogs.map(l => l.numeric_value || parseFloat(l.value) || 0).filter(v => v > 0);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const inTarget = values.filter(v => v >= targetLow && v <= targetHigh).length;

      return {
        ...slot,
        avg: Math.round(avg),
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        inTarget: Math.round((inTarget / values.length) * 100)
      };
    });
  }, [logs, period, targetLow, targetHigh]);

  const getBarColor = (avg) => {
    if (avg === null) return "#cbd5e1";
    if (avg < targetLow) return "#3b82f6"; // Low - blue
    if (avg > targetHigh) return "#ef4444"; // High - red
    return "#22c55e"; // In range - green
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    
    if (data.avg === null) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium">{data.label}</p>
          <p className="text-sm text-slate-500">No readings recorded</p>
        </div>
      );
    }
    
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border">
        <p className="font-medium">{data.label}</p>
        <p className="text-xs text-slate-400">{data.time}</p>
        <p className="text-lg font-bold mt-1" style={{ color: getBarColor(data.avg) }}>
          {data.avg} mg/dL
        </p>
        <div className="text-xs text-slate-500 mt-1 space-y-0.5">
          <p>Range: {data.min} - {data.max}</p>
          <p>{data.count} readings</p>
          <p className={data.inTarget >= 70 ? "text-green-600" : "text-amber-600"}>
            {data.inTarget}% in target
          </p>
        </div>
      </div>
    );
  };

  // Find problematic times
  const problematicTimes = analysisData.filter(d => d.avg !== null && (d.avg < targetLow || d.avg > targetHigh));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-500" />
            Time-of-Day Patterns
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
        {/* Chart */}
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analysisData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 9 }} 
                stroke="#94a3b8"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" domain={[0, 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={targetLow} stroke="#22c55e" strokeDasharray="3 3" />
              <ReferenceLine y={targetHigh} stroke="#ef4444" strokeDasharray="3 3" />
              <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                {analysisData.map((entry, index) => (
                  <Cell key={index} fill={getBarColor(entry.avg)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-slate-600">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-slate-600">In Target</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-slate-600">High</span>
          </div>
        </div>

        {/* Insights */}
        {problematicTimes.length > 0 && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm font-medium text-amber-800 mb-1">Patterns to discuss with your doctor:</p>
            <ul className="text-xs text-amber-700 space-y-1">
              {problematicTimes.map(t => (
                <li key={t.key}>
                  • {t.label}: Average {t.avg} mg/dL ({t.avg > targetHigh ? "above" : "below"} target)
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {analysisData.filter(d => d.count > 0).slice(0, 4).map(slot => (
            <div key={slot.key} className="p-2 bg-slate-50 rounded-lg text-center">
              <slot.icon className="w-4 h-4 mx-auto text-slate-400 mb-1" />
              <p className="text-xs text-slate-500">{slot.label}</p>
              <p className="font-bold" style={{ color: getBarColor(slot.avg) }}>
                {slot.avg || "-"}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}