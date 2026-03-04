import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { TrendingUp, TrendingDown, Minus, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isWithinInterval, startOfWeek, startOfMonth } from "date-fns";

const TIME_PERIODS = [
  { value: "7d", label: "Last 7 Days", days: 7 },
  { value: "14d", label: "Last 14 Days", days: 14 },
  { value: "30d", label: "Last 30 Days", days: 30 },
  { value: "90d", label: "Last 3 Months", days: 90 },
  { value: "180d", label: "Last 6 Months", days: 180 },
  { value: "365d", label: "Last Year", days: 365 }
];

const CHART_TYPES = [
  { value: "line", label: "Line Chart" },
  { value: "area", label: "Area Chart" }
];

export default function HealthTrendsChart({ 
  logs = [], 
  dataType = "sugar",
  title = "Health Trends",
  targetLow,
  targetHigh,
  unit = "mg/dL"
}) {
  const [period, setPeriod] = useState("30d");
  const [chartType, setChartType] = useState("area");
  const [groupBy, setGroupBy] = useState("day");

  const periodConfig = TIME_PERIODS.find(p => p.value === period);
  const startDate = subDays(new Date(), periodConfig?.days || 30);
  const endDate = new Date();

  const chartData = useMemo(() => {
    // Filter logs by type and date
    const filteredLogs = logs.filter(log => {
      if (dataType === "sugar" && log.log_type !== "sugar") return false;
      if (dataType === "bp" && log.log_type !== "blood_pressure") return false;
      if (!log.numeric_value && !log.value) return false;
      
      const logDate = new Date(log.measured_at || log.created_date);
      return isWithinInterval(logDate, { start: startDate, end: endDate });
    });

    // Generate date intervals
    let intervals;
    let dateFormat;
    
    if (groupBy === "day") {
      intervals = eachDayOfInterval({ start: startDate, end: endDate });
      dateFormat = periodConfig?.days > 30 ? "MMM d" : "MMM d";
    } else if (groupBy === "week") {
      intervals = eachWeekOfInterval({ start: startDate, end: endDate });
      dateFormat = "MMM d";
    } else {
      intervals = eachMonthOfInterval({ start: startDate, end: endDate });
      dateFormat = "MMM yyyy";
    }

    return intervals.map(intervalStart => {
      const intervalEnd = groupBy === "day" 
        ? endOfDay(intervalStart)
        : groupBy === "week"
        ? endOfDay(subDays(startOfWeek(subDays(intervalStart, -7)), 1))
        : endOfDay(subDays(startOfMonth(subDays(intervalStart, -32)), 1));

      const intervalLogs = filteredLogs.filter(log => {
        const logDate = new Date(log.measured_at || log.created_date);
        return isWithinInterval(logDate, { start: intervalStart, end: intervalEnd });
      });

      if (intervalLogs.length === 0) {
        return {
          date: format(intervalStart, dateFormat),
          rawDate: intervalStart,
          value: null,
          min: null,
          max: null,
          count: 0
        };
      }

      const values = intervalLogs.map(l => l.numeric_value || parseFloat(l.value) || 0).filter(v => v > 0);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;

      return {
        date: format(intervalStart, dateFormat),
        rawDate: intervalStart,
        value: Math.round(avg),
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      };
    }).filter(d => d.value !== null);
  }, [logs, dataType, period, groupBy, startDate, endDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    const values = chartData.filter(d => d.value).map(d => d.value);
    if (values.length === 0) return null;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate trend (last 7 data points vs previous 7)
    const recent = values.slice(-7);
    const previous = values.slice(-14, -7);
    
    let trend = "stable";
    if (recent.length > 0 && previous.length > 0) {
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const prevAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
      const change = ((recentAvg - prevAvg) / prevAvg) * 100;
      
      if (change > 5) trend = "up";
      else if (change < -5) trend = "down";
    }

    // In-target percentage
    let inTarget = null;
    if (targetLow && targetHigh) {
      const inRange = values.filter(v => v >= targetLow && v <= targetHigh).length;
      inTarget = Math.round((inRange / values.length) * 100);
    }

    return { avg: Math.round(avg), min, max, trend, inTarget, count: values.length };
  }, [chartData, targetLow, targetHigh]);

  const getTrendIcon = () => {
    if (stats?.trend === "up") return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (stats?.trend === "down") return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
        <p className="font-medium text-slate-800">{label}</p>
        <p className="text-lg font-bold text-violet-600">{data.value} {unit}</p>
        {data.min !== data.max && (
          <p className="text-xs text-slate-500">Range: {data.min} - {data.max}</p>
        )}
        <p className="text-xs text-slate-400">{data.count} reading(s)</p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_PERIODS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="text-center p-2 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Average</p>
              <p className="font-bold text-slate-800">{stats.avg}</p>
            </div>
            <div className="text-center p-2 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Min / Max</p>
              <p className="font-bold text-slate-800">{stats.min} - {stats.max}</p>
            </div>
            <div className="text-center p-2 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Trend</p>
              <div className="flex items-center justify-center gap-1">
                {getTrendIcon()}
                <span className="text-sm capitalize">{stats.trend}</span>
              </div>
            </div>
            {stats.inTarget !== null && (
              <div className="text-center p-2 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">In Target</p>
                <p className={`font-bold ${stats.inTarget >= 70 ? "text-green-600" : stats.inTarget >= 50 ? "text-amber-600" : "text-red-600"}`}>
                  {stats.inTarget}%
                </p>
              </div>
            )}
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  {targetLow && <ReferenceLine y={targetLow} stroke="#22c55e" strokeDasharray="5 5" label={{ value: "Low", fontSize: 10 }} />}
                  {targetHigh && <ReferenceLine y={targetHigh} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "High", fontSize: 10 }} />}
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip content={<CustomTooltip />} />
                  {targetLow && <ReferenceLine y={targetLow} stroke="#22c55e" strokeDasharray="5 5" />}
                  {targetHigh && <ReferenceLine y={targetHigh} stroke="#ef4444" strokeDasharray="5 5" />}
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ fill: "#8b5cf6", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
            <p className="text-slate-500">No data available for this period</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}