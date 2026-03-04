import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";
import { Pill, CheckCircle, XCircle, Clock } from "lucide-react";

export default function MedicationAdherenceChart({ logs, profile, timeRange }) {
  const medications = profile?.medications || [];
  const expectedDailyDoses = medications.length;

  if (expectedDailyDoses === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-slate-100">
        <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No medications configured</p>
        <p className="text-sm text-slate-400 mt-1">Add medications in your profile to track adherence</p>
      </div>
    );
  }

  const days = eachDayOfInterval({
    start: subDays(new Date(), timeRange - 1),
    end: new Date()
  });

  const data = days.map(day => {
    const dayStart = startOfDay(day);
    const dayLogs = logs.filter(l => {
      const logDate = startOfDay(new Date(l.created_date));
      return logDate.getTime() === dayStart.getTime() && l.log_type === "medication";
    });

    const taken = dayLogs.length;
    const adherencePercent = expectedDailyDoses > 0 
      ? Math.round((taken / expectedDailyDoses) * 100) 
      : 0;

    return {
      date: format(day, "MMM d"),
      taken,
      expected: expectedDailyDoses,
      adherence: adherencePercent,
      missed: Math.max(0, expectedDailyDoses - taken)
    };
  });

  const overallAdherence = Math.round(
    (data.reduce((sum, d) => sum + d.adherence, 0) / data.length)
  );

  const perfectDays = data.filter(d => d.adherence === 100).length;
  const missedDays = data.filter(d => d.adherence === 0).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <span className="text-3xl font-bold text-green-700">{overallAdherence}%</span>
          </div>
          <p className="text-sm font-medium text-green-800">Overall Adherence</p>
          <p className="text-xs text-green-600 mt-1">Last {timeRange} days</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <Pill className="w-8 h-8 text-blue-600" />
            <span className="text-3xl font-bold text-blue-700">{perfectDays}</span>
          </div>
          <p className="text-sm font-medium text-blue-800">Perfect Days</p>
          <p className="text-xs text-blue-600 mt-1">100% doses taken</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-8 h-8 text-amber-600" />
            <span className="text-3xl font-bold text-amber-700">{missedDays}</span>
          </div>
          <p className="text-sm font-medium text-amber-800">Missed Days</p>
          <p className="text-xs text-amber-600 mt-1">No doses logged</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Daily Medication Adherence</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-slate-600">≥80%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-slate-600">50-79%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-slate-600">&lt;50%</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10 }} 
              stroke="#94a3b8"
              interval={Math.floor(data.length / 10)}
            />
            <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" domain={[0, 100]} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white rounded-lg shadow-lg p-3 border border-slate-100">
                      <p className="font-semibold text-slate-800">{data.date}</p>
                      <p className="text-sm text-slate-600">{data.taken}/{data.expected} doses taken</p>
                      <p className="text-sm font-bold text-slate-800">{data.adherence}% adherence</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="adherence" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={
                    entry.adherence >= 80 ? "#22c55e" :
                    entry.adherence >= 50 ? "#f59e0b" :
                    "#ef4444"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Medications List */}
      <div className="bg-white rounded-xl p-6 border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-4">Your Medications</h3>
        <div className="space-y-3">
          {medications.map((med, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-800">{med.name}</p>
                <p className="text-sm text-slate-500">{med.dosage} • {med.frequency}</p>
              </div>
              <Clock className="w-5 h-5 text-slate-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}