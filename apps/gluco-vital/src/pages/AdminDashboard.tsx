import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Activity, FileText, MessageCircle, Shield, Search, 
  AlertTriangle, CheckCircle, XCircle, Loader2, RefreshCw,
  Calendar, Syringe, Globe, Phone, ChevronDown, ChevronUp,
  Droplet, Heart, Pill, UtensilsCrossed, TrendingUp, Clock,
  Eye, Mail, User, MapPin, Stethoscope
} from "lucide-react";
import { format, subDays, differenceInDays } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    appClient.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch all users
  const { data: allUsers = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => appClient.entities.User.list('-created_date', 500),
    enabled: user?.role === 'admin'
  });

  // Fetch all profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: () => appClient.entities.PatientProfile.list('-created_date', 500),
    enabled: user?.role === 'admin'
  });

  // Fetch all health logs (recent)
  const { data: recentLogs = [] } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => appClient.entities.HealthLog.list('-created_date', 1000),
    enabled: user?.role === 'admin'
  });

  // Fetch conversation memories
  const { data: memories = [] } = useQuery({
    queryKey: ['admin-memories'],
    queryFn: () => appClient.entities.ConversationMemory.list('-created_date', 500),
    enabled: user?.role === 'admin'
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
            <p className="text-slate-500 mt-2">Admin access required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats
  const today = new Date();
  const activeToday = new Set(recentLogs.filter(l => 
    differenceInDays(today, new Date(l.created_date)) === 0
  ).map(l => l.user_email || l.created_by)).size;

  const active7Days = new Set(recentLogs.filter(l => 
    differenceInDays(today, new Date(l.created_date)) <= 7
  ).map(l => l.user_email || l.created_by)).size;

  const insulinUsers = profiles.filter(p => p.is_on_insulin).length;
  const whatsappLinked = profiles.filter(p => p.whatsapp_connected).length;
  const withPrescription = profiles.filter(p => p.prescription_image_url).length;

  // Language breakdown
  const languageBreakdown = profiles.reduce((acc, p) => {
    const lang = p.language_preference || 'english';
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {});

  // Users with missing logs (active insulin users who stopped)
  const atRiskUsers = profiles.filter(p => {
    if (!p.is_on_insulin) return false;
    const userLogs = recentLogs.filter(l => 
      (l.user_email === p.user_email || l.created_by === p.user_email) &&
      l.log_type === 'sugar'
    );
    if (userLogs.length < 3) return false; // Not enough history
    const lastLog = userLogs[0];
    if (!lastLog) return true;
    return differenceInDays(today, new Date(lastLog.created_date)) >= 2;
  });

  // Filter users by search
  const filteredUsers = allUsers.filter(u => 
    !searchQuery || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getUserProfile = (email) => profiles.find(p => p.user_email === email);
  const getUserLogs = (email) => recentLogs.filter(l => l.user_email === email || l.created_by === email);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
            <p className="text-sm text-slate-500">Operational Control • {format(today, 'PPP')}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchUsers()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <StatBox label="Total Users" value={allUsers.length} icon={Users} />
          <StatBox label="Active Today" value={activeToday} icon={Activity} color="green" />
          <StatBox label="Active 7d" value={active7Days} icon={Activity} />
          <StatBox label="Insulin Users" value={insulinUsers} icon={Syringe} color="amber" />
          <StatBox label="WhatsApp Linked" value={whatsappLinked} icon={Phone} color="green" />
          <StatBox label="Has Prescription" value={withPrescription} icon={FileText} />
        </div>

        {/* At Risk Alert */}
        {atRiskUsers.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 font-medium">
              <AlertTriangle className="w-5 h-5" />
              {atRiskUsers.length} insulin user(s) stopped logging (48h+ silence)
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {atRiskUsers.slice(0, 5).map(p => (
                <Badge key={p.id} variant="outline" className="text-red-700 border-red-300">
                  {p.name || p.user_email}
                </Badge>
              ))}
              {atRiskUsers.length > 5 && <Badge variant="outline">+{atRiskUsers.length - 5} more</Badge>}
            </div>
          </div>
        )}

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-white border">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="logs">Data Health</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="agent">Agent Control</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Users & Accounts</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="Search by email or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-slate-500">
                        <th className="pb-2 font-medium">User</th>
                        <th className="pb-2 font-medium">Joined</th>
                        <th className="pb-2 font-medium">Last Log</th>
                        <th className="pb-2 font-medium">Logs (7d)</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Lang</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.slice(0, 50).map(u => (
                        <UserRow 
                          key={u.id} 
                          user={u} 
                          profile={getUserProfile(u.email)} 
                          logs={getUserLogs(u.email)} 
                          today={today}
                        />
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length > 50 && (
                    <p className="text-center text-sm text-slate-500 mt-4">
                      Showing 50 of {filteredUsers.length} users
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Health Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Health Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Log type breakdown */}
                  <div>
                    <h4 className="font-medium text-slate-700 mb-3">Logs by Type (Last 7 Days)</h4>
                    <div className="space-y-2">
                      {['sugar', 'blood_pressure', 'meal', 'medication', 'symptom'].map(type => {
                        const count = recentLogs.filter(l => 
                          l.log_type === type && 
                          differenceInDays(today, new Date(l.created_date)) <= 7
                        ).length;
                        return (
                          <div key={type} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                            <span className="capitalize text-sm">{type.replace('_', ' ')}</span>
                            <span className="font-mono font-medium">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Language breakdown */}
                  <div>
                    <h4 className="font-medium text-slate-700 mb-3">Users by Language</h4>
                    <div className="space-y-2">
                      {Object.entries(languageBreakdown).sort((a, b) => b[1] - a[1]).map(([lang, count]) => (
                        <div key={lang} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <span className="capitalize text-sm">{lang}</span>
                          <span className="font-mono font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Users with incomplete data */}
                <div className="mt-6">
                  <h4 className="font-medium text-slate-700 mb-3">Users Missing Data</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-slate-500">
                          <th className="pb-2 font-medium">User</th>
                          <th className="pb-2 font-medium">Profile</th>
                          <th className="pb-2 font-medium">Prescription</th>
                          <th className="pb-2 font-medium">Sugar Logs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allUsers.slice(0, 20).map(u => {
                          const profile = getUserProfile(u.email);
                          const sugarLogs = getUserLogs(u.email).filter(l => l.log_type === 'sugar');
                          const hasProfile = !!profile?.name;
                          const hasRx = !!profile?.prescription_image_url;
                          
                          return (
                            <tr key={u.id} className="border-b">
                              <td className="py-2 text-slate-600">{u.email}</td>
                              <td className="py-2">
                                {hasProfile ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-400" />
                                )}
                              </td>
                              <td className="py-2">
                                {hasRx ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-slate-300" />
                                )}
                              </td>
                              <td className="py-2 font-mono">{sugarLogs.length}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prescription Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-slate-500">
                        <th className="pb-2 font-medium">User</th>
                        <th className="pb-2 font-medium">Prescription Date</th>
                        <th className="pb-2 font-medium">Age</th>
                        <th className="pb-2 font-medium">Clinic</th>
                        <th className="pb-2 font-medium">Image</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.filter(p => p.prescription_image_url).map(p => {
                        const rxDate = p.prescription_date ? new Date(p.prescription_date) : null;
                        const monthsOld = rxDate ? Math.floor(differenceInDays(today, rxDate) / 30) : null;
                        const isExpired = monthsOld >= (p.prescription_valid_months || 3);
                        
                        return (
                          <tr key={p.id} className="border-b">
                            <td className="py-2">
                              <p className="font-medium text-slate-800">{p.name || '—'}</p>
                              <p className="text-xs text-slate-500">{p.user_email}</p>
                            </td>
                            <td className="py-2 text-slate-600">
                              {rxDate ? format(rxDate, 'MMM d, yyyy') : '—'}
                            </td>
                            <td className="py-2">
                              {monthsOld !== null ? (
                                <span className={isExpired ? 'text-red-600 font-medium' : 'text-slate-600'}>
                                  {monthsOld}mo {isExpired && '⚠️'}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="py-2 text-slate-600 max-w-[200px] truncate">
                              {p.prescription_clinic || '—'}
                            </td>
                            <td className="py-2">
                              <a 
                                href={p.prescription_image_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-xs"
                              >
                                View
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {profiles.filter(p => p.prescription_image_url).length === 0 && (
                    <p className="text-center text-slate-500 py-8">No prescriptions uploaded yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agent Control Tab */}
          <TabsContent value="agent">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Agent Control (Priya)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Agent Status */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="font-medium text-green-800">Agent Active</span>
                    </div>
                    <Badge className="bg-green-100 text-green-700">v1.0</Badge>
                  </div>
                </div>

                {/* Key Settings */}
                <div>
                  <h4 className="font-medium text-slate-700 mb-3">Agent Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-3 bg-slate-50 rounded">
                      <span className="text-slate-600">Name</span>
                      <span className="font-medium">Priya (AI Health Companion)</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 rounded">
                      <span className="text-slate-600">Tone</span>
                      <span className="font-medium">Warm, Supportive, Clear</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 rounded">
                      <span className="text-slate-600">Creator Attribution</span>
                      <span className="font-medium">Chaos Craft Labs</span>
                    </div>
                    <div className="flex justify-between p-3 bg-slate-50 rounded">
                      <span className="text-slate-600">Emergency Thresholds</span>
                      <span className="font-medium">Sugar &gt;300 or &lt;70, BP &gt;180/120</span>
                    </div>
                  </div>
                </div>

                {/* Recent Memories */}
                <div>
                  <h4 className="font-medium text-slate-700 mb-3">Recent Agent Memories ({memories.length})</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {memories.slice(0, 20).map(m => (
                      <div key={m.id} className="p-2 bg-slate-50 rounded text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-700">{m.key}</span>
                          <Badge variant="outline" className="text-xs">{m.memory_type}</Badge>
                        </div>
                        <p className="text-slate-600 truncate">{m.value}</p>
                        <p className="text-xs text-slate-400">{m.user_email}</p>
                      </div>
                    ))}
                    {memories.length === 0 && (
                      <p className="text-slate-500 text-center py-4">No memories stored yet</p>
                    )}
                  </div>
                </div>

                {/* Safety Note */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                  <p className="font-medium text-amber-800">⚠️ Safety Controls</p>
                  <p className="text-amber-700 mt-1">
                    Agent will not diagnose, prescribe, or change medication dosage. 
                    Emergency thresholds trigger immediate escalation advice.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon: Icon, color = 'slate' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600'
  };
  
  return (
    <div className="bg-white rounded-lg p-3 border">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500">{label}</span>
        <div className={`p-1 rounded ${colors[color]}`}>
          <Icon className="w-3 h-3" />
        </div>
      </div>
      <p className="text-xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

function UserRow({ user, profile, logs, today }) {
  const [expanded, setExpanded] = React.useState(false);
  
  const last7d = logs.filter(l => differenceInDays(today, new Date(l.created_date)) <= 7);
  const lastLog = logs[0];
  const daysSinceLog = lastLog ? differenceInDays(today, new Date(lastLog.created_date)) : null;
  
  // Calculate stats
  const sugarLogs = logs.filter(l => l.log_type === 'sugar' && l.numeric_value);
  const bpLogs = logs.filter(l => l.log_type === 'blood_pressure');
  const mealLogs = logs.filter(l => l.log_type === 'meal');
  const medLogs = logs.filter(l => l.log_type === 'medication');
  
  const lastSugar = sugarLogs[0]?.numeric_value;
  const avgSugar = sugarLogs.length > 0 
    ? Math.round(sugarLogs.slice(0, 7).reduce((a, b) => a + b.numeric_value, 0) / Math.min(sugarLogs.length, 7))
    : null;
  const lastBP = bpLogs[0]?.value;
  
  // Recent 7d breakdown
  const sugar7d = sugarLogs.filter(l => differenceInDays(today, new Date(l.created_date)) <= 7);
  const bp7d = bpLogs.filter(l => differenceInDays(today, new Date(l.created_date)) <= 7);
  const meal7d = mealLogs.filter(l => differenceInDays(today, new Date(l.created_date)) <= 7);
  const med7d = medLogs.filter(l => differenceInDays(today, new Date(l.created_date)) <= 7);

  return (
    <>
      <tr 
        className={`border-b hover:bg-slate-50 cursor-pointer ${expanded ? 'bg-blue-50' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="py-2">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            <div>
              <p className="font-medium text-slate-800">{user.full_name || '—'}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
        </td>
        <td className="py-2 text-slate-600">
          {format(new Date(user.created_date), 'MMM d')}
        </td>
        <td className="py-2">
          {lastLog ? (
            <span className={daysSinceLog > 3 ? 'text-red-600' : 'text-slate-600'}>
              {daysSinceLog === 0 ? 'Today' : `${daysSinceLog}d ago`}
            </span>
          ) : '—'}
        </td>
        <td className="py-2 text-slate-600">{last7d.length}</td>
        <td className="py-2">
          <div className="flex gap-1">
            {profile?.is_on_insulin && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">INS</Badge>
            )}
            {profile?.whatsapp_connected && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">WA</Badge>
            )}
            {profile?.prescription_image_url && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">RX</Badge>
            )}
          </div>
        </td>
        <td className="py-2 text-slate-600 text-xs uppercase">
          {profile?.language_preference?.slice(0, 2) || 'en'}
        </td>
      </tr>
      
      {/* Expanded Details Row */}
      {expanded && (
        <tr className="bg-slate-50 border-b">
          <td colSpan={6} className="p-4">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Profile Info */}
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Name</span>
                    <span className="font-medium">{profile?.name || user.full_name || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Age</span>
                    <span className="font-medium">{profile?.age || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gender</span>
                    <span className="font-medium capitalize">{profile?.gender || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Conditions</span>
                    <span className="font-medium">{profile?.conditions?.join(', ') || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">On Insulin</span>
                    <span className={`font-medium ${profile?.is_on_insulin ? 'text-amber-600' : ''}`}>
                      {profile?.is_on_insulin ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Language</span>
                    <span className="font-medium capitalize">{profile?.language_preference || 'English'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">WhatsApp</span>
                    <span className={`font-medium ${profile?.whatsapp_connected ? 'text-green-600' : 'text-slate-400'}`}>
                      {profile?.whatsapp_connected ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Health Stats */}
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Health Stats
                </h4>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2 bg-blue-50 rounded text-center">
                    <Droplet className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                    <p className="text-lg font-bold">{lastSugar || '—'}</p>
                    <p className="text-xs text-slate-500">Last Sugar</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded text-center">
                    <TrendingUp className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                    <p className="text-lg font-bold">{avgSugar || '—'}</p>
                    <p className="text-xs text-slate-500">7d Avg</p>
                  </div>
                  <div className="p-2 bg-red-50 rounded text-center">
                    <Heart className="w-4 h-4 text-red-500 mx-auto mb-1" />
                    <p className="text-lg font-bold">{lastBP || '—'}</p>
                    <p className="text-xs text-slate-500">Last BP</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded text-center">
                    <Clock className="w-4 h-4 text-green-500 mx-auto mb-1" />
                    <p className="text-lg font-bold">{logs.length}</p>
                    <p className="text-xs text-slate-500">Total Logs</p>
                  </div>
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <p className="flex justify-between"><span>Target Fasting:</span> <span className="font-medium">{profile?.target_sugar_fasting || 100} mg/dL</span></p>
                  <p className="flex justify-between"><span>Target Post-Meal:</span> <span className="font-medium">{profile?.target_sugar_post_meal || 140} mg/dL</span></p>
                </div>
              </div>
              
              {/* 7-Day Activity */}
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  7-Day Breakdown
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <div className="flex items-center gap-2">
                      <Droplet className="w-3 h-3 text-blue-500" />
                      <span className="text-sm">Sugar Logs</span>
                    </div>
                    <span className="font-mono font-medium">{sugar7d.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <div className="flex items-center gap-2">
                      <Heart className="w-3 h-3 text-red-500" />
                      <span className="text-sm">BP Logs</span>
                    </div>
                    <span className="font-mono font-medium">{bp7d.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="w-3 h-3 text-orange-500" />
                      <span className="text-sm">Meal Logs</span>
                    </div>
                    <span className="font-mono font-medium">{meal7d.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <div className="flex items-center gap-2">
                      <Pill className="w-3 h-3 text-green-500" />
                      <span className="text-sm">Medication Logs</span>
                    </div>
                    <span className="font-mono font-medium">{med7d.length}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Doctor/Prescription Info */}
            {(profile?.doctor_name || profile?.prescription_image_url) && (
              <div className="mt-4 grid md:grid-cols-2 gap-4">
                {/* Doctor Info */}
                {profile?.doctor_name && (
                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" />
                      Doctor Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Doctor</span>
                        <span className="font-medium">{profile.doctor_name}</span>
                      </div>
                      {profile.doctor_specialization && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Specialization</span>
                          <span className="font-medium">{profile.doctor_specialization}</span>
                        </div>
                      )}
                      {profile.doctor_phone && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Phone</span>
                          <span className="font-medium">{profile.doctor_phone}</span>
                        </div>
                      )}
                      {profile.prescription_clinic && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Clinic</span>
                          <span className="font-medium">{profile.prescription_clinic}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Prescription Info */}
                {profile?.prescription_image_url && (
                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Prescription
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Date</span>
                        <span className="font-medium">
                          {profile.prescription_date ? format(new Date(profile.prescription_date), 'MMM d, yyyy') : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Valid For</span>
                        <span className="font-medium">{profile.prescription_valid_months || 3} months</span>
                      </div>
                      {profile.prescription_diagnosis && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Diagnosis</span>
                          <span className="font-medium">{profile.prescription_diagnosis}</span>
                        </div>
                      )}
                      <a 
                        href={profile.prescription_image_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline mt-2"
                      >
                        <Eye className="w-3 h-3" />
                        View Prescription Image
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Medications */}
            {profile?.medications?.length > 0 && (
              <div className="mt-4 bg-white rounded-lg p-4 border">
                <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <Pill className="w-4 h-4" />
                  Current Medications
                </h4>
                <div className="grid md:grid-cols-3 gap-2">
                  {profile.medications.map((med, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded text-sm">
                      <p className="font-medium text-slate-800">{med.name}</p>
                      <p className="text-xs text-slate-500">{med.dosage} • {med.frequency}</p>
                      {med.timing && <p className="text-xs text-slate-400">{med.timing}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}