import React, { useState, useMemo } from 'react';
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Sparkles, TrendingUp, AlertCircle, FileText, Loader2, BrainCircuit } from "lucide-react";
import { format, subDays, isSameDay, parseISO, startOfWeek, getDay } from "date-fns";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

export default function AnalyticsDashboard() {
    const [aiInsights, setAiInsights] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Fetch Data
    const { data: appointments } = useQuery({
        queryKey: ["analytics_appointments"],
        queryFn: () => appClient.entities.Appointment.list("-start_time", 100),
    });

    const { data: entries } = useQuery({
        queryKey: ["analytics_entries"],
        queryFn: () => appClient.entities.MedicalEntry.list("-date", 100),
    });

    // --- Data Processing ---

    // 1. Appointment Status Distribution
    const statusData = useMemo(() => {
        if (!appointments) return [];
        const counts = {};
        appointments.forEach(a => {
            counts[a.status] = (counts[a.status] || 0) + 1;
        });
        return Object.keys(counts).map(key => ({
            name: key.replace('_', ' '),
            value: counts[key]
        }));
    }, [appointments]);

    // 2. Weekly Trends (Last 7 days)
    const weeklyTrendData = useMemo(() => {
        if (!appointments) return [];
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = subDays(new Date(), 6 - i);
            return { date: d, label: format(d, 'EEE') };
        });

        return last7Days.map(day => {
            const count = appointments.filter(a => 
                isSameDay(parseISO(a.start_time), day.date)
            ).length;
            return { name: day.label, appointments: count };
        });
    }, [appointments]);

    // 3. Note Efficiency (Avg length over time - simplified)
    const efficiencyData = useMemo(() => {
        if (!entries) return [];
        // Group by day, calc avg length
        const grouped = {};
        entries.forEach(e => {
            const day = format(parseISO(e.date), 'MMM d');
            if (!grouped[day]) grouped[day] = { totalLen: 0, count: 0 };
            grouped[day].totalLen += (e.detailed_notes || "").length;
            grouped[day].count += 1;
        });
        return Object.keys(grouped).reverse().slice(0, 7).map(key => ({
            name: key,
            avgLength: Math.round(grouped[key].totalLen / grouped[key].count)
        }));
    }, [entries]);

    // 4. No-Show Prediction (Mock Heuristic based on past no-shows)
    const predictedNoShows = useMemo(() => {
        if (!appointments) return [];
        const upcoming = appointments.filter(a => a.status === 'scheduled' && new Date(a.start_time) > new Date());
        
        // Simple logic: identify patients with past no-shows
        // In a real app, we'd aggregate by patient_id first. 
        // For this demo, we'll just look at the 'no_show' status in the history
        const badHistoryPatients = new Set(
            appointments.filter(a => a.status === 'no_show').map(a => a.patient_id)
        );

        return upcoming.map(a => ({
            ...a,
            risk: badHistoryPatients.has(a.patient_id) ? 'High' : 'Low'
        })).filter(a => a.risk === 'High');
    }, [appointments]);


    const generateAiInsights = async () => {
        setIsGenerating(true);
        try {
            const statsSummary = {
                total_appointments: appointments?.length,
                status_breakdown: statusData,
                weekly_trend: weeklyTrendData,
                avg_note_length: efficiencyData.length > 0 ? efficiencyData[efficiencyData.length-1].avgLength : 0
            };

            const prompt = `
                Analyze the following clinic dashboard data and provide 3 concise, actionable insights for the doctor.
                Data: ${JSON.stringify(statsSummary)}
                
                Focus on:
                1. Efficiency (Are we seeing more patients?)
                2. Appointment adherence (No-show rates)
                3. Documentation trends
                
                Return a JSON object with a list of strings called "insights".
            `;

            const res = await appClient.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        insights: { type: "array", items: { type: "string" } }
                    }
                }
            });
            setAiInsights(res.insights);
        } catch (err) {
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <BrainCircuit className="w-6 h-6 text-indigo-600" />
                        AI Analytics Hub
                    </h2>
                    <p className="text-sm text-slate-500">Real-time insights and predictive modeling</p>
                </div>
                <Button 
                    onClick={generateAiInsights} 
                    disabled={isGenerating}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                >
                    {isGenerating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Generate AI Report
                </Button>
            </div>

            {aiInsights && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4">
                    {aiInsights.map((insight, i) => (
                        <Card key={i} className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm">
                            <CardContent className="p-4 flex items-start gap-3">
                                <div className="bg-indigo-100 p-2 rounded-full shrink-0 mt-0.5">
                                    <Sparkles className="w-4 h-4 text-indigo-600" />
                                </div>
                                <p className="text-sm text-indigo-900 leading-relaxed font-medium">{insight}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Appointment Trends */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Weekly Appointments</CardTitle>
                        <CardDescription>Patient volume over the last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyTrendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="appointments" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Status Distribution */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Appointment Outcomes</CardTitle>
                        <CardDescription>Distribution of status across all records</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                 {/* No-Show Risk */}
                 <Card className="shadow-sm border-l-4 border-l-orange-500">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                            High Risk No-Shows
                        </CardTitle>
                        <CardDescription>Upcoming appointments for patients with history of no-shows</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {predictedNoShows.length > 0 ? (
                            <div className="space-y-3">
                                {predictedNoShows.map(a => (
                                    <div key={a.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">{format(new Date(a.start_time), "MMM d, h:mm a")}</p>
                                                <p className="text-xs text-slate-500 truncate w-32">{a.reason}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-orange-700 border-orange-200 bg-white">High Risk</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[150px] text-slate-400 text-sm">
                                <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                                No high-risk appointments detected.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Note Efficiency */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                             <FileText className="w-5 h-5 text-emerald-600" />
                             Note Detail Trends
                        </CardTitle>
                        <CardDescription>Average character count of medical notes</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={efficiencyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    cursor={{ stroke: '#cbd5e1' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="avgLength" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

import { CheckCircle2 } from "lucide-react";