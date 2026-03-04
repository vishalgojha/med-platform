import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";

export default function SugarChart({ logs, targetFasting = 100, targetPostMeal = 140 }) {
  const sugarLogs = logs
    .filter(log => log.log_type === "sugar" && log.numeric_value)
    .map(log => ({
      date: format(new Date(log.created_date), "MMM d"),
      time: format(new Date(log.created_date), "h:mm a"),
      value: log.numeric_value,
      timeOfDay: log.time_of_day
    }))
    .slice(-14);

  if (sugarLogs.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <p>No sugar readings yet. Start logging to see trends!</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100">
          <p className="text-xs text-slate-500">{data.date} • {data.time}</p>
          <p className="text-lg font-bold text-slate-800">{data.value} mg/dL</p>
          {data.timeOfDay && (
            <p className="text-xs text-slate-400 capitalize">{data.timeOfDay.replace(/_/g, " ")}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sugarLogs} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="sugarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={targetFasting} stroke="#10b981" strokeDasharray="3 3" />
          <ReferenceLine y={targetPostMeal} stroke="#f59e0b" strokeDasharray="3 3" />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fill="url(#sugarGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-emerald-500" style={{ borderStyle: 'dashed' }}></div>
          <span className="text-xs text-slate-500">Target Fasting ({targetFasting})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-amber-500" style={{ borderStyle: 'dashed' }}></div>
          <span className="text-xs text-slate-500">Target Post-Meal ({targetPostMeal})</span>
        </div>
      </div>
    </div>
  );
}