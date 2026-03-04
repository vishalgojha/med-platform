import React from "react";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertCircle, Calendar, Clock, FileText } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NotificationPanel() {
  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["upcoming_appointments_notif"],
    queryFn: () => appClient.entities.Appointment.list("-start_time", 20),
  });

  const { data: triageReports, isLoading: triageLoading } = useQuery({
    queryKey: ["recent_triage_notif"],
    queryFn: () => appClient.entities.TriageReport.list("-created_date", 10),
  });

  const { data: patients } = useQuery({
    queryKey: ["patients_notif"],
    queryFn: () => appClient.entities.Patient.list("-created_date", 100),
  });

  const getPatientName = (patientId) => {
    return patients?.find(p => p.id === patientId)?.full_name || "Unknown Patient";
  };

  // Filter urgent notifications
  const urgentAppointments = appointments?.filter(apt => 
    apt.status === 'scheduled' && 
    (isToday(new Date(apt.start_time)) || isPast(new Date(apt.start_time)))
  ) || [];

  const criticalTriage = triageReports?.filter(report => 
    report.severity === 'critical' || report.severity === 'high'
  ).slice(0, 5) || [];

  const allNotifications = [
    ...urgentAppointments.map(apt => ({
      type: 'appointment',
      severity: isPast(new Date(apt.start_time)) ? 'urgent' : 'warning',
      title: isPast(new Date(apt.start_time)) ? 'Overdue Appointment' : 'Today\'s Appointment',
      description: `${getPatientName(apt.patient_id)} - ${apt.reason}`,
      time: apt.start_time,
      link: createPageUrl('Appointments'),
      icon: Calendar,
    })),
    ...criticalTriage.map(report => ({
      type: 'triage',
      severity: report.severity === 'critical' ? 'urgent' : 'warning',
      title: 'Urgent Triage Alert',
      description: `${report.patient_name || 'Patient'} - ${report.action_recommended}`,
      time: report.created_date,
      link: createPageUrl('PatientTriage'),
      icon: AlertCircle,
    }))
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);

  if (appointmentsLoading || triageLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-600" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg border">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Bell className="w-5 h-5 text-orange-600" />
          Notifications
          {allNotifications.length > 0 && (
            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
              {allNotifications.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allNotifications.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No urgent notifications</p>
          </div>
        ) : (
          <div className="space-y-2">
            {allNotifications.map((notif, idx) => (
              <Link key={idx} to={notif.link}>
                <div className={`flex gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-slate-50 ${
                  notif.severity === 'urgent' 
                    ? 'bg-red-50 border-red-200 hover:border-red-300' 
                    : 'bg-amber-50 border-amber-200 hover:border-amber-300'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notif.severity === 'urgent' ? 'bg-red-100' : 'bg-amber-100'
                  }`}>
                    <notif.icon className={`w-4 h-4 ${
                      notif.severity === 'urgent' ? 'text-red-600' : 'text-amber-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-medium text-sm ${
                        notif.severity === 'urgent' ? 'text-red-900' : 'text-amber-900'
                      }`}>
                        {notif.title}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs flex-shrink-0 ${
                          notif.severity === 'urgent' 
                            ? 'border-red-300 text-red-700' 
                            : 'border-amber-300 text-amber-700'
                        }`}
                      >
                        {notif.severity === 'urgent' ? 'URGENT' : 'Warning'}
                      </Badge>
                    </div>
                    <p className={`text-xs mt-1 truncate ${
                      notif.severity === 'urgent' ? 'text-red-700' : 'text-amber-700'
                    }`}>
                      {notif.description}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-500">
                        {format(new Date(notif.time), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}