import React from "react";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardList, Eye, Download, FileText, TrendingUp, Edit3, User, Stethoscope, Users } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const accessTypeIcons = {
  view_dashboard: Eye,
  view_logs: FileText,
  view_reports: FileText,
  view_trends: TrendingUp,
  download_data: Download,
  add_log: Edit3,
  update_record: Edit3
};

const accessTypeLabels = {
  view_dashboard: "Viewed Dashboard",
  view_logs: "Viewed Health Logs",
  view_reports: "Viewed Reports",
  view_trends: "Viewed Trends",
  download_data: "Downloaded Data",
  add_log: "Added Log Entry",
  update_record: "Updated Record"
};

const accessorTypeIcons = {
  doctor: Stethoscope,
  caregiver: Users,
  self: User,
  system: ClipboardList
};

export default function DataAccessAuditLog({ userEmail }) {
  const { data: accessLogs = [], isLoading } = useQuery({
    queryKey: ['data-access-logs', userEmail],
    queryFn: () => appClient.entities.DataAccessLog.filter({ patient_email: userEmail }),
    enabled: !!userEmail
  });

  // Sort by most recent first
  const sortedLogs = [...accessLogs].sort((a, b) => 
    new Date(b.created_date) - new Date(a.created_date)
  );

  // Group by date
  const groupedLogs = sortedLogs.reduce((acc, log) => {
    const date = format(new Date(log.created_date), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <Card className="border-slate-100">
        <CardContent className="py-8 text-center">
          <div className="animate-pulse text-slate-400">Loading audit log...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="w-5 h-5 text-slate-500" />
          Data Access Audit Log
        </CardTitle>
        <p className="text-sm text-slate-500">Track who accessed your health data and when</p>
      </CardHeader>
      <CardContent>
        {sortedLogs.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No access records yet</p>
            <p className="text-xs text-slate-400 mt-1">Access events will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {Object.entries(groupedLogs).map(([date, logs]) => (
                <div key={date}>
                  <div className="text-xs font-medium text-slate-400 mb-2 sticky top-0 bg-white py-1">
                    {format(new Date(date), "EEEE, MMMM d, yyyy")}
                  </div>
                  <div className="space-y-2">
                    {logs.map((log) => {
                      const AccessIcon = accessTypeIcons[log.access_type] || Eye;
                      const AccessorIcon = accessorTypeIcons[log.accessor_type] || User;
                      
                      return (
                        <div 
                          key={log.id} 
                          className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <div className={`p-2 rounded-full ${
                            log.accessor_type === 'doctor' ? 'bg-blue-100' :
                            log.accessor_type === 'caregiver' ? 'bg-violet-100' :
                            'bg-slate-100'
                          }`}>
                            <AccessorIcon className={`w-4 h-4 ${
                              log.accessor_type === 'doctor' ? 'text-blue-600' :
                              log.accessor_type === 'caregiver' ? 'text-violet-600' :
                              'text-slate-600'
                            }`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm text-slate-700">
                                {log.accessor_name || log.accessor_email}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {log.accessor_type}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-1 mt-1 text-xs text-slate-600">
                              <AccessIcon className="w-3 h-3" />
                              <span>{accessTypeLabels[log.access_type] || log.access_type}</span>
                            </div>
                            
                            {log.access_details && (
                              <p className="text-xs text-slate-500 mt-1">{log.access_details}</p>
                            )}
                          </div>
                          
                          <div className="text-xs text-slate-400 whitespace-nowrap">
                            {format(new Date(log.created_date), "h:mm a")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
          <p className="text-xs text-green-700">
            🔒 All data access is logged automatically for your privacy protection under DPDP Act.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}