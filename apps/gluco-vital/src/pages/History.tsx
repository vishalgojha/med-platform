import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { Calendar as CalendarIcon, Filter, Droplet, Heart, Utensils, Pill, Activity, Download, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LogCard from "@/components/dashboard/LogCard";
import SugarChart from "@/components/dashboard/SugarChart";
import LabResultsList from "@/components/labs/LabResultsList";
import HbA1cTrendChart from "@/components/labs/HbA1cTrendChart";
import { generateDemoData } from "@/components/demo/DemoDataGenerator";
import DemoBanner from "@/components/demo/DemoBanner";

export default function History() {
  const [user, setUser] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [logType, setLogType] = useState("all");
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
    queryKey: ['health-logs-history', user?.email, isDemo],
    queryFn: async () => {
      if (isDemo && demoData) {
        return demoData.logs.filter(log => log.status !== 'corrected' && log.status !== 'deleted');
      }
      // Fetch all logs and filter by user_email OR created_by (agent logs use created_by)
      const results = await appClient.entities.HealthLog.list('-created_date', 500);
      // Exclude corrected/deleted logs from display
      return results.filter(log => 
        (log.user_email === user?.email || log.created_by === user?.email) &&
        log.status !== 'corrected' && log.status !== 'deleted'
      );
    },
    enabled: !!user?.email || isDemo
  });

  const { data: profile } = useQuery({
    queryKey: ['patient-profile', isDemo],
    queryFn: async () => {
      if (isDemo && demoData) {
        return demoData.profile;
      }
      const results = await appClient.entities.PatientProfile.filter({ user_email: user?.email });
      return results?.[0];
    },
    enabled: !!user?.email || isDemo
  });

  const { data: labResults = [], refetch: refetchLabResults } = useQuery({
    queryKey: ['lab-results-history', user?.email, isDemo],
    queryFn: async () => {
      if (isDemo && demoData) {
        return demoData.labResults;
      }
      const results = await appClient.entities.LabResult.list('-test_date', 200);
      return results.filter(r => r.user_email === user?.email || r.created_by === user?.email);
    },
    enabled: !!user?.email || isDemo
  });

  const filteredLogs = logs.filter(log => {
    const logDate = new Date(log.created_date);
    const withinDate = isWithinInterval(logDate, {
      start: startOfDay(dateRange.from),
      end: endOfDay(dateRange.to)
    });
    const matchesType = logType === "all" || log.log_type === logType;
    return withinDate && matchesType;
  });

  const logTypes = [
    { value: "all", label: "All Types", icon: Activity },
    { value: "sugar", label: "Sugar", icon: Droplet },
    { value: "blood_pressure", label: "Blood Pressure", icon: Heart },
    { value: "meal", label: "Meals", icon: Utensils },
    { value: "medication", label: "Medication", icon: Pill },
  ];

  const getStats = () => {
    const sugarLogs = filteredLogs.filter(l => l.log_type === "sugar" && l.numeric_value);
    const avgSugar = sugarLogs.length > 0 
      ? Math.round(sugarLogs.reduce((a, b) => a + b.numeric_value, 0) / sugarLogs.length)
      : null;
    const maxSugar = sugarLogs.length > 0 
      ? Math.max(...sugarLogs.map(l => l.numeric_value))
      : null;
    const minSugar = sugarLogs.length > 0 
      ? Math.min(...sugarLogs.map(l => l.numeric_value))
      : null;

    return { avgSugar, maxSugar, minSugar, totalLogs: filteredLogs.length };
  };

  const stats = getStats();

  const groupLogsByDate = () => {
    const grouped = {};
    filteredLogs.forEach(log => {
      const dateKey = format(new Date(log.created_date), "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(log);
    });
    return grouped;
  };

  const groupedLogs = groupLogsByDate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {isDemo && <DemoBanner />}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Health History</h1>
            <p className="text-slate-500 mt-1">View and analyze your health logs & lab results</p>
          </div>
        </div>

        {/* Main Tabs for Daily Logs vs Lab Results */}
        <Tabs defaultValue="daily" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Activity className="w-4 h-4" /> Daily Logs
            </TabsTrigger>
            <TabsTrigger value="labs" className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4" /> Lab Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="labs" className="space-y-6">
            {/* HbA1c Trend */}
            <HbA1cTrendChart labResults={labResults} targetHbA1c={7} />

            {/* All Lab Results */}
            <Card className="border-slate-100 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FlaskConical className="w-5 h-5 text-purple-600" />
                  All Lab Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LabResultsList 
                  results={labResults}
                  userEmail={user?.email}
                  onAddResult={async (data) => {
                    await appClient.entities.LabResult.create(data);
                    refetchLabResults();
                  }}
                  onUpdateResult={async (id, data) => {
                    await appClient.entities.LabResult.update(id, data);
                    refetchLabResults();
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daily">

        {/* Filters */}
        <Card className="border-slate-100 shadow-sm mb-6">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 sm:items-end">
              <div className="flex-1 min-w-0">
                <label className="text-sm font-medium text-slate-600 block mb-1.5">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-[260px] justify-start text-left font-normal text-sm">
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {dateRange.from && dateRange.to ? (
                          <>
                            {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
                          </>
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={(range) => range && setDateRange(range)}
                      numberOfMonths={1}
                      className="sm:hidden"
                    />
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={(range) => range && setDateRange(range)}
                      numberOfMonths={2}
                      className="hidden sm:block"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex-1 min-w-0 sm:flex-none">
                <label className="text-sm font-medium text-slate-600 block mb-1.5">Log Type</label>
                <Select value={logType} onValueChange={setLogType}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {logTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
                <Button 
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                  onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}
                >
                  7 Days
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                  onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}
                >
                  30 Days
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <p className="text-sm text-slate-500">Total Logs</p>
            <p className="text-2xl font-bold text-slate-800">{stats.totalLogs}</p>
          </div>
          {stats.avgSugar && (
            <>
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <p className="text-sm text-slate-500">Avg Sugar</p>
                <p className="text-2xl font-bold text-blue-600">{stats.avgSugar}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <p className="text-sm text-slate-500">Highest</p>
                <p className="text-2xl font-bold text-orange-600">{stats.maxSugar}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100">
                <p className="text-sm text-slate-500">Lowest</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.minSugar}</p>
              </div>
            </>
          )}
        </div>

        {/* Sugar Chart */}
        {(logType === "all" || logType === "sugar") && (
          <Card className="border-slate-100 shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Sugar Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <SugarChart 
                logs={filteredLogs}
                targetFasting={profile?.target_sugar_fasting || 100}
                targetPostMeal={profile?.target_sugar_post_meal || 140}
              />
            </CardContent>
          </Card>
        )}

        {/* Logs by Date */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : Object.keys(groupedLogs).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedLogs).map(([date, dayLogs]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="outline" className="px-3 py-1 bg-white">
                    {format(new Date(date), "EEEE, MMMM d")}
                  </Badge>
                  <span className="text-xs text-slate-400">{dayLogs.length} logs</span>
                </div>
                <div className="space-y-3">
                  {dayLogs.map(log => (
                    <LogCard key={log.id} log={log} timezone={profile?.timezone || "Asia/Kolkata"} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No logs found for the selected filters</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your date range or log type</p>
          </div>
        )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}