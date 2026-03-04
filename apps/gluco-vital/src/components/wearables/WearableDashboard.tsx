import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Watch, Heart, Moon, Footprints, Activity, TrendingUp, Calendar } from "lucide-react";
import { format, subDays, differenceInDays } from "date-fns";
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function WearableDashboard({ userEmail, timeRange = 7 }) {
  const { data: logs = [] } = useQuery({
    queryKey: ['wearable-data', userEmail, timeRange],
    queryFn: () => appClient.entities.HealthLog.filter({ user_email: userEmail }, '-created_date', 500),
    enabled: !!userEmail
  });

  // Filter wearable data
  const cutoffDate = subDays(new Date(), timeRange);
  const wearableLogs = logs.filter(l => 
    new Date(l.created_date) >= cutoffDate &&
    ['steps', 'heart_rate', 'sleep'].includes(l.log_type) &&
    ['fitbit', 'apple_health', 'google_fit'].includes(l.source)
  );

  const stepsLogs = wearableLogs.filter(l => l.log_type === 'steps');
  const heartRateLogs = wearableLogs.filter(l => l.log_type === 'heart_rate');
  const sleepLogs = wearableLogs.filter(l => l.log_type === 'sleep');

  // Calculate stats
  const totalSteps = stepsLogs.reduce((sum, l) => sum + (l.numeric_value || 0), 0);
  const avgDailySteps = stepsLogs.length > 0 ? Math.round(totalSteps / timeRange) : 0;
  const avgHeartRate = heartRateLogs.length > 0 
    ? Math.round(heartRateLogs.reduce((sum, l) => sum + (l.numeric_value || 0), 0) / heartRateLogs.length)
    : 0;
  const avgSleep = sleepLogs.length > 0
    ? (sleepLogs.reduce((sum, l) => sum + (l.numeric_value || 0), 0) / sleepLogs.length).toFixed(1)
    : 0;

  if (wearableLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Watch className="w-5 h-5 text-[#5b9a8b]" />
            Wearable Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Watch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No wearable data found</p>
            <p className="text-sm text-slate-400 mt-1">Import data from your wearable device</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Footprints className="w-8 h-8 text-blue-600" />
              <Badge variant="outline" className="text-xs">{stepsLogs.length} days</Badge>
            </div>
            <p className="text-2xl font-bold text-slate-800">{avgDailySteps.toLocaleString()}</p>
            <p className="text-sm text-slate-500">Avg Daily Steps</p>
            <p className="text-xs text-slate-400 mt-1">Total: {totalSteps.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-8 h-8 text-red-600" />
              <Badge variant="outline" className="text-xs">{heartRateLogs.length} readings</Badge>
            </div>
            <p className="text-2xl font-bold text-slate-800">{avgHeartRate}</p>
            <p className="text-sm text-slate-500">Avg Heart Rate (bpm)</p>
            <p className="text-xs text-slate-400 mt-1">Resting heart rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Moon className="w-8 h-8 text-indigo-600" />
              <Badge variant="outline" className="text-xs">{sleepLogs.length} nights</Badge>
            </div>
            <p className="text-2xl font-bold text-slate-800">{avgSleep}h</p>
            <p className="text-sm text-slate-500">Avg Sleep Duration</p>
            <p className="text-xs text-slate-400 mt-1">Per night average</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="steps" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="heart_rate">Heart Rate</TabsTrigger>
          <TabsTrigger value="sleep">Sleep</TabsTrigger>
        </TabsList>

        <TabsContent value="steps">
          <StepsChart logs={stepsLogs} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="heart_rate">
          <HeartRateChart logs={heartRateLogs} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="sleep">
          <SleepChart logs={sleepLogs} timeRange={timeRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StepsChart({ logs, timeRange }) {
  const data = Array.from({ length: timeRange }, (_, i) => {
    const date = subDays(new Date(), timeRange - 1 - i);
    const dayLogs = logs.filter(l => 
      Math.abs(differenceInDays(new Date(l.created_date), date)) < 1
    );
    const steps = dayLogs.reduce((sum, l) => sum + (l.numeric_value || 0), 0);
    
    return {
      date: format(date, "MMM d"),
      steps,
      goal: 10000
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Footprints className="w-4 h-4 text-blue-600" />
          Daily Steps
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white rounded-lg shadow-lg p-3 border border-slate-100">
                      <p className="font-semibold text-slate-800">{data.steps.toLocaleString()} steps</p>
                      <p className="text-xs text-slate-500">{data.date}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {data.steps >= data.goal ? '✅ Goal reached!' : `${data.goal - data.steps} to goal`}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="steps" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>Daily Steps</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-600" />
            <span>Goal: 10,000</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HeartRateChart({ logs, timeRange }) {
  const data = logs.slice(0, 50).reverse().map(l => ({
    date: format(new Date(l.created_date), "MMM d HH:mm"),
    hr: l.numeric_value
  }));

  const avgHR = logs.length > 0 
    ? Math.round(logs.reduce((sum, l) => sum + (l.numeric_value || 0), 0) / logs.length)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-600" />
          Heart Rate Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94a3b8" interval={Math.floor(data.length / 8)} />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <Tooltip />
            <Area type="monotone" dataKey="hr" stroke="#ef4444" fill="url(#hrGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="text-center mt-4">
          <p className="text-sm text-slate-500">Average: <span className="font-bold text-red-600">{avgHR} bpm</span></p>
        </div>
      </CardContent>
    </Card>
  );
}

function SleepChart({ logs, timeRange }) {
  const data = Array.from({ length: Math.min(timeRange, 14) }, (_, i) => {
    const date = subDays(new Date(), Math.min(timeRange, 14) - 1 - i);
    const dayLog = logs.find(l => 
      Math.abs(differenceInDays(new Date(l.created_date), date)) < 1
    );
    
    return {
      date: format(date, "MMM d"),
      hours: dayLog?.numeric_value || 0,
      goal: 7
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Moon className="w-4 h-4 text-indigo-600" />
          Sleep Duration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <YAxis domain={[0, 12]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white rounded-lg shadow-lg p-3 border border-slate-100">
                      <p className="font-semibold text-slate-800">{data.hours}h sleep</p>
                      <p className="text-xs text-slate-500">{data.date}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {data.hours >= 7 ? '✅ Good sleep' : '⚠️ Need more rest'}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line type="monotone" dataKey="goal" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={1} dot={false} />
            <Line type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: "#6366f1" }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span>Sleep Hours</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-slate-400 rounded-full" />
            <span>Goal: 7h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}