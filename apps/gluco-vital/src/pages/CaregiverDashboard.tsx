import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { format, isToday, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, Eye, Droplet, Heart, Pill, TrendingUp, TrendingDown,
  AlertTriangle, Clock, Activity, RefreshCw, ChevronRight
} from "lucide-react";
import SugarChart from "@/components/dashboard/SugarChart";
import EnhancedReportViewer from "@/components/reports/EnhancedReportViewer";
import { generateDemoData } from "@/components/demo/DemoDataGenerator";
import DemoBanner from "@/components/demo/DemoBanner";

export default function CaregiverDashboard() {
  const [user, setUser] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [demoData, setDemoData] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const demoMode = urlParams.get('demo') === 'true';
    
    if (demoMode) {
      setIsDemo(true);
      const data = generateDemoData();
      setDemoData(data);
      setUser({ email: "family@example.com", full_name: "Mrs. Gluco" });
      // Auto-select the demo patient
      if (data.caregiverAccess?.length > 0) {
        setSelectedPatient(data.caregiverAccess[0]);
      }
    } else {
      appClient.auth.me().then(setUser).catch(() => {});
    }
  }, []);

  // Get all patients this user is caregiver for
  const { data: caregiverAccess = [], isLoading: accessLoading } = useQuery({
    queryKey: ['my-caregiver-access', user?.email, isDemo],
    queryFn: async () => {
      if (isDemo && demoData) {
        return demoData.caregiverAccess;
      }
      return appClient.entities.CaregiverAccess.filter({ 
        caregiver_email: user?.email,
        status: "active"
      });
    },
    enabled: !!user?.email || isDemo
  });

  // Get selected patient's profile
  const { data: patientProfile } = useQuery({
    queryKey: ['patient-profile-caregiver', selectedPatient?.patient_email, isDemo],
    queryFn: async () => {
      if (isDemo && demoData) {
        return demoData.profile;
      }
      const results = await appClient.entities.PatientProfile.filter({ 
        user_email: selectedPatient?.patient_email 
      });
      return results?.[0];
    },
    enabled: !!selectedPatient?.patient_email || isDemo
  });

  // Get selected patient's logs
  const { data: patientLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['patient-logs-caregiver', selectedPatient?.patient_email, isDemo],
    queryFn: async () => {
      if (isDemo && demoData) {
        return demoData.logs.filter(log => log.status !== 'corrected' && log.status !== 'deleted');
      }
      const logs = await appClient.entities.HealthLog.list('-created_date', 100);
      return logs.filter(log => 
        (log.user_email === selectedPatient?.patient_email || 
         log.created_by === selectedPatient?.patient_email) &&
        log.status !== 'corrected' && log.status !== 'deleted'
      );
    },
    enabled: !!selectedPatient?.patient_email || isDemo
  });

  // Get patient's medication reminders
  const { data: medications = [] } = useQuery({
    queryKey: ['patient-meds-caregiver', selectedPatient?.patient_email, isDemo],
    queryFn: async () => {
      if (isDemo && demoData) {
        return demoData.medications;
      }
      return appClient.entities.MedicationReminder.filter({
        user_email: selectedPatient?.patient_email,
        is_active: true
      });
    },
    enabled: !!selectedPatient?.patient_email || isDemo
  });

  // Get patient's reports (accessible to caregivers)
  const { data: patientReports = [] } = useQuery({
    queryKey: ['patient-reports-caregiver', selectedPatient?.patient_email, isDemo],
    queryFn: async () => {
      if (isDemo && demoData) {
        return demoData.reports;
      }
      const reports = await appClient.entities.HealthReport.list('-created_date', 20);
      return reports.filter(r => 
        r.user_email === selectedPatient?.patient_email && 
        r.accessible_to_caregivers !== false
      );
    },
    enabled: !!selectedPatient?.patient_email || isDemo
  });

  const [selectedReport, setSelectedReport] = useState(null);

  // Log activity when viewing (skip in demo mode)
  useEffect(() => {
    if (selectedPatient && !isDemo) {
      // Check if access has expired
      if (selectedPatient.expires_at && new Date(selectedPatient.expires_at) < new Date()) {
        return; // Don't log if expired
      }
      
      appClient.entities.CaregiverActivityLog.create({
        caregiver_access_id: selectedPatient.id,
        patient_email: selectedPatient.patient_email,
        caregiver_email: user?.email,
        action_type: "viewed_dashboard",
        source: "app"
      }).catch(() => {});
      
      // Log to DataAccessLog for audit trail
      appClient.entities.DataAccessLog.create({
        patient_email: selectedPatient.patient_email,
        accessor_email: user?.email,
        accessor_name: user?.full_name,
        accessor_type: "caregiver",
        access_type: "view_dashboard",
        access_details: `Viewed dashboard as ${selectedPatient.relation}`,
        connection_id: selectedPatient.id
      }).catch(() => {});
      
      // Update last_viewed_at
      appClient.entities.CaregiverAccess.update(selectedPatient.id, {
        last_viewed_at: new Date().toISOString()
      }).catch(() => {});
    }
  }, [selectedPatient?.id, isDemo]);

  // Calculate stats
  const todayLogs = patientLogs.filter(log => isToday(new Date(log.created_date)));
  const sugarLogs = patientLogs.filter(log => log.log_type === "sugar" && log.numeric_value);
  const lastSugar = sugarLogs[0];
  const avgSugar = sugarLogs.length > 0
    ? Math.round(sugarLogs.slice(0, 7).reduce((a, b) => a + b.numeric_value, 0) / Math.min(sugarLogs.length, 7))
    : null;
  
  const bpLogs = patientLogs.filter(log => log.log_type === "blood_pressure");
  const lastBP = bpLogs[0];

  // Check for concerning values
  const hasHighSugar = lastSugar?.numeric_value >= 300;
  const hasLowSugar = lastSugar?.numeric_value < 70;

  if (accessLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (caregiverAccess.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">No Patients Yet</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              You haven't been added as a caregiver for any patients yet. 
              Ask your family member to add you from their GlucoVital profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      {isDemo && <DemoBanner />}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Eye className="w-8 h-8 text-violet-500" />
              Caregiver Dashboard
            </h1>
            <p className="text-slate-500 mt-1">Monitor your loved one's health</p>
          </div>

          {caregiverAccess.length > 1 && (
            <Select 
              value={selectedPatient?.id || caregiverAccess[0]?.id}
              onValueChange={(id) => setSelectedPatient(caregiverAccess.find(a => a.id === id))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {caregiverAccess.map(access => (
                  <SelectItem key={access.id} value={access.id}>
                    {access.patient_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Auto-select first patient */}
        {!selectedPatient && caregiverAccess.length > 0 && setSelectedPatient(caregiverAccess[0])}

        {selectedPatient && selectedPatient.expires_at && new Date(selectedPatient.expires_at) < new Date() && (
          <div className="max-w-2xl mx-auto text-center py-16 bg-white rounded-2xl border border-amber-200">
            <Clock className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Access Expired</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Your access to {selectedPatient.patient_name}'s data expired on {format(new Date(selectedPatient.expires_at), "MMMM d, yyyy")}. 
              Please ask them to renew your access.
            </p>
          </div>
        )}

        {selectedPatient && (!selectedPatient.expires_at || new Date(selectedPatient.expires_at) >= new Date()) && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Alert Banner */}
              {(hasHighSugar || hasLowSugar) && (
                <div className={`p-4 rounded-xl flex items-start gap-3 ${
                  hasLowSugar ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${hasLowSugar ? 'text-red-600' : 'text-amber-600'}`} />
                  <div>
                    <p className={`font-medium ${hasLowSugar ? 'text-red-800' : 'text-amber-800'}`}>
                      {hasLowSugar ? '⚠️ Low Sugar Alert' : '⚠️ High Sugar Alert'}
                    </p>
                    <p className={`text-sm ${hasLowSugar ? 'text-red-600' : 'text-amber-600'}`}>
                      Last reading: {lastSugar?.numeric_value} mg/dL at {format(new Date(lastSugar.created_date), "h:mm a")}
                    </p>
                  </div>
                </div>
              )}

              {/* Patient Info Card */}
              <Card className="border-slate-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-violet-600">
                        {selectedPatient.patient_name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-800">
                        {selectedPatient.patient_name}
                      </h2>
                      <p className="text-slate-500 text-sm">
                        {patientProfile?.age ? `${patientProfile.age} years` : ''} 
                        {patientProfile?.conditions?.length > 0 && (
                          <span> • {patientProfile.conditions.join(", ")}</span>
                        )}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {selectedPatient.access_level === 'view_only' ? 'View Only Access' : 'Assist Mode'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard 
                  icon={Droplet}
                  label="Last Sugar"
                  value={lastSugar?.numeric_value || "--"}
                  subValue="mg/dL"
                  color="blue"
                  alert={hasHighSugar || hasLowSugar}
                />
                <StatCard 
                  icon={Heart}
                  label="Last BP"
                  value={lastBP?.value || "--"}
                  color="red"
                />
                <StatCard 
                  icon={TrendingUp}
                  label="7-Day Avg"
                  value={avgSugar || "--"}
                  subValue="mg/dL"
                  color="purple"
                />
                <StatCard 
                  icon={Activity}
                  label="Today's Logs"
                  value={todayLogs.length}
                  color="green"
                />
              </div>

              {/* Sugar Chart */}
              <Card className="border-slate-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Sugar Trend</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => refetchLogs()}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {logsLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <SugarChart 
                      logs={patientLogs}
                      targetFasting={patientProfile?.target_sugar_fasting || 100}
                      targetPostMeal={patientProfile?.target_sugar_post_meal || 140}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {logsLoading ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                  ) : patientLogs.length > 0 ? (
                    <div className="space-y-3">
                      {patientLogs.slice(0, 8).map(log => (
                        <LogItem key={log.id} log={log} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-slate-400">No recent logs</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Medication Schedule */}
              <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Pill className="w-5 h-5 text-green-500" />
                    Medications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {medications.length > 0 ? (
                    <div className="space-y-3">
                      {medications.map(med => (
                        <div key={med.id} className="p-3 bg-slate-50 rounded-lg">
                          <div className="font-medium text-slate-700">{med.medication_name}</div>
                          <div className="text-sm text-slate-500">
                            {med.dosage} • {med.frequency?.replace(/_/g, ' ')}
                          </div>
                          {med.specific_times?.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {med.specific_times.map((time, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {time}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-4 text-slate-400 text-sm">
                      No medications configured
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Your Access Info */}
              <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Your Access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Access Level</span>
                    <Badge>{selectedPatient.access_level?.replace(/_/g, ' ')}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Relationship</span>
                    <span className="text-sm font-medium capitalize">{selectedPatient.relation}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Added on</span>
                    <span className="text-sm text-slate-500">
                      {format(new Date(selectedPatient.granted_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  {selectedPatient.expires_at && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                      <span className="text-sm text-slate-600">Expires on</span>
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        <Clock className="w-3 h-3 mr-1" />
                        {format(new Date(selectedPatient.expires_at), "MMM d, yyyy")}
                      </Badge>
                    </div>
                  )}
                  {selectedPatient.permissions?.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 mt-2">
                      <span className="text-xs text-slate-500 block mb-2">Permissions</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedPatient.permissions.map(p => (
                          <Badge key={p} variant="outline" className="text-xs">
                            {p.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Patient Reports */}
              {patientReports.length > 0 && (
                <Card className="border-slate-100 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Health Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {patientReports.slice(0, 5).map(report => (
                        <button
                          key={report.id}
                          onClick={() => setSelectedReport(report)}
                          className="w-full p-3 bg-slate-50 rounded-lg text-left hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm capitalize">{report.report_type}</span>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </div>
                          <p className="text-xs text-slate-500">
                            {format(new Date(report.start_date), "MMM d")} - {format(new Date(report.end_date), "MMM d")}
                          </p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Tips */}
              <Card className="border-violet-100 bg-violet-50/50">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-violet-800 mb-3">💡 Caregiver Tips</h3>
                  <ul className="space-y-2 text-sm text-violet-700">
                    <li>• Check readings daily, especially fasting</li>
                    <li>• Look for patterns in high/low readings</li>
                    <li>• Remind about medication if needed</li>
                    <li>• Encourage consistent logging</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {selectedPatient && (!selectedPatient.expires_at || new Date(selectedPatient.expires_at) >= new Date()) && null}

        {/* Report Viewer for Caregivers */}
        {selectedReport && (
          <EnhancedReportViewer
            report={selectedReport}
            profile={patientProfile}
            onClose={() => setSelectedReport(null)}
            isCaregiver={true}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subValue, color, alert }) {
  const colorMap = {
    blue: "from-blue-50 to-blue-100 text-blue-600",
    red: "from-red-50 to-red-100 text-red-600",
    purple: "from-purple-50 to-purple-100 text-purple-600",
    green: "from-green-50 to-green-100 text-green-600"
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} rounded-xl p-4 ${alert ? 'ring-2 ring-red-400' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subValue && <div className="text-xs opacity-70">{subValue}</div>}
    </div>
  );
}

function LogItem({ log }) {
  const icons = {
    sugar: Droplet,
    blood_pressure: Heart,
    meal: Activity,
    medication: Pill
  };
  const Icon = icons[log.log_type] || Activity;

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
      <div className="p-2 bg-white rounded-lg">
        <Icon className="w-4 h-4 text-slate-600" />
      </div>
      <div className="flex-1">
        <div className="font-medium text-slate-700 capitalize">
          {log.log_type.replace(/_/g, ' ')}
        </div>
        <div className="text-sm text-slate-500">{log.value}</div>
      </div>
      <div className="text-xs text-slate-400">
        {format(new Date(log.created_date), "h:mm a")}
      </div>
    </div>
  );
}