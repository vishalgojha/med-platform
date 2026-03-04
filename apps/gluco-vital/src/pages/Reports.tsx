import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, HelpCircle, Filter, Share2, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import EnhancedReportGenerator from "@/components/reports/EnhancedReportGenerator";
import ReportCard from "@/components/reports/ReportCard";
import EnhancedReportViewer from "@/components/reports/EnhancedReportViewer";
import DoctorClinicalReport from "@/components/reports/DoctorClinicalReport";
import DoctorQuestionsList from "@/components/reports/DoctorQuestionsList";
import ReportScheduler from "@/components/reports/ReportScheduler";
import { generateDemoData } from "@/components/demo/DemoDataGenerator";
import DemoBanner from "@/components/demo/DemoBanner";

export default function Reports() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [demoData, setDemoData] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const demoMode = urlParams.get('demo') === 'true';
    
    if (demoMode) {
      setIsDemo(true);
      const data = generateDemoData();
      setDemoData(data);
      setUser(data.user);
    } else {
      appClient.auth.me().then(setUser).catch(() => {});
    }
  }, []);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['health-reports', user?.email, isDemo],
    queryFn: async () => {
      if (isDemo && demoData) {
        return demoData.reports;
      }
      return appClient.entities.HealthReport.filter({ user_email: user?.email }, '-created_date');
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

  const handleReportGenerated = (report) => {
    queryClient.invalidateQueries({ queryKey: ['health-reports'] });
    setShowGenerator(false);
    setSelectedReport(report);
  };

  // Filter and sort reports
  const filteredReports = reports
    .filter(r => filterType === "all" || r.report_type === filterType)
    .sort((a, b) => {
      if (sortOrder === "newest") return new Date(b.created_date) - new Date(a.created_date);
      if (sortOrder === "oldest") return new Date(a.created_date) - new Date(b.created_date);
      return 0;
    });

  const sharedReports = reports.filter(r => r.shared_with_doctor);
  const recentReports = reports.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {isDemo && <DemoBanner />}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Health Reports</h1>
            <p className="text-slate-500 mt-1">AI-generated health summaries for you & your doctor</p>
          </div>
          <Button onClick={() => setShowGenerator(!showGenerator)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Report
          </Button>
        </div>

        {showGenerator && !isDemo && (
          <div className="mb-8 space-y-6">
            <EnhancedReportGenerator 
              userEmail={user?.email} 
              onReportGenerated={handleReportGenerated}
            />
            <DoctorClinicalReport 
              userEmail={user?.email}
              patientName={profile?.name || user?.full_name}
              profile={profile}
            />
          </div>
        )}

        {isDemo && showGenerator && (
          <div className="mb-8 p-6 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-amber-800 text-center">
              ✨ In the real app, you can generate custom reports for any date range. 
              Below are sample reports from the demo data.
            </p>
          </div>
        )}

        {/* Report Stats Summary */}
        {!isLoading && reports.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-slate-100 text-center">
              <p className="text-2xl font-bold text-slate-800">{reports.length}</p>
              <p className="text-xs text-slate-500">Total Reports</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-100 text-center">
              <p className="text-2xl font-bold text-emerald-600">{sharedReports.length}</p>
              <p className="text-xs text-slate-500">Shared with Doctor</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-100 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {reports.filter(r => r.report_type === 'weekly').length}
              </p>
              <p className="text-xs text-slate-500">Weekly Reports</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Reports</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32 h-8">
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-28 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <TabsContent value="all" className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No reports yet</p>
                <p className="text-sm text-slate-400 mt-1">Generate your first health report above</p>
              </div>
            ) : (
              filteredReports.map(report => (
                <ReportCard 
                  key={report.id} 
                  report={report} 
                  onClick={() => setSelectedReport(report)}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="shared" className="space-y-3">
            {sharedReports.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                <Share2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No shared reports yet</p>
                <p className="text-sm text-slate-400 mt-1">Share your reports with your doctor from the report viewer</p>
              </div>
            ) : (
              sharedReports.map(report => (
                <ReportCard 
                  key={report.id} 
                  report={report} 
                  onClick={() => setSelectedReport(report)}
                  showSharedBadge
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="recent" className="space-y-3">
            {recentReports.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No recent reports</p>
              </div>
            ) : (
              recentReports.map(report => (
                <ReportCard 
                  key={report.id} 
                  report={report} 
                  onClick={() => setSelectedReport(report)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedReport && (
        <EnhancedReportViewer 
          report={selectedReport}
          profile={profile}
          onClose={() => setSelectedReport(null)}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ['health-reports'] })}
        />
      )}

      {/* Scheduled Reports & Doctor Questions */}
      <div className="max-w-4xl mx-auto px-4 pb-8 space-y-6">
        {!isDemo && <ReportScheduler user={user} />}
        <DoctorQuestionsList userEmail={user?.email} />
      </div>
    </div>
  );
}