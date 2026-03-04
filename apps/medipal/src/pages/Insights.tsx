import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  BrainCircuit, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Activity,
  ArrowRight 
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function InsightsPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState(null);

  // Fetch all relevant health data
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => appClient.entities.UserProfile.list({ limit: 1 }).then(res => res[0]),
  });

  const { data: reports } = useQuery({
    queryKey: ['reports'],
    queryFn: () => appClient.entities.Report.list({ limit: 5, sort: { date: -1 } }),
  });

  const { data: logs } = useQuery({
    queryKey: ['healthLogs'],
    queryFn: () => appClient.entities.HealthLog.list({ limit: 14, sort: { date: -1 } }),
  });

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      // Prepare data context (anonymized/simplified for token efficiency if needed)
      const dataContext = {
        profile: {
            goals: userProfile?.health_goals,
            concerns: userProfile?.health_concerns
        },
        recent_reports: reports?.map(r => ({
            test: r.test_name,
            date: r.date,
            summary: r.summary,
            status: r.status
        })),
        recent_logs: logs?.map(l => ({
            date: l.date,
            mood: l.mood,
            notes: l.notes
        }))
      };

      const prompt = `
        Act as an advanced Medical AI Analyst. Analyze this user's health data to find hidden patterns and actionable insights.
        
        Data Context: ${JSON.stringify(dataContext)}

        Task:
        1. Identify 2-3 key health trends (positive or negative) based on logs and reports.
        2. Spot potential risks or early warning signs (e.g. consistently low mood, abnormal test results).
        3. Provide 3 specific, actionable recommendations prioritized by impact.
        4. Calculate a "Wellness Score" (1-100) based on how well they are managing their reported goals and consistency.

        Output JSON format:
        {
            "wellness_score": number,
            "score_reason": "short explanation",
            "trends": [{ "title": "string", "description": "string", "type": "positive|negative|neutral" }],
            "risks": [{ "title": "string", "description": "string", "severity": "high|medium|low" }],
            "recommendations": [{ "title": "string", "description": "string", "impact": "high|medium" }]
        }
      `;

      const response = await appClient.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
            type: "object",
            properties: {
                wellness_score: { type: "number" },
                score_reason: { type: "string" },
                trends: { 
                    type: "array", 
                    items: { 
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            description: { type: "string" },
                            type: { type: "string", enum: ["positive", "negative", "neutral"] }
                        }
                    } 
                },
                risks: { 
                    type: "array", 
                    items: { 
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            description: { type: "string" },
                            severity: { type: "string", enum: ["high", "medium", "low"] }
                        }
                    } 
                },
                recommendations: { 
                    type: "array", 
                    items: { 
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            description: { type: "string" },
                            impact: { type: "string", enum: ["high", "medium"] }
                        }
                    } 
                }
            },
            required: ["wellness_score", "trends", "risks", "recommendations"]
        }
      });

      setInsights(response);
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Insight analysis failed:", error);
      toast.error("Could not generate insights. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <BrainCircuit className="w-8 h-8 text-purple-600" />
              Health Insights AI
            </h1>
            <p className="text-slate-600 mt-2">
              Deep analysis of your reports, daily logs, and health profile to find patterns you might miss.
            </p>
          </div>
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all hover:scale-105"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing Data...
              </>
            ) : (
              <>
                <Activity className="mr-2 h-5 w-5" /> Generate New Insights
              </>
            )}
          </Button>
        </div>

        {!insights && !isAnalyzing && (
           <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <BrainCircuit className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-slate-500">Ready to analyze your health data</h3>
              <p className="text-slate-400 max-w-md mx-auto mt-2">
                Click the button above to let our AI look for trends, risks, and opportunities in your recent health history.
              </p>
           </div>
        )}

        {insights && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Wellness Score */}
            <Card className="border-none shadow-xl bg-gradient-to-r from-indigo-900 to-purple-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full border-8 border-white/20 flex items-center justify-center text-4xl font-bold">
                            {insights.wellness_score}
                        </div>
                        <div className="absolute inset-0 rounded-full border-8 border-t-purple-400 border-r-transparent border-b-transparent border-l-transparent rotate-45"></div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl font-bold mb-2">Current Wellness Score</h2>
                        <p className="text-indigo-100 text-lg leading-relaxed">
                            {insights.score_reason}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Trends */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-500" /> Detected Trends
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {insights.trends.map((trend, i) => (
                            <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-semibold text-slate-800">{trend.title}</h4>
                                    <Badge variant="outline" className={
                                        trend.type === 'positive' ? 'text-green-600 bg-green-50 border-green-200' : 
                                        trend.type === 'negative' ? 'text-red-600 bg-red-50 border-red-200' : 
                                        'text-slate-500'
                                    }>{trend.type}</Badge>
                                </div>
                                <p className="text-sm text-slate-600">{trend.description}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Risks */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" /> Potential Risks
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {insights.risks.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                No significant risks detected! 🎉
                            </div>
                        ) : (
                            insights.risks.map((risk, i) => (
                                <div key={i} className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-semibold text-slate-800">{risk.title}</h4>
                                        <Badge className={
                                            risk.severity === 'high' ? 'bg-red-500' : 
                                            risk.severity === 'medium' ? 'bg-amber-500' : 
                                            'bg-yellow-500'
                                        }>{risk.severity} severity</Badge>
                                    </div>
                                    <p className="text-sm text-slate-600">{risk.description}</p>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recommendations */}
            <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-purple-500" /> Recommended Actions
                    </CardTitle>
                    <CardDescription>Personalized steps to improve your health metrics</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        {insights.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-lg transition-colors group">
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 mt-1 font-bold">
                                    {i + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-slate-900">{rec.title}</h4>
                                        {rec.impact === 'high' && (
                                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">High Impact</Badge>
                                        )}
                                    </div>
                                    <p className="text-slate-600 text-sm leading-relaxed">{rec.description}</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-purple-400 transition-colors" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}