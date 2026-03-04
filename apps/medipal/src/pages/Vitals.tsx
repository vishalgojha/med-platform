import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Activity, Droplets, HeartPulse } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import VitalsForm from '../components/vitals/VitalsForm';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from 'lucide-react';

export default function VitalsPage() {
  const [refreshKey, setRefreshKey] = React.useState(0);

  const { data: vitals, isLoading } = useQuery({
    queryKey: ['vitals', refreshKey],
    queryFn: () => appClient.entities.VitalSign.list({ limit: 50, sort: { measured_at: 1 } }),
  });

  const glucoseData = vitals?.filter(v => v.type === 'Blood Glucose') || [];
  const bpData = vitals?.filter(v => v.type === 'Blood Pressure') || [];

  // Helper to format date for chart
  const formatDate = (dateStr) => format(new Date(dateStr), 'MMM d, HH:mm');

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-red-100 p-3 rounded-full">
            <Activity className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Vitals Logger</h1>
            <p className="text-slate-600">Track your Diabetes and Blood Pressure trends</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form */}
          <div className="lg:col-span-1">
            <VitalsForm onLogAdded={() => setRefreshKey(k => k + 1)} />
            
            <div className="mt-8">
              <h3 className="font-bold text-slate-800 mb-4">Recent Logs</h3>
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {[...(vitals || [])].reverse().slice(0, 10).map((log) => (
                    <div key={log.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {log.type === 'Blood Glucose' ? <Droplets className="w-4 h-4 text-blue-500" /> : <HeartPulse className="w-4 h-4 text-red-500" />}
                          <span className="font-semibold text-slate-800">
                            {log.type === 'Blood Glucose' ? `${log.value_primary} mg/dL` : `${log.value_primary}/${log.value_secondary} mmHg`}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {format(new Date(log.measured_at), 'MMM d, h:mm a')} • {log.context}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">{log.context}</Badge>
                    </div>
                  ))}
                  {vitals?.length === 0 && <p className="text-slate-500 text-sm text-center">No logs yet.</p>}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Charts */}
          <div className="lg:col-span-2 space-y-8">
            {/* Glucose Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Droplets className="w-5 h-5" /> Blood Glucose Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {glucoseData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={glucoseData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="measured_at" tickFormatter={(val) => format(new Date(val), 'MMM d')} />
                      <YAxis domain={['auto', 'auto']} />
                      <Tooltip labelFormatter={(val) => format(new Date(val), 'MMM d, h:mm a')} />
                      <ReferenceLine y={140} stroke="orange" strokeDasharray="3 3" label="High Post-Meal" />
                      <ReferenceLine y={100} stroke="green" strokeDasharray="3 3" label="High Fasting" />
                      <Line type="monotone" dataKey="value_primary" stroke="#3b82f6" strokeWidth={2} name="Glucose" dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    No glucose data yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* BP Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <HeartPulse className="w-5 h-5" /> Blood Pressure Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {bpData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bpData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="measured_at" tickFormatter={(val) => format(new Date(val), 'MMM d')} />
                      <YAxis domain={['auto', 'auto']} />
                      <Tooltip labelFormatter={(val) => format(new Date(val), 'MMM d, h:mm a')} />
                      <ReferenceLine y={120} stroke="green" strokeDasharray="3 3" label="Normal Sys" />
                      <ReferenceLine y={80} stroke="green" strokeDasharray="3 3" label="Normal Dia" />
                      <Line type="monotone" dataKey="value_primary" stroke="#ef4444" strokeWidth={2} name="Systolic" dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="value_secondary" stroke="#f97316" strokeWidth={2} name="Diastolic" dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    No blood pressure data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}