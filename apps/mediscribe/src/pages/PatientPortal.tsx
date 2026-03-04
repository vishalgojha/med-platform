import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, FileText, MessageCircle, Clock, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function PatientPortal() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => appClient.auth.me(),
  });

  const { data: patientProfile } = useQuery({
    queryKey: ["patient_profile", user?.email],
    queryFn: async () => {
      const patients = await appClient.entities.Patient.filter({ created_by: user.email });
      return patients.length > 0 ? patients[0] : null;
    },
    enabled: !!user && user.role !== 'admin',
  });

  useEffect(() => {
    if (patientProfile === null || (!patientProfile?.phone_number && !patientProfile?.date_of_birth)) {
      setShowOnboarding(true);
    }
  }, [patientProfile]);

  const { data: appointments } = useQuery({
    queryKey: ["my_appointments"],
    queryFn: async () => {
      const allAppointments = await appClient.entities.Appointment.list("-start_time", 10);
      return allAppointments.filter(apt => apt.created_by === user?.email);
    },
    enabled: !!user,
  });

  const { data: notes } = useQuery({
    queryKey: ["my_notes"],
    queryFn: async () => {
      const allNotes = await appClient.entities.ClinicalNote.list("-created_date", 10);
      return allNotes.filter(note => note.created_by === user?.email);
    },
    enabled: !!user,
  });

  const upcomingAppointments = appointments?.filter(apt => 
    apt.status === 'scheduled' && new Date(apt.start_time) > new Date()
  ) || [];

  return (
    <div className="space-y-4 md:space-y-6 pb-6">
      {showOnboarding && (
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-green-900">Complete your health profile</p>
              <p className="text-sm text-green-700">Add your medical information to get better personalized care</p>
            </div>
            <Link to={createPageUrl("Settings")}>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 ml-4">
                Complete Profile
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Welcome, {user?.full_name}</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Manage your health appointments and records</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Link to={createPageUrl("PatientBooking")} className="block">
          <Card className="border-blue-200 hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="bg-blue-100 p-2 md:p-3 rounded-lg flex-shrink-0">
                  <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm md:text-base">Book Appointment</h3>
                  <p className="text-xs md:text-sm text-slate-500">Schedule a visit</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl("PatientTriageChat")} className="block">
          <Card className="border-green-200 hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="bg-green-100 p-2 md:p-3 rounded-lg flex-shrink-0">
                  <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm md:text-base">Symptom Checker</h3>
                  <p className="text-xs md:text-sm text-slate-500">Chat with AI assistant</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-purple-200 h-full">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="bg-purple-100 p-2 md:p-3 rounded-lg flex-shrink-0">
                <FileText className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm md:text-base">My Records</h3>
                <p className="text-xs md:text-sm text-slate-500">{notes?.length || 0} notes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No upcoming appointments</p>
                <Link to={createPageUrl("PatientBooking")}>
                  <Button className="mt-4" size="sm">Book Now</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 3).map(apt => (
                  <div key={apt.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-800">
                        {format(new Date(apt.start_time), "MMM d, yyyy")}
                      </p>
                      <p className="text-sm text-slate-500">
                        {format(new Date(apt.start_time), "h:mm a")} • {apt.reason}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Recent Medical Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!notes || notes.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No medical records yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.slice(0, 3).map(note => (
                  <div key={note.id} className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-medium text-slate-800 line-clamp-1">{note.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {format(new Date(note.created_date), "MMM d, yyyy")} • {note.category}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}