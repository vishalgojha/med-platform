import React from "react";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ChevronRight, Calendar, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecentPatients() {
  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ["recent_patients"],
    queryFn: () => appClient.entities.Patient.list("-updated_date", 8),
  });

  const { data: allAppointments } = useQuery({
    queryKey: ["all_appointments_recent"],
    queryFn: () => appClient.entities.Appointment.list("-created_date", 50),
  });

  const { data: allEntries } = useQuery({
    queryKey: ["all_entries_recent"],
    queryFn: () => appClient.entities.MedicalEntry.list("-created_date", 50),
  });

  const getPatientStats = (patientId) => {
    const upcomingAppointments = allAppointments?.filter(
      apt => apt.patient_id === patientId && 
      apt.status === 'scheduled' && 
      new Date(apt.start_time) > new Date()
    ).length || 0;

    const recentEntries = allEntries?.filter(
      entry => entry.patient_id === patientId
    ).slice(0, 1);

    return { upcomingAppointments, recentEntries };
  };

  if (patientsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Recent Patients
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
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
          <Users className="w-5 h-5 text-blue-600" />
          Recent Patients
        </CardTitle>
        <Link to={createPageUrl("Patients")}>
          <Button variant="ghost" size="sm" className="text-xs md:text-sm">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {patients?.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No patients yet</p>
          </div>
        ) : (
          patients?.map((patient) => {
            const stats = getPatientStats(patient.id);
            return (
              <Link key={patient.id} to={createPageUrl(`PatientHistory?id=${patient.id}`)}>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-semibold text-sm">
                      {patient.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm md:text-base truncate">
                      {patient.full_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {stats.upcomingAppointments > 0 && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {stats.upcomingAppointments} upcoming
                        </Badge>
                      )}
                      {stats.recentEntries?.length > 0 && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {format(new Date(stats.recentEntries[0].created_date), "MMM d")}
                        </Badge>
                      )}
                      {patient.phone_number && (
                        <span className="text-xs text-slate-500 truncate">
                          {patient.phone_number}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </div>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}