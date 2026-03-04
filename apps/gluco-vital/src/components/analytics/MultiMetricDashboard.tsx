import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart2, TrendingUp, GitCompare, Clock, Activity, Droplet, Heart, Pill } from "lucide-react";
import HealthTrendsChart from "./HealthTrendsChart";
import CorrelationChart from "./CorrelationChart";
import TimeOfDayAnalysis from "./TimeOfDayAnalysis";

export default function MultiMetricDashboard({ 
  logs = [], 
  adherenceData = [],
  profile = {}
}) {
  const [activeTab, setActiveTab] = useState("trends");

  // Extract different log types
  const sugarLogs = logs.filter(l => l.log_type === "sugar");
  const bpLogs = logs.filter(l => l.log_type === "blood_pressure");
  const exerciseLogs = logs.filter(l => l.log_type === "exercise");
  const moodLogs = logs.filter(l => l.log_type === "mood");

  // Get targets from profile
  const sugarTargetLow = profile?.target_sugar_fasting || 70;
  const sugarTargetHigh = profile?.target_sugar_post_meal || 180;
  const bpTargetSystolic = profile?.target_bp_systolic || 120;
  const bpTargetDiastolic = profile?.target_bp_diastolic || 80;

  // Quick stats
  const getQuickStats = () => {
    const last7Days = logs.filter(l => {
      const date = new Date(l.measured_at || l.created_date);
      return date >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    });

    const sugarReadings = last7Days.filter(l => l.log_type === "sugar");
    const avgSugar = sugarReadings.length > 0 
      ? Math.round(sugarReadings.reduce((a, l) => a + (l.numeric_value || 0), 0) / sugarReadings.length)
      : null;

    const adherenceRate = adherenceData.length > 0
      ? Math.round((adherenceData.filter(a => a.status === "taken").length / adherenceData.length) * 100)
      : null;

    return { avgSugar, adherenceRate, totalLogs: last7Days.length };
  };

  const stats = getQuickStats();

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-200 flex items-center justify-center">
                <Droplet className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-violet-600">Avg Sugar (7d)</p>
                <p className="text-xl font-bold text-violet-800">
                  {stats.avgSugar || "-"} <span className="text-xs font-normal">mg/dL</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center">
                <Pill className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-green-600">Med Adherence</p>
                <p className="text-xl font-bold text-green-800">
                  {stats.adherenceRate || "-"}<span className="text-xs font-normal">%</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600">Total Logs (7d)</p>
                <p className="text-xl font-bold text-blue-800">{stats.totalLogs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-200 flex items-center justify-center">
                <Heart className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs text-rose-600">BP Readings</p>
                <p className="text-xl font-bold text-rose-800">{bpLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="trends" className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Patterns</span>
          </TabsTrigger>
          <TabsTrigger value="correlations" className="flex items-center gap-1">
            <GitCompare className="w-4 h-4" />
            <span className="hidden sm:inline">Compare</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4 mt-4">
          <HealthTrendsChart
            logs={sugarLogs}
            dataType="sugar"
            title="Blood Sugar Trends"
            targetLow={sugarTargetLow}
            targetHigh={sugarTargetHigh}
            unit="mg/dL"
          />
          
          {bpLogs.length > 0 && (
            <HealthTrendsChart
              logs={bpLogs}
              dataType="bp"
              title="Blood Pressure Trends"
              targetLow={90}
              targetHigh={bpTargetSystolic}
              unit="mmHg"
            />
          )}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4 mt-4">
          <TimeOfDayAnalysis 
            logs={sugarLogs}
            targetLow={sugarTargetLow}
            targetHigh={sugarTargetHigh}
          />
        </TabsContent>

        <TabsContent value="correlations" className="space-y-4 mt-4">
          <CorrelationChart
            logs={logs}
            adherenceData={adherenceData}
            defaultMetric1="sugar"
            defaultMetric2="medication"
          />
          
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-medium text-slate-800 mb-2">Understanding Correlations</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• <strong>Strong positive:</strong> Both metrics increase together</li>
              <li>• <strong>Strong negative:</strong> One increases as other decreases</li>
              <li>• <strong>Weak/No correlation:</strong> No clear relationship</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}