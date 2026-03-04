import React from "react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format, parseISO, eachDayOfInterval, startOfDay } from "date-fns";

const COLORS = {
  sugar: "#3b82f6",
  bp_systolic: "#ef4444",
  bp_diastolic: "#f97316",
  target: "#22c55e",
  meal: "#f59e0b",
  medication: "#8b5cf6",
  exercise: "#06b6d4"
};

export function SugarTrendChart({ logs, targetFasting = 100, targetPostMeal = 140 }) {
  const sugarLogs = logs
    .filter(l => l.log_type === "sugar" && l.numeric_value)
    .slice(0, 30)
    .reverse();

  if (sugarLogs.length === 0) {
    return <EmptyChart message="No sugar data available" />;
  }

  const data = sugarLogs.map(log => ({
    date: format(new Date(log.created_date), "MMM d"),
    value: log.numeric_value,
    time: log.time_of_day?.replace(/_/g, " ") || "unknown"
  }));

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <h4 className="font-semibold text-slate-700 mb-4">Blood Sugar Trend</h4>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="sugarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.sugar} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={COLORS.sugar} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} stroke="#94a3b8" />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload?.length) {
                return (
                  <div className="bg-white rounded-lg shadow-lg p-3 border border-slate-100">
                    <p className="font-semibold text-slate-800">{payload[0].value} mg/dL</p>
                    <p className="text-xs text-slate-500 capitalize">{payload[0].payload.time}</p>
                    <p className="text-xs text-slate-400">{payload[0].payload.date}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine y={targetFasting} stroke={COLORS.target} strokeDasharray="5 5" label={{ value: 'Fasting Target', fontSize: 10, fill: COLORS.target }} />
          <ReferenceLine y={targetPostMeal} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Post-Meal Target', fontSize: 10, fill: '#f59e0b' }} />
          <Area type="monotone" dataKey="value" stroke={COLORS.sugar} fill="url(#sugarGradient)" strokeWidth={2} dot={{ r: 3, fill: COLORS.sugar }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SugarDistributionChart({ logs, targetPostMeal = 140 }) {
  const sugarLogs = logs.filter(l => l.log_type === "sugar" && l.numeric_value);
  
  if (sugarLogs.length === 0) {
    return <EmptyChart message="No sugar data available" />;
  }

  const inTarget = sugarLogs.filter(l => l.numeric_value <= targetPostMeal).length;
  const aboveTarget = sugarLogs.length - inTarget;

  const data = [
    { name: "In Target", value: inTarget, color: "#22c55e" },
    { name: "Above Target", value: aboveTarget, color: "#ef4444" }
  ];

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <h4 className="font-semibold text-slate-700 mb-4">Sugar Control</h4>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={50}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-slate-600">In Target: {inTarget} ({Math.round((inTarget/sugarLogs.length)*100)}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm text-slate-600">Above Target: {aboveTarget} ({Math.round((aboveTarget/sugarLogs.length)*100)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TimeOfDayChart({ logs }) {
  const sugarLogs = logs.filter(l => l.log_type === "sugar" && l.numeric_value && l.time_of_day);
  
  if (sugarLogs.length === 0) {
    return <EmptyChart message="No time-based data available" />;
  }

  const timeGroups = {};
  sugarLogs.forEach(log => {
    const time = log.time_of_day;
    if (!timeGroups[time]) timeGroups[time] = [];
    timeGroups[time].push(log.numeric_value);
  });

  const data = Object.entries(timeGroups).map(([time, values]) => ({
    time: time.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase()),
    average: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    count: values.length
  }));

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <h4 className="font-semibold text-slate-700 mb-4">Average by Time of Day</h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="time" tick={{ fontSize: 9 }} stroke="#94a3b8" angle={-45} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload?.length) {
                return (
                  <div className="bg-white rounded-lg shadow-lg p-3 border border-slate-100">
                    <p className="font-semibold text-slate-800">{payload[0].value} mg/dL avg</p>
                    <p className="text-xs text-slate-500">{payload[0].payload.count} readings</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="average" fill={COLORS.sugar} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LogActivityChart({ logs, startDate, endDate }) {
  if (!startDate || !endDate) return <EmptyChart message="Select date range" />;

  const days = eachDayOfInterval({ start: new Date(startDate), end: new Date(endDate) });
  
  const data = days.map(day => {
    const dayStart = startOfDay(day);
    const dayLogs = logs.filter(l => {
      const logDate = startOfDay(new Date(l.created_date));
      return logDate.getTime() === dayStart.getTime();
    });

    return {
      date: format(day, "MMM d"),
      sugar: dayLogs.filter(l => l.log_type === "sugar").length,
      bp: dayLogs.filter(l => l.log_type === "blood_pressure").length,
      meal: dayLogs.filter(l => l.log_type === "meal").length,
      medication: dayLogs.filter(l => l.log_type === "medication").length,
      total: dayLogs.length
    };
  });

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <h4 className="font-semibold text-slate-700 mb-4">Daily Logging Activity</h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
          <Tooltip />
          <Bar dataKey="sugar" stackId="a" fill={COLORS.sugar} name="Sugar" />
          <Bar dataKey="bp" stackId="a" fill={COLORS.bp_systolic} name="BP" />
          <Bar dataKey="meal" stackId="a" fill={COLORS.meal} name="Meals" />
          <Bar dataKey="medication" stackId="a" fill={COLORS.medication} name="Medication" />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-3 justify-center">
        <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full" style={{ background: COLORS.sugar }} /> Sugar</span>
        <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full" style={{ background: COLORS.bp_systolic }} /> BP</span>
        <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full" style={{ background: COLORS.meal }} /> Meals</span>
        <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full" style={{ background: COLORS.medication }} /> Medication</span>
      </div>
    </div>
  );
}

export function BPTrendChart({ logs }) {
  const bpLogs = logs
    .filter(l => l.log_type === "blood_pressure" && l.value)
    .slice(0, 20)
    .reverse();

  if (bpLogs.length === 0) {
    return <EmptyChart message="No blood pressure data available" />;
  }

  const data = bpLogs.map(log => {
    const parts = log.value.match(/(\d+)\/(\d+)/);
    return {
      date: format(new Date(log.created_date), "MMM d"),
      systolic: parts ? parseInt(parts[1]) : null,
      diastolic: parts ? parseInt(parts[2]) : null
    };
  }).filter(d => d.systolic && d.diastolic);

  if (data.length === 0) return <EmptyChart message="Invalid BP data format" />;

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <h4 className="font-semibold text-slate-700 mb-4">Blood Pressure Trend</h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} stroke="#94a3b8" />
          <Tooltip />
          <ReferenceLine y={120} stroke="#22c55e" strokeDasharray="5 5" />
          <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="5 5" />
          <Line type="monotone" dataKey="systolic" stroke={COLORS.bp_systolic} strokeWidth={2} dot={{ r: 3 }} name="Systolic" />
          <Line type="monotone" dataKey="diastolic" stroke={COLORS.bp_diastolic} strokeWidth={2} dot={{ r: 3 }} name="Diastolic" />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-3 justify-center">
        <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full" style={{ background: COLORS.bp_systolic }} /> Systolic</span>
        <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full" style={{ background: COLORS.bp_diastolic }} /> Diastolic</span>
      </div>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-100">
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  );
}

export default { SugarTrendChart, SugarDistributionChart, TimeOfDayChart, LogActivityChart, BPTrendChart };