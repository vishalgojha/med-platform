import React from "react";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Users, Activity, FileText, CalendarCheck } from "lucide-react";
import StatsCards from "@/components/StatsCards";
import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard";
import RecentPatients from "@/components/dashboard/RecentPatients";
import NotificationPanel from "@/components/dashboard/NotificationPanel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Dashboard() {
  const { data: patients } = useQuery({
    queryKey: ["patients_count"],
    queryFn: () => appClient.entities.Patient.list("-created_date", 100),
  });

  const { data: recentEntries } = useQuery({
    queryKey: ["recent_entries"],
    queryFn: () => appClient.entities.MedicalEntry.list("-date", 5),
  });

  return (
    <div className="space-y-6 pb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCards
            title="Total Patients"
            value={patients?.length || 0}
            icon={Users}
            bgColor="bg-blue-600"
            trend="+12%"
        />
        <StatsCards
            title="Consultations Today"
            value="14"
            icon={CalendarCheck}
            bgColor="bg-green-600"
            trend="+5%"
        />
        <StatsCards
            title="New Prescriptions"
            value="8"
            icon={FileText}
            bgColor="bg-purple-600"
            trend="+2%"
        />
        <StatsCards
            title="Critical Alerts"
            value="2"
            icon={Activity}
            bgColor="bg-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentPatients />
        <NotificationPanel />
      </div>

      <AnalyticsDashboard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
            <CardHeader>
                <CardTitle className="text-base md:text-lg">Recent Medical Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {recentEntries?.map((entry, i) => (
                        <div key={i} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                            <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                                entry.entry_type === 'vitals' ? 'bg-red-500' : 
                                entry.entry_type === 'prescription' ? 'bg-purple-500' : 'bg-blue-500'
                            }`} />
                            <div className="min-w-0 flex-1">
                                <p className="font-medium text-slate-800 text-sm md:text-base">{entry.summary}</p>
                                <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-1">{entry.detailed_notes}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                    <span>{format(new Date(entry.date), "MMM d, h:mm a")}</span>
                                    <span>•</span>
                                    <span className="truncate">{entry.doctor_name}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!recentEntries?.length && <div className="text-slate-500 text-center py-4 text-sm">No recent activity.</div>}
                </div>
            </CardContent>
        </Card>

        <Card className="bg-blue-600 text-white border-none shadow-lg">
            <CardHeader>
                <CardTitle className="text-white text-base md:text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Link to={createPageUrl("Patients")} className="block">
                    <button className="w-full text-left px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-3 text-sm md:text-base">
                        <Users className="w-5 h-5 flex-shrink-0" />
                        Add New Patient
                    </button>
                </Link>
                <button className="w-full text-left px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-3 text-sm md:text-base">
                    <FileText className="w-5 h-5 flex-shrink-0" />
                    Generate Report
                </button>
                <div className="pt-4 mt-4 border-t border-white/10">
                    <p className="text-sm opacity-80 mb-2">System Status</p>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
                        All Systems Operational
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}