import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function ClinicalTrends({ patientId }) {
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const { data: entries } = useQuery({
        queryKey: ["medical_entries_trends", patientId],
        queryFn: () => appClient.entities.MedicalEntry.filter({ patient_id: patientId }, "-date", 50),
        enabled: !!patientId
    });

    const analyzeTrends = async () => {
        if (!entries || entries.length === 0) return;
        
        setIsAnalyzing(true);
        try {
            const context = entries.map(e => 
                `Date: ${e.date}, Type: ${e.entry_type}, Note: ${e.summary} ${e.detailed_notes || ''}`
            ).join('\n');

            const prompt = `
                Analyze the following medical entries and extract clinical data points for visualization.
                Focus on Blood Pressure (Systolic/Diastolic), Heart Rate, and Weight.
                Also provide a brief clinical interpretation of the trends.
                
                Entries:
                ${context}
                
                Return JSON with:
                - data_points: array of { date, systolic (number), diastolic (number), heart_rate (number), weight (number) }. Only include valid numbers if found, otherwise null.
                - interpretation: string (brief analysis of trends)
            `;

            const res = await appClient.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        data_points: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    date: { type: "string" },
                                    systolic: { type: "number" },
                                    diastolic: { type: "number" },
                                    heart_rate: { type: "number" },
                                    weight: { type: "number" }
                                }
                            }
                        },
                        interpretation: { type: "string" }
                    }
                }
            });
            
            // Sort data points by date
            if (res.data_points) {
                res.data_points.sort((a, b) => new Date(a.date) - new Date(b.date));
                // Format dates for display
                res.data_points = res.data_points.map(dp => ({
                    ...dp,
                    formattedDate: dp.date ? format(new Date(dp.date), 'MMM d') : ''
                }));
            }
            
            setAiAnalysis(res);

        } catch (err) {
            console.error("Trend analysis failed", err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <Card className="mb-8 border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <div className="bg-emerald-100 p-2 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <CardTitle className="text-lg text-slate-800">Vitals & Trends Analysis</CardTitle>
                </div>
                {!aiAnalysis && (
                    <Button 
                        onClick={analyzeTrends} 
                        disabled={isAnalyzing || !entries?.length}
                        variant="outline"
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Activity className="w-4 h-4 mr-2" />}
                        Generate Charts
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {isAnalyzing && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                        <Loader2 className="w-8 h-8 animate-spin mb-2 text-emerald-500" />
                        <p>Extracting data points and analyzing trends...</p>
                    </div>
                )}

                {!isAnalyzing && aiAnalysis && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                         <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100 text-slate-700 text-sm leading-relaxed">
                            <span className="font-semibold text-emerald-800 mr-2">AI Interpretation:</span>
                            {aiAnalysis.interpretation}
                        </div>

                        <div className="h-[300px] w-full">
                            <h4 className="text-sm font-medium text-slate-500 mb-4 text-center">Blood Pressure & Heart Rate Trends</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={aiAnalysis.data_points}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="formattedDate" stroke="#94a3b8" fontSize={12} tickMargin={10} />
                                    <YAxis stroke="#94a3b8" fontSize={12} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="systolic" stroke="#ef4444" name="Systolic BP" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                                    <Line type="monotone" dataKey="diastolic" stroke="#f87171" name="Diastolic BP" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                                    <Line type="monotone" dataKey="heart_rate" stroke="#3b82f6" name="Heart Rate" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}