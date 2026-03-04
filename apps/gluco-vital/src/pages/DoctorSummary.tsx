import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Stethoscope, Users, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import DoctorSummaryCard from "@/components/doctor/DoctorSummaryCard";
import DoctorSummaryGenerator from "@/components/doctor/DoctorSummaryGenerator";

export default function DoctorSummary() {
  const [user, setUser] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState("all");
  const queryClient = useQueryClient();

  useEffect(() => {
    appClient.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch doctor connections (patients connected to this doctor)
  const { data: connections = [] } = useQuery({
    queryKey: ['doctor-connections', user?.email],
    queryFn: () => appClient.entities.DoctorConnection.filter({ 
      doctor_email: user?.email, 
      status: 'active' 
    }),
    enabled: !!user?.email
  });

  // Fetch all summaries
  const { data: summaries = [], isLoading } = useQuery({
    queryKey: ['doctor-summaries'],
    queryFn: () => appClient.entities.DoctorSummary.list('-generated_at', 50),
    enabled: !!user?.email
  });

  // Filter summaries
  const filteredSummaries = selectedPatient === "all" 
    ? summaries 
    : summaries.filter(s => s.patient_email === selectedPatient);

  // Group by patient, show only latest per patient
  const latestByPatient = {};
  filteredSummaries.forEach(s => {
    if (!latestByPatient[s.patient_email] || 
        new Date(s.generated_at) > new Date(latestByPatient[s.patient_email].generated_at)) {
      latestByPatient[s.patient_email] = s;
    }
  });
  const displaySummaries = Object.values(latestByPatient);

  // Sort by urgency
  const urgencyOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  displaySummaries.sort((a, b) => 
    (urgencyOrder[a.system_recommendation?.urgency] || 3) - 
    (urgencyOrder[b.system_recommendation?.urgency] || 3)
  );

  const patientEmails = [...new Set(summaries.map(s => s.patient_email))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
            Clinical Summaries
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Decision states • Fatigue signals • Risk flags
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4 md:mb-6">
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger className="w-full sm:w-48">
              <Users className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="All patients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All patients</SelectItem>
              {patientEmails.map(email => (
                <SelectItem key={email} value={email}>
                  {summaries.find(s => s.patient_email === email)?.patient_name || email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['doctor-summaries'] })}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>
        </div>

        {/* Info Banner */}
        <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 sm:p-4 mb-4 md:mb-6">
          <p className="text-xs sm:text-sm text-slate-600">
            <strong>Reading this view:</strong> Decision states show patient coping patterns. 
            Fatigue signals indicate burnout risk. Actions suggest workflow routing — not medical decisions.
          </p>
        </div>

        {/* Summaries Grid */}
        {isLoading ? (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-48 sm:h-64 rounded-xl" />
            ))}
          </div>
        ) : displaySummaries.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-xl border border-slate-100">
            <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm sm:text-base">No summaries generated yet</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Summaries are generated from patient interactions
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            {displaySummaries.map(summary => (
              <DoctorSummaryCard key={summary.id} summary={summary} />
            ))}
          </div>
        )}

        {/* Generate for connected patients */}
        {connections.length > 0 && (
          <div className="mt-6 md:mt-8 p-3 sm:p-4 bg-white rounded-xl border border-slate-100">
            <h3 className="font-medium text-slate-700 mb-3 text-sm sm:text-base">Generate Summary</h3>
            <div className="space-y-2">
              {connections.map(conn => (
                <div key={conn.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-700 truncate">{conn.patient_name || conn.patient_email}</span>
                  <DoctorSummaryGenerator 
                    patientEmail={conn.patient_email}
                    patientName={conn.patient_name}
                    onSummaryGenerated={() => queryClient.invalidateQueries({ queryKey: ['doctor-summaries'] })}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}