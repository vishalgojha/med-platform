import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Activity, FileText, TrendingUp, Droplet, Heart, 
  Loader2, ChevronRight, Brain, Calendar, Upload, MessageCircle,
  Target, Award, Utensils
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, subDays, isToday } from "date-fns";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";
import DocumentUploadModal from "@/components/documents/DocumentUploadModal";

export default function ClientPortal() {
  const [user, setUser] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    appClient.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: connections = [], isLoading: connectionsLoading } = useQuery({
    queryKey: ['coach-connections', user?.email],
    queryFn: () => appClient.entities.CoachConnection.filter({ coach_email: user?.email, status: "active" }),
    enabled: !!user?.email
  });

  // Auto-select first client
  useEffect(() => {
    if (connections.length > 0 && !selectedClient) {
      setSelectedClient(connections[0].client_email);
    }
  }, [connections, selectedClient]);

  const selectedConnection = connections.find(c => c.client_email === selectedClient);

  const { data: clientProfile } = useQuery({
    queryKey: ['client-profile', selectedClient],
    queryFn: () => appClient.entities.PatientProfile.filter({ user_email: selectedClient }),
    select: data => data?.[0],
    enabled: !!selectedClient
  });

  const { data: healthLogs = [] } = useQuery({
    queryKey: ['client-logs', selectedClient],
    queryFn: () => appClient.entities.HealthLog.filter({ user_email: selectedClient }, '-created_date', 100),
    enabled: !!selectedClient
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['client-documents', selectedClient],
    queryFn: () => appClient.entities.HealthDocument.filter({ owner_email: selectedClient }, '-created_date', 20),
    enabled: !!selectedClient
  });

  const { data: achievements } = useQuery({
    queryKey: ['client-achievements', selectedClient],
    queryFn: () => appClient.entities.UserAchievements.filter({ user_email: selectedClient }),
    select: data => data?.[0],
    enabled: !!selectedClient
  });

  // Process data
  const sugarLogs = healthLogs.filter(l => l.log_type === "sugar" && l.numeric_value);
  const mealLogs = healthLogs.filter(l => l.log_type === "meal");
  const todayLogs = healthLogs.filter(l => isToday(new Date(l.created_date)));

  const avgSugar = sugarLogs.length > 0
    ? Math.round(sugarLogs.slice(0, 7).reduce((a, b) => a + b.numeric_value, 0) / Math.min(sugarLogs.length, 7))
    : null;

  const chartData = sugarLogs.slice(0, 14).reverse().map(log => ({
    date: format(new Date(log.created_date), "MMM d"),
    value: log.numeric_value
  }));

  // Weekly logging trend
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayLogs = healthLogs.filter(l => 
      format(new Date(l.created_date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );
    return {
      day: format(date, "EEE"),
      count: dayLogs.length
    };
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#5b9a8b]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7f4] via-[#f8faf9] to-[#faf8f5]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Heart className="w-6 h-6 text-purple-500" />
              Client Portal
            </h1>
            <p className="text-slate-500 text-sm mt-1">Monitor your clients' health progress</p>
          </div>
          
          {connections.length > 0 && (
            <div className="flex items-center gap-3">
              <Select value={selectedClient || ""} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map(conn => (
                    <SelectItem key={conn.id} value={conn.client_email}>
                      {conn.client_name || conn.client_email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setShowUpload(true)} className="bg-purple-600 hover:bg-purple-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload for Client
              </Button>
            </div>
          )}
        </div>

        {connectionsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : connections.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No clients connected</h3>
              <p className="text-slate-400 text-sm mb-4">Invite clients to start monitoring their progress</p>
              <Link to={createPageUrl("CoachDashboard")}>
                <Button>Go to Coach Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        ) : selectedClient ? (
          <>
            {/* Client Header */}
            <Card className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-xl font-bold text-purple-600">
                      {selectedConnection?.client_name?.[0]?.toUpperCase() || "C"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-slate-800">
                      {selectedConnection?.client_name || "Client"}
                    </h2>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      {clientProfile?.age && <span>{clientProfile.age} years</span>}
                      {clientProfile?.conditions?.length > 0 && (
                        <span>• {clientProfile.conditions.join(", ")}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Activity className="w-4 h-4" />
                      <span>{todayLogs.length} logs today</span>
                    </div>
                    {achievements?.current_streak > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-amber-600">
                        <Award className="w-4 h-4" />
                        <span className="text-sm font-medium">{achievements.current_streak} day streak</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Droplet className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800">{sugarLogs[0]?.numeric_value || "--"}</p>
                      <p className="text-xs text-slate-500">Last Sugar</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800">{avgSugar || "--"}</p>
                      <p className="text-xs text-slate-500">7-Day Avg</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800">{documents.length}</p>
                      <p className="text-xs text-slate-500">Documents</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Target className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800">{achievements?.total_points || 0}</p>
                      <p className="text-xs text-slate-500">Points</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="logs">Health Logs</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Sugar Trend */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Droplet className="w-4 h-4 text-blue-500" />
                        Sugar Trend
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={chartData}>
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke="#5b9a8b" strokeWidth={2} dot={{ r: 2 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">
                          No sugar readings yet
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Activity Trend */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="w-4 h-4 text-purple-500" />
                        Weekly Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={last7Days}>
                          <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Recent Meals */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-amber-500" />
                        Recent Meals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {mealLogs.length > 0 ? (
                        <div className="space-y-2">
                          {mealLogs.slice(0, 4).map(log => (
                            <div key={log.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-700 truncate">{log.value}</p>
                                <p className="text-xs text-slate-400">{log.time_of_day?.replace(/_/g, ' ')}</p>
                              </div>
                              <span className="text-xs text-slate-400">
                                {format(new Date(log.created_date), "MMM d")}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-slate-400 py-4 text-sm">No meal logs</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={() => setShowUpload(true)} className="h-auto py-3 flex-col">
                          <Upload className="w-5 h-5 mb-1" />
                          <span className="text-xs">Upload Plan</span>
                        </Button>
                        <Link to={createPageUrl(`PatientDetail?email=${selectedClient}`)}>
                          <Button variant="outline" className="w-full h-auto py-3 flex-col">
                            <Brain className="w-5 h-5 mb-1" />
                            <span className="text-xs">Full Details</span>
                          </Button>
                        </Link>
                        <Button variant="outline" className="h-auto py-3 flex-col">
                          <MessageCircle className="w-5 h-5 mb-1" />
                          <span className="text-xs">Send Message</span>
                        </Button>
                        <Button variant="outline" className="h-auto py-3 flex-col">
                          <Calendar className="w-5 h-5 mb-1" />
                          <span className="text-xs">Schedule</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="logs">
                <Card>
                  <CardContent className="p-4">
                    {healthLogs.length > 0 ? (
                      <div className="space-y-2">
                        {healthLogs.slice(0, 20).map(log => (
                          <div key={log.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                              {log.log_type === "sugar" && <Droplet className="w-4 h-4 text-blue-500" />}
                              {log.log_type === "blood_pressure" && <Heart className="w-4 h-4 text-red-500" />}
                              {log.log_type === "meal" && <Utensils className="w-4 h-4 text-amber-500" />}
                              {!["sugar", "blood_pressure", "meal"].includes(log.log_type) && <Activity className="w-4 h-4 text-slate-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{log.log_type}</Badge>
                                <span className="text-sm font-medium text-slate-700 truncate">{log.value}</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{log.time_of_day?.replace(/_/g, ' ')}</p>
                            </div>
                            <span className="text-xs text-slate-400">
                              {format(new Date(log.created_date), "MMM d, h:mm a")}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-slate-400 py-8">No health logs yet</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents">
                <Card>
                  <CardContent className="p-4">
                    {documents.length > 0 ? (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {documents.map(doc => (
                          <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                             className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                            <FileText className="w-8 h-8 text-purple-500" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">{doc.title}</p>
                              <p className="text-xs text-slate-400">{doc.category?.replace(/_/g, ' ')}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-400 mb-3">No documents yet</p>
                        <Button onClick={() => setShowUpload(true)} variant="outline">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Document
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </div>

      {/* Upload Modal */}
      {selectedClient && (
        <DocumentUploadModal
          open={showUpload}
          onClose={() => setShowUpload(false)}
          user={user}
          ownerEmail={selectedClient}
          ownerName={selectedConnection?.client_name}
        />
      )}
    </div>
  );
}