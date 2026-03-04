import React from "react";
import { format, differenceInDays, eachDayOfInterval, startOfDay, parseISO } from "date-fns";
import { 
  ResponsiveContainer, LineChart, BarChart, AreaChart, PieChart, 
  Line, Bar, Area, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ReferenceLine, ComposedChart
} from "recharts";
import { 
  TrendingUp, TrendingDown, Minus, Clock, Calendar, Activity,
  Droplet, Heart, Pill, Sun, Moon, Sunrise, Sunset
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function DetailedSugarAnalysis({ logs, profile, startDate, endDate }) {
  const sugarLogs = logs.filter(l => l.log_type === "sugar" && l.numeric_value);
  
  if (sugarLogs.length === 0) return null;

  // Time of day analysis
  const timeOfDayData = {};
  sugarLogs.forEach(log => {
    const tod = log.time_of_day || 'other';
    if (!timeOfDayData[tod]) {
      timeOfDayData[tod] = { values: [], count: 0 };
    }
    timeOfDayData[tod].values.push(log.numeric_value);
    timeOfDayData[tod].count++;
  });

  const timeAnalysis = Object.entries(timeOfDayData).map(([time, data]) => ({
    time: formatTimeOfDay(time),
    average: Math.round(data.values.reduce((a, b) => a + b, 0) / data.values.length),
    count: data.count,
    min: Math.min(...data.values),
    max: Math.max(...data.values)
  })).sort((a, b) => getTimeOrder(a.time) - getTimeOrder(b.time));

  // Daily pattern analysis
  const days = eachDayOfInterval({ start: new Date(startDate), end: new Date(endDate) });
  const dailyData = days.map(day => {
    const dayLogs = sugarLogs.filter(l => 
      startOfDay(new Date(l.created_date)).getTime() === startOfDay(day).getTime()
    );
    return {
      date: format(day, "MMM d"),
      readings: dayLogs.length,
      average: dayLogs.length > 0 
        ? Math.round(dayLogs.reduce((a, b) => a + b.numeric_value, 0) / dayLogs.length)
        : null,
      high: dayLogs.filter(l => l.numeric_value > 180).length,
      low: dayLogs.filter(l => l.numeric_value < 70).length,
      inTarget: dayLogs.filter(l => l.numeric_value >= 70 && l.numeric_value <= (profile?.target_sugar_post_meal || 140)).length
    };
  });

  // Distribution analysis
  const ranges = [
    { name: 'Very Low (<70)', min: 0, max: 69, color: '#ef4444' },
    { name: 'Low (70-99)', min: 70, max: 99, color: '#f59e0b' },
    { name: 'Target (100-140)', min: 100, max: 140, color: '#22c55e' },
    { name: 'High (141-180)', min: 141, max: 180, color: '#f97316' },
    { name: 'Very High (>180)', min: 181, max: Infinity, color: '#dc2626' }
  ];

  const distribution = ranges.map(range => ({
    name: range.name,
    value: sugarLogs.filter(l => l.numeric_value >= range.min && l.numeric_value <= range.max).length,
    color: range.color,
    percentage: Math.round((sugarLogs.filter(l => l.numeric_value >= range.min && l.numeric_value <= range.max).length / sugarLogs.length) * 100)
  }));

  // Variability metrics
  const values = sugarLogs.map(l => l.numeric_value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.round(Math.sqrt(variance));
  const cv = Math.round((stdDev / mean) * 100); // Coefficient of variation

  return (
    <div className="space-y-6">
      {/* Variability Metrics */}
      <div className="bg-white rounded-xl p-4 border border-slate-100">
        <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          Glucose Variability Metrics
        </h4>
        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="Mean" value={`${Math.round(mean)}`} unit="mg/dL" />
          <MetricCard label="Std Dev" value={`${stdDev}`} unit="mg/dL" />
          <MetricCard label="CV%" value={`${cv}%`} status={cv < 36 ? 'good' : cv < 50 ? 'warning' : 'bad'} />
          <MetricCard label="Range" value={`${Math.min(...values)}-${Math.max(...values)}`} unit="mg/dL" />
        </div>
        <p className="text-xs text-slate-500 mt-3">
          {cv < 36 ? "✅ Good glucose variability (CV < 36%)" : 
           cv < 50 ? "⚠️ Moderate variability (CV 36-50%)" : 
           "🔴 High variability (CV > 50%) - discuss with doctor"}
        </p>
      </div>

      {/* Time of Day Chart */}
      <div className="bg-white rounded-xl p-4 border border-slate-100">
        <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-violet-500" />
          Average by Time of Day
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={timeAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} />
            <YAxis domain={[60, 'auto']} tick={{ fontSize: 10 }} />
            <Tooltip content={<TimeTooltip />} />
            <ReferenceLine y={profile?.target_sugar_fasting || 100} stroke="#22c55e" strokeDasharray="5 5" />
            <ReferenceLine y={profile?.target_sugar_post_meal || 140} stroke="#f59e0b" strokeDasharray="5 5" />
            <Bar dataKey="average" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Distribution Pie */}
      <div className="bg-white rounded-xl p-4 border border-slate-100">
        <h4 className="font-semibold text-slate-700 mb-4">Reading Distribution</h4>
        <div className="flex items-center justify-center gap-6">
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie
                data={distribution.filter(d => d.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                dataKey="value"
              >
                {distribution.filter(d => d.value > 0).map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {distribution.filter(d => d.value > 0).map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-600">{d.name}</span>
                <Badge variant="outline" className="ml-auto">{d.percentage}%</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Activity */}
      <div className="bg-white rounded-xl p-4 border border-slate-100">
        <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-green-500" />
          Daily Logging Activity
        </h4>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="readings" fill="#22c55e" radius={[4, 4, 0, 0]} name="Readings" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function BPAnalysis({ logs, profile }) {
  const bpLogs = logs.filter(l => l.log_type === "blood_pressure").map(log => {
    const match = log.value?.match(/(\d+)\/(\d+)/);
    if (match) {
      return {
        date: format(new Date(log.created_date), "MMM d"),
        systolic: parseInt(match[1]),
        diastolic: parseInt(match[2]),
        time: log.time_of_day || 'other'
      };
    }
    return null;
  }).filter(Boolean);

  if (bpLogs.length < 2) return null;

  const avgSystolic = Math.round(bpLogs.reduce((a, b) => a + b.systolic, 0) / bpLogs.length);
  const avgDiastolic = Math.round(bpLogs.reduce((a, b) => a + b.diastolic, 0) / bpLogs.length);

  // Classify BP
  const getCategory = (sys, dia) => {
    if (sys < 120 && dia < 80) return { label: 'Normal', color: 'green' };
    if (sys < 130 && dia < 80) return { label: 'Elevated', color: 'yellow' };
    if (sys < 140 || dia < 90) return { label: 'Stage 1 High', color: 'orange' };
    if (sys >= 140 || dia >= 90) return { label: 'Stage 2 High', color: 'red' };
    return { label: 'Unknown', color: 'gray' };
  };

  const category = getCategory(avgSystolic, avgDiastolic);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 border border-slate-100">
        <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-500" />
          Blood Pressure Analysis
        </h4>
        
        <div className="grid grid-cols-3 gap-3 mb-4">
          <MetricCard label="Avg Systolic" value={avgSystolic} unit="mmHg" />
          <MetricCard label="Avg Diastolic" value={avgDiastolic} unit="mmHg" />
          <div className={`bg-${category.color}-50 rounded-lg p-3 text-center`}>
            <p className={`text-lg font-bold text-${category.color}-600`}>{category.label}</p>
            <p className="text-xs text-slate-500">Category</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={bpLogs.slice(-20).reverse()}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis domain={[60, 180]} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            <ReferenceLine y={130} stroke="#f59e0b" strokeDasharray="5 5" label="Target Sys" />
            <ReferenceLine y={85} stroke="#3b82f6" strokeDasharray="5 5" label="Target Dia" />
            <Area type="monotone" dataKey="systolic" fill="#fee2e2" stroke="#ef4444" name="Systolic" />
            <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} name="Diastolic" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AdherenceAnalysis({ logs, adherenceRecords, reminders }) {
  const medLogs = logs.filter(l => l.log_type === "medication");
  
  if (medLogs.length === 0 && adherenceRecords?.length === 0) return null;

  // Group by medication
  const medStats = {};
  adherenceRecords?.forEach(record => {
    const name = record.medication_name || 'Unknown';
    if (!medStats[name]) {
      medStats[name] = { taken: 0, missed: 0, late: 0, total: 0 };
    }
    medStats[name].total++;
    if (record.status === 'taken') medStats[name].taken++;
    else if (record.status === 'missed') medStats[name].missed++;
    else if (record.status === 'late') medStats[name].late++;
  });

  const medData = Object.entries(medStats).map(([name, stats]) => ({
    name: name.length > 12 ? name.substring(0, 12) + '...' : name,
    adherence: stats.total > 0 ? Math.round((stats.taken + stats.late) / stats.total * 100) : 0,
    taken: stats.taken,
    missed: stats.missed,
    late: stats.late
  }));

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
        <Pill className="w-4 h-4 text-green-500" />
        Medication Adherence by Drug
      </h4>
      
      {medData.length > 0 ? (
        <div className="space-y-3">
          {medData.map((med, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{med.name}</span>
                <span className={`font-medium ${med.adherence >= 80 ? 'text-green-600' : med.adherence >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                  {med.adherence}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${med.adherence >= 80 ? 'bg-green-500' : med.adherence >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${med.adherence}%` }}
                />
              </div>
              <div className="flex gap-3 text-xs text-slate-500">
                <span>✓ {med.taken} taken</span>
                <span>⏰ {med.late} late</span>
                <span>✗ {med.missed} missed</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No detailed adherence data available</p>
      )}
    </div>
  );
}

function MetricCard({ label, value, unit, status }) {
  const statusColors = {
    good: 'text-green-600',
    warning: 'text-amber-600',
    bad: 'text-red-600'
  };
  
  return (
    <div className="bg-slate-50 rounded-lg p-3 text-center">
      <p className={`text-lg font-bold ${status ? statusColors[status] : 'text-slate-800'}`}>
        {value}
      </p>
      <p className="text-xs text-slate-500">{label}{unit && ` (${unit})`}</p>
    </div>
  );
}

function TimeTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
        <p className="font-medium text-slate-800">{data.time}</p>
        <p className="text-sm">Average: <span className="font-medium">{data.average}</span> mg/dL</p>
        <p className="text-sm">Range: {data.min} - {data.max} mg/dL</p>
        <p className="text-xs text-slate-500">{data.count} readings</p>
      </div>
    );
  }
  return null;
}

function formatTimeOfDay(tod) {
  const labels = {
    morning_fasting: 'Fasting',
    before_breakfast: 'Pre-Breakfast',
    after_breakfast: 'Post-Breakfast',
    before_lunch: 'Pre-Lunch',
    after_lunch: 'Post-Lunch',
    before_dinner: 'Pre-Dinner',
    after_dinner: 'Post-Dinner',
    bedtime: 'Bedtime',
    other: 'Other'
  };
  return labels[tod] || tod.replace(/_/g, ' ');
}

function getTimeOrder(time) {
  const order = ['Fasting', 'Pre-Breakfast', 'Post-Breakfast', 'Pre-Lunch', 'Post-Lunch', 'Pre-Dinner', 'Post-Dinner', 'Bedtime', 'Other'];
  return order.indexOf(time);
}