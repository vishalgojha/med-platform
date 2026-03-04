import React from "react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from "recharts";
import { TrendingDown, TrendingUp, Minus, Target } from "lucide-react";

const HBA1C_ZONES = {
  normal: { max: 5.7, color: "#22c55e", label: "Normal" },
  prediabetes: { max: 6.4, color: "#f59e0b", label: "Prediabetes" },
  diabetes: { max: 100, color: "#ef4444", label: "Diabetes" }
};

export default function HbA1cTrendChart({ labResults, targetHbA1c = 7 }) {
  // Filter HbA1c results and sort by date
  const hba1cResults = labResults
    .filter(r => r.test_type === "hba1c" && r.value)
    .sort((a, b) => new Date(a.test_date) - new Date(b.test_date));

  if (hba1cResults.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100 text-center">
        <Target className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-500">No HbA1c results yet</p>
        <p className="text-xs text-slate-400 mt-1">Add your HbA1c test results to see trends</p>
      </div>
    );
  }

  const chartData = hba1cResults.map(result => ({
    date: format(new Date(result.test_date), "MMM yyyy"),
    fullDate: format(new Date(result.test_date), "MMM d, yyyy"),
    value: result.value,
    lab: result.lab_name || "Unknown Lab"
  }));

  // Calculate trend
  const latestValue = hba1cResults[hba1cResults.length - 1]?.value;
  const previousValue = hba1cResults.length > 1 ? hba1cResults[hba1cResults.length - 2]?.value : null;
  const trend = previousValue ? latestValue - previousValue : null;

  const getZone = (value) => {
    if (value < HBA1C_ZONES.normal.max) return HBA1C_ZONES.normal;
    if (value < HBA1C_ZONES.prediabetes.max) return HBA1C_ZONES.prediabetes;
    return HBA1C_ZONES.diabetes;
  };

  const currentZone = getZone(latestValue);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const zone = getZone(data.value);
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-800">{data.fullDate}</p>
          <p className="text-2xl font-bold" style={{ color: zone.color }}>
            {data.value}%
          </p>
          <p className="text-xs text-slate-500">{zone.label}</p>
          <p className="text-xs text-slate-400 mt-1">{data.lab}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-semibold text-slate-800 text-lg">HbA1c Trend</h3>
          <p className="text-sm text-slate-500">3-month average blood sugar</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold" style={{ color: currentZone.color }}>
              {latestValue}%
            </span>
            {trend !== null && (
              <div className={`flex items-center ${trend < 0 ? 'text-green-600' : trend > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                {trend < 0 ? <TrendingDown className="w-5 h-5" /> : trend > 0 ? <TrendingUp className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                <span className="text-sm font-medium">{Math.abs(trend).toFixed(1)}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500">{currentZone.label}</p>
        </div>
      </div>

      {/* Zone indicator */}
      <div className="flex gap-2 mb-4">
        {Object.entries(HBA1C_ZONES).map(([key, zone]) => (
          <div 
            key={key}
            className={`flex-1 h-2 rounded-full ${currentZone.label === zone.label ? 'ring-2 ring-offset-1' : 'opacity-50'}`}
            style={{ backgroundColor: zone.color, ringColor: zone.color }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-slate-400 mb-6">
        <span>Normal (&lt;5.7%)</span>
        <span>Prediabetes (5.7-6.4%)</span>
        <span>Diabetes (&gt;6.4%)</span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="hba1cGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
            />
            <YAxis 
              domain={[4, 12]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Zone backgrounds */}
            <ReferenceLine y={5.7} stroke="#22c55e" strokeDasharray="3 3" />
            <ReferenceLine y={6.5} stroke="#f59e0b" strokeDasharray="3 3" />
            <ReferenceLine 
              y={targetHbA1c} 
              stroke="#3b82f6" 
              strokeWidth={2}
              label={{ value: `Target: ${targetHbA1c}%`, position: 'right', fontSize: 10, fill: '#3b82f6' }}
            />
            
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="none"
              fill="url(#hba1cGradient)"
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8, stroke: '#8b5cf6', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      {hba1cResults.length > 1 && (
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100">
          <div className="text-center">
            <p className="text-lg font-bold text-slate-800">
              {Math.min(...hba1cResults.map(r => r.value)).toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500">Lowest</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-800">
              {(hba1cResults.reduce((a, b) => a + b.value, 0) / hba1cResults.length).toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500">Average</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-800">
              {Math.max(...hba1cResults.map(r => r.value)).toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500">Highest</p>
          </div>
        </div>
      )}
    </div>
  );
}