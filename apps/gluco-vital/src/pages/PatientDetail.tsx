import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Droplet, Heart, Activity, Pill, Utensils, TrendingUp, TrendingDown, Minus, Calendar, Loader2, AlertTriangle, User } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, subDays, isToday, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from "recharts";

export default function PatientDetail() {
  const [user, setUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const patientEmail = urlParams.get('email');
  const connectionId = urlParams.get('connection');

  useEffect(() => {
    appClient.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: connection } = useQuery({
    queryKey: ['connection', connectionId],
    queryFn: async () => {
      const conns = await appClient.entities.DoctorConnection.filter({ id: connectionId });
      return conns[0];
    },
    enabled: !!connectionId
  });

  const { data: profile } = useQuery({
    queryKey: ['patient-profile', patientEmail],
    queryFn: () => appClient.entities.PatientProfile.filter({ user_email: patientEmail }),
    enabled: !!patientEmail,
    select: data => data?.[0]
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['patient-logs-detail', patientEmail],
    queryFn: () => appClient.entities.HealthLog.filter(
      { user_email: patientEmail },
      '-created_date',
      200
    ),
    enabled: !!patientEmail && connection?.permissions?.includes('view_logs')
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['patient-reports', patientEmail],
    queryFn: () => appClient.entities.HealthReport.filter(
      { user_email: patientEmail },
      '-created_date',
      10
    ),
    enabled: !!patientEmail && connection?.permissions?.includes('view_reports')
  });

  const { data: feedback = [] } = useQuery({
    queryKey: ['patient-feedback', patientEmail],
    queryFn: () => appClient.entities.DoctorFeedback.filter({ patient_email: patientEmail }),
    enabled: !!patientEmail
  });

  // Process logs
  const sugarLogs = logs.filter(l => l.log_type === "sugar" && l.numeric_value);
  const bpLogs = logs.filter(l => l.log_type === "blood_pressure");
  const mealLogs = logs.filter(l => l.log_type === "meal");
  const medicationLogs = logs.filter(l => l.log_type === "medication");

  // Sugar stats
  const avgSugar = sugarLogs.length > 0
    ? Math.round(sugarLogs.reduce((a, b) => a + b.numeric_value, 0) / sugarLogs.length)
    : null;
  const maxSugar = sugarLogs.length > 0 ? Math.max(...sugarLogs.map(l => l.numeric_value)) : null;
  const minSugar = sugarLogs.length > 0 ? Math.min(...sugarLogs.map(l => l.numeric_value)) : null;

  // Chart data
  const chartData = sugarLogs.slice(0, 30).reverse().map(log => ({
    date: format(new Date(log.created_date), "MMM d"),
    time: format(new Date(log.created_date), "h:mm a"),
    value: log.numeric_value,
    timeOfDay: log.time_of_day
  }));

  // Weekly pattern
  const weeklyPattern = {};
  sugarLogs.forEach(log => {
    const day = format(new Date(log.created_date), "EEEE");
    if (!weeklyPattern[day]) weeklyPattern[day] = [];
    weeklyPattern[day].push(log.numeric_value);
  });

  // Time of day analysis
  const timeOfDayStats = {};
  sugarLogs.forEach(log => {
    const tod = log.time_of_day || 'other';
    if (!timeOfDayStats[tod]) timeOfDayStats[tod] = [];
    timeOfDayStats[tod].push(log.numeric_value);
  });

  const timeOfDayAvg = Object.entries(timeOfDayStats).map(([time, values]) => ({
    time: time.replace(/_/g, ' '),
    avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    count: values.length
  })).sort((a, b) => b.count - a.count);

  if (!user || !patientEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-3 flex-1">
            <Link to={createPageUrl("DoctorDashboard")}>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">{connection?.patient_name || "Patient"}</h1>
              <p className="text-slate-500 text-sm truncate">{patientEmail}</p>
            </div>
          </div>
          <Link to={createPageUrl(`DoctorFeedback?connection=${connectionId}`)} className="w-full sm:w-auto">
            <Button className="bg-[#5b9a8b] hover:bg-[#4a8a7b] w-full sm:w-auto">
              Add Feedback
            </Button>
          </Link>
        </div>

        {/* Patient Info */}
        <Card className="mb-4 md:mb-6">
          <CardContent className="p-3 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#5b9a8b]/20 to-[#7eb8a8]/20 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-[#5b9a8b]" />
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full">
                <div>
                  <p className="text-xs text-slate-500">Age</p>
                  <p className="font-medium text-sm sm:text-base">{profile?.age || "--"} years</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Gender</p>
                  <p className="font-medium text-sm sm:text-base capitalize">{profile?.gender || "--"}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs text-slate-500">Conditions</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(profile?.conditions || []).map(c => (
                      <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500">On Insulin</p>
                  <p className="font-medium text-sm sm:text-base">{profile?.is_on_insulin ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>

            {/* Targets */}
            {profile && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <p className="text-[10px] sm:text-xs text-blue-600">Target Fasting</p>
                  <p className="font-bold text-sm sm:text-base text-blue-800">{profile.target_sugar_fasting || 100} <span className="text-xs font-normal">mg/dL</span></p>
                </div>
                <div className="p-2 sm:p-3 bg-violet-50 rounded-lg">
                  <p className="text-[10px] sm:text-xs text-violet-600">Target Post-Meal</p>
                  <p className="font-bold text-sm sm:text-base text-violet-800">{profile.target_sugar_post_meal || 140} <span className="text-xs font-normal">mg/dL</span></p>
                </div>
                <div className="p-2 sm:p-3 bg-red-50 rounded-lg">
                  <p className="text-[10px] sm:text-xs text-red-600">BP Systolic</p>
                  <p className="font-bold text-sm sm:text-base text-red-800">{profile.target_bp_systolic || 120} <span className="text-xs font-normal">mmHg</span></p>
                </div>
                <div className="p-2 sm:p-3 bg-orange-50 rounded-lg">
                  <p className="text-[10px] sm:text-xs text-orange-600">BP Diastolic</p>
                  <p className="font-bold text-sm sm:text-base text-orange-800">{profile.target_bp_diastolic || 80} <span className="text-xs font-normal">mmHg</span></p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4 mb-4 md:mb-6">
          <Card>
            <CardContent className="p-2 sm:p-4 text-center">
              <p className="text-xl sm:text-3xl font-bold text-blue-600">{avgSugar || "--"}</p>
              <p className="text-[10px] sm:text-xs text-slate-500">Avg Sugar</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-4 text-center">
              <p className="text-xl sm:text-3xl font-bold text-red-600">{maxSugar || "--"}</p>
              <p className="text-[10px] sm:text-xs text-slate-500">Highest</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-4 text-center">
              <p className="text-xl sm:text-3xl font-bold text-green-600">{minSugar || "--"}</p>
              <p className="text-[10px] sm:text-xs text-slate-500">Lowest</p>
            </CardContent>
          </Card>
          <Card className="hidden sm:block">
            <CardContent className="p-2 sm:p-4 text-center">
              <p className="text-xl sm:text-3xl font-bold text-slate-800">{sugarLogs.length}</p>
              <p className="text-[10px] sm:text-xs text-slate-500">Readings</p>
            </CardContent>
          </Card>
          <Card className="hidden sm:block">
            <CardContent className="p-2 sm:p-4 text-center">
              <p className="text-xl sm:text-3xl font-bold text-violet-600">{medicationLogs.length}</p>
              <p className="text-[10px] sm:text-xs text-slate-500">Med Logs</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="trends" className="space-y-4 md:space-y-6">
          <TabsList className="w-full flex overflow-x-auto no-scrollbar">
            <TabsTrigger value="trends" className="flex-1 text-xs sm:text-sm">Trends</TabsTrigger>
            <TabsTrigger value="patterns" className="flex-1 text-xs sm:text-sm">Patterns</TabsTrigger>
            <TabsTrigger value="logs" className="flex-1 text-xs sm:text-sm">Logs</TabsTrigger>
            <TabsTrigger value="feedback" className="flex-1 text-xs sm:text-sm">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="trends">
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  Sugar Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-6">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="sugarGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5b9a8b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#5b9a8b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis domain={[60, 250]} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload?.[0]) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 rounded-lg shadow-lg border">
                                <p className="font-medium">{data.value} mg/dL</p>
                                <p className="text-sm text-slate-500">{data.date} at {data.time}</p>
                                <p className="text-xs text-slate-400 capitalize">{data.timeOfDay?.replace(/_/g, ' ')}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <ReferenceLine y={profile?.target_sugar_fasting || 100} stroke="#22c55e" strokeDasharray="5 5" label="Target" />
                      <ReferenceLine y={180} stroke="#ef4444" strokeDasharray="5 5" label="High" />
                      <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="5 5" label="Low" />
                      <Area type="monotone" dataKey="value" stroke="#5b9a8b" fill="url(#sugarGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-slate-500">No sugar readings available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patterns">
            <div className="grid gap-4 md:grid-cols-2 md:gap-6">
              {/* Time of Day Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">By Time of Day</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {timeOfDayAvg.slice(0, 6).map(item => (
                      <div key={item.time} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{item.time}</p>
                          <p className="text-xs text-slate-500">{item.count} readings</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${item.avg > 180 ? 'text-red-600' : item.avg < 70 ? 'text-amber-600' : 'text-green-600'}`}>
                            {item.avg}
                          </p>
                          <p className="text-xs text-slate-500">mg/dL avg</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Concerning Readings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sugarLogs.filter(l => l.numeric_value > 180 || l.numeric_value < 70).slice(0, 5).map(log => (
                      <div key={log.id} className={`p-3 rounded-lg ${log.numeric_value > 180 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
                        <div className="flex justify-between">
                          <span className={`font-bold ${log.numeric_value > 180 ? 'text-red-700' : 'text-amber-700'}`}>
                            {log.numeric_value} mg/dL
                          </span>
                          <span className="text-xs text-slate-500">
                            {format(new Date(log.created_date), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 capitalize mt-1">
                          {log.time_of_day?.replace(/_/g, ' ')}
                        </p>
                      </div>
                    ))}
                    {sugarLogs.filter(l => l.numeric_value > 180 || l.numeric_value < 70).length === 0 && (
                      <p className="text-center text-slate-500 py-4">No concerning readings</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
                  {logs.slice(0, 50).map(log => (
                    <div key={log.id} className="p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
                      <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${
                        log.log_type === 'sugar' ? 'bg-blue-100' :
                        log.log_type === 'blood_pressure' ? 'bg-red-100' :
                        log.log_type === 'medication' ? 'bg-violet-100' :
                        log.log_type === 'meal' ? 'bg-green-100' : 'bg-slate-100'
                      }`}>
                        {log.log_type === 'sugar' && <Droplet className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />}
                        {log.log_type === 'blood_pressure' && <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />}
                        {log.log_type === 'medication' && <Pill className="w-3 h-3 sm:w-4 sm:h-4 text-violet-600" />}
                        {log.log_type === 'meal' && <Utensils className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">{log.value}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500 capitalize truncate">
                          {log.time_of_day?.replace(/_/g, ' ')} • {log.log_type.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs sm:text-sm text-slate-600">{format(new Date(log.created_date), "MMM d")}</p>
                        <p className="text-[10px] sm:text-xs text-slate-400">{format(new Date(log.created_date), "h:mm a")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback">
            <Card>
              <CardContent className="p-3 sm:p-6">
                {feedback.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-slate-500 text-sm sm:text-base">No feedback given yet</p>
                    <Link to={createPageUrl(`DoctorFeedback?connection=${connectionId}`)}>
                      <Button className="mt-4 bg-[#5b9a8b] hover:bg-[#4a8a7b]">
                        Add First Feedback
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedback.map(fb => (
                      <div key={fb.id} className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{fb.title}</h4>
                            <Badge variant="secondary" className="text-xs mt-1">{fb.feedback_type}</Badge>
                          </div>
                          <span className="text-xs text-slate-500">
                            {format(new Date(fb.created_date), "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{fb.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}