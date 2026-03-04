import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, differenceInDays } from "date-fns";
import { TrendingUp, TrendingDown, Activity, Calendar, Download, Target, Pill, BarChart2, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SugarTrendChart, SugarDistributionChart, TimeOfDayChart, BPTrendChart } from "@/components/reports/ReportCharts";
import MedicationAdherenceChart from "@/components/progress/MedicationAdherenceChart";
import ProgressStats from "@/components/progress/ProgressStats";
import ComparisonCards from "@/components/progress/ComparisonCards";

import { generateDemoData } from "@/components/demo/DemoDataGenerator";
import DemoBanner from "@/components/demo/DemoBanner";
import MultiMetricDashboard from "@/components/analytics/MultiMetricDashboard";

export default function Progress() {
  const [user, setUser] = useState(null);
  const [timeRange, setTimeRange] = useState("30"); // days
  const [isDemo, setIsDemo] = useState(false);
  const [demoData, setDemoData] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const demoMode = urlParams.get('demo') === 'true';
    
    if (demoMode) {
      setIsDemo(true);
      const data = generateDemoData();
      setDemoData(data);
      setUser(data.user);
    } else {
      setIsDemo(false);
      setDemoData(null);
      appClient.auth.me().then(setUser).catch(() => {});
    }
  }, [window.location.search]);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['health-logs-progress', user?.email, isDemo],
    queryFn: async () => {
      if (isDemo && demoData) {
        return demoData.logs.filter(log => log.status !== 'corrected' && log.status !== 'deleted');
      }
      // Fetch logs and filter for this user (by user_email or created_by), exclude corrected/deleted
      const results = await appClient.entities.HealthLog.list('-created_date', 500);
      return results.filter(log => 
        (log.user_email === user?.email || log.created_by === user?.email) &&
        log.status !== 'corrected' && log.status !== 'deleted'
      );
    },
    enabled: !!user?.email || isDemo
  });

  const { data: profile } = useQuery({
    queryKey: ['patient-profile', user?.email, isDemo],
    queryFn: async () => {
      if (isDemo && demoData) {
        return demoData.profile;
      }
      const results = await appClient.entities.PatientProfile.filter({ user_email: user?.email });
      return results?.[0];
    },
    enabled: !!user?.email || isDemo
  });

  const { data: achievements } = useQuery({
    queryKey: ['user-achievements', user?.email, isDemo],
    queryFn: async () => {
      if (isDemo && demoData) {
        return demoData.achievements;
      }
      const results = await appClient.entities.UserAchievements.filter({ user_email: user?.email });
      return results?.[0];
    },
    enabled: !!user?.email || isDemo
  });

  const { data: adherenceData = [] } = useQuery({
    queryKey: ['medication-adherence', user?.email, isDemo],
    queryFn: async () => {
      if (isDemo) return [];
      const results = await appClient.entities.MedicationAdherence.filter({ user_email: user?.email });
      return results || [];
    },
    enabled: !!user?.email && !isDemo
  });

  // Filter logs by time range
  const cutoffDate = subDays(new Date(), parseInt(timeRange));
  const filteredLogs = logs.filter(log => new Date(log.created_date) >= cutoffDate);

  // Calculate comparison with previous period
  const prevCutoffDate = subDays(cutoffDate, parseInt(timeRange));
  const prevPeriodLogs = logs.filter(log => {
    const date = new Date(log.created_date);
    return date >= prevCutoffDate && date < cutoffDate;
  });

  const handleExport = () => {
    const sugarLogs = filteredLogs.filter(l => l.log_type === "sugar" && l.numeric_value);
    const bpLogs = filteredLogs.filter(l => l.log_type === "blood_pressure");
    
    let csv = "Date,Type,Value,Time of Day,Notes\n";
    
    filteredLogs.forEach(log => {
      csv += `${format(new Date(log.created_date), "yyyy-MM-dd HH:mm")},${log.log_type},${log.value || log.numeric_value},"${log.time_of_day || ''}","${log.notes || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-progress-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {isDemo && <DemoBanner />}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2 sm:gap-3">
              <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              Progress Tracking
            </h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">Comprehensive view of your health trends</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-28 sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} variant="outline" size="sm" className="sm:size-default">
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Progress Stats */}
        <ProgressStats 
          currentLogs={filteredLogs}
          previousLogs={prevPeriodLogs}
          profile={profile}
          achievements={achievements}
        />

        {/* Comparison Cards */}
        <ComparisonCards 
          currentLogs={filteredLogs}
          previousLogs={prevPeriodLogs}
          timeRange={parseInt(timeRange)}
        />

        {/* Charts Section */}
        <Tabs defaultValue="analytics" className="mt-8">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1 mb-6">
            <TabsTrigger value="analytics" className="flex-1 min-w-[80px] text-xs sm:text-sm flex items-center gap-1">
              <BarChart2 className="w-3 h-3" />Analytics
            </TabsTrigger>
            <TabsTrigger value="sugar" className="flex-1 min-w-[80px] text-xs sm:text-sm">Sugar</TabsTrigger>
            <TabsTrigger value="bp" className="flex-1 min-w-[80px] text-xs sm:text-sm">BP</TabsTrigger>
            <TabsTrigger value="medication" className="flex-1 min-w-[80px] text-xs sm:text-sm">Meds</TabsTrigger>
            <TabsTrigger value="activity" className="flex-1 min-w-[80px] text-xs sm:text-sm">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <MultiMetricDashboard 
              logs={filteredLogs}
              adherenceData={adherenceData}
              profile={profile}
            />
          </TabsContent>

          <TabsContent value="sugar" className="space-y-6">
            <SugarTrendChart 
              logs={filteredLogs}
              targetFasting={profile?.target_sugar_fasting || 100}
              targetPostMeal={profile?.target_sugar_post_meal || 140}
            />
            <div className="grid md:grid-cols-2 gap-6">
              <SugarDistributionChart 
                logs={filteredLogs}
                targetPostMeal={profile?.target_sugar_post_meal || 140}
              />
              <TimeOfDayChart logs={filteredLogs} />
            </div>
          </TabsContent>

          <TabsContent value="bp" className="space-y-6">
            <BPTrendChart logs={filteredLogs} />
            <Card className="p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Blood Pressure Summary</h3>
              <BPSummaryStats logs={filteredLogs} profile={profile} />
            </Card>
          </TabsContent>

          <TabsContent value="medication" className="space-y-6">
            <MedicationAdherenceChart 
              logs={filteredLogs}
              profile={profile}
              timeRange={parseInt(timeRange)}
            />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <LoggingActivityChart logs={filteredLogs} />
            <LoggingStreakCard achievements={achievements} logs={logs} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function BPSummaryStats({ logs, profile }) {
  const bpLogs = logs.filter(l => l.log_type === "blood_pressure" && l.value);
  
  if (bpLogs.length === 0) {
    return <p className="text-slate-400 text-sm">No blood pressure data available</p>;
  }

  const bpValues = bpLogs.map(log => {
    const parts = log.value.match(/(\d+)\/(\d+)/);
    return parts ? { systolic: parseInt(parts[1]), diastolic: parseInt(parts[2]) } : null;
  }).filter(Boolean);

  const avgSystolic = Math.round(bpValues.reduce((a, b) => a + b.systolic, 0) / bpValues.length);
  const avgDiastolic = Math.round(bpValues.reduce((a, b) => a + b.diastolic, 0) / bpValues.length);
  const maxSystolic = Math.max(...bpValues.map(v => v.systolic));
  const minSystolic = Math.min(...bpValues.map(v => v.systolic));

  const targetSystolic = profile?.target_bp_systolic || 120;
  const targetDiastolic = profile?.target_bp_diastolic || 80;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
      <div className="bg-blue-50 rounded-xl p-3 sm:p-4 text-center">
        <p className="text-lg sm:text-2xl font-bold text-blue-700">{avgSystolic}/{avgDiastolic}</p>
        <p className="text-[10px] sm:text-xs text-blue-600 mt-1">Average BP</p>
      </div>
      <div className="bg-slate-50 rounded-xl p-3 sm:p-4 text-center">
        <p className="text-lg sm:text-2xl font-bold text-slate-700">{maxSystolic}/{Math.max(...bpValues.map(v => v.diastolic))}</p>
        <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Highest</p>
      </div>
      <div className="bg-slate-50 rounded-xl p-3 sm:p-4 text-center">
        <p className="text-lg sm:text-2xl font-bold text-slate-700">{minSystolic}/{Math.min(...bpValues.map(v => v.diastolic))}</p>
        <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Lowest</p>
      </div>
      <div className="bg-green-50 rounded-xl p-3 sm:p-4 text-center">
        <p className="text-lg sm:text-2xl font-bold text-green-700">{targetSystolic}/{targetDiastolic}</p>
        <p className="text-[10px] sm:text-xs text-green-600 mt-1">Target</p>
      </div>
    </div>
  );
}

function LoggingActivityChart({ logs }) {
  const days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), 29 - i));
  
  const data = days.map(day => {
    const dayLogs = logs.filter(log => {
      const logDate = startOfDay(new Date(log.created_date));
      return logDate.getTime() === startOfDay(day).getTime();
    });

    return {
      date: format(day, "MMM d"),
      count: dayLogs.length,
      types: {
        sugar: dayLogs.filter(l => l.log_type === "sugar").length,
        bp: dayLogs.filter(l => l.log_type === "blood_pressure").length,
        meal: dayLogs.filter(l => l.log_type === "meal").length,
        medication: dayLogs.filter(l => l.log_type === "medication").length,
      }
    };
  });

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="font-semibold text-slate-800 mb-4 text-sm sm:text-base">Daily Logging Activity</h3>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {data.slice(-28).map((day, idx) => (
          <div key={idx} className="text-center">
            <div 
              className={`h-8 sm:h-12 rounded-lg flex items-center justify-center text-xs sm:text-sm font-semibold ${
                day.count === 0 ? 'bg-slate-100 text-slate-300' :
                day.count < 3 ? 'bg-amber-100 text-amber-700' :
                'bg-green-100 text-green-700'
              }`}
            >
              {day.count}
            </div>
            <p className="text-[8px] sm:text-[10px] text-slate-400 mt-1">{format(new Date(day.date), 'd')}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4 text-[10px] sm:text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-slate-100" /> No logs
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-amber-100" /> 1-2 logs
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-green-100" /> 3+ logs
        </div>
      </div>
    </Card>
  );
}

function LoggingStreakCard({ achievements, logs }) {
  const currentStreak = achievements?.current_streak || 0;
  const longestStreak = achievements?.longest_streak || 0;
  
  return (
    <Card className="p-4 sm:p-6">
      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2 text-sm sm:text-base">
        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
        Logging Consistency
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3 sm:p-5 text-center border border-orange-100">
          <p className="text-2xl sm:text-4xl font-bold text-orange-600 mb-1">{currentStreak}</p>
          <p className="text-xs sm:text-sm text-orange-700">Current Streak</p>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-3 sm:p-5 text-center border border-violet-100">
          <p className="text-2xl sm:text-4xl font-bold text-violet-600 mb-1">{longestStreak}</p>
          <p className="text-xs sm:text-sm text-violet-700">Longest Streak</p>
        </div>
      </div>
    </Card>
  );
}