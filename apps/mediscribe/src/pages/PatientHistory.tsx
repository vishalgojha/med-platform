import React from "react";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Phone, Calendar, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MedicalTimeline from "@/components/MedicalTimeline";
import PatientSummaryGenerator from "@/components/PatientSummaryGenerator";
import ClinicalTrends from "@/components/ClinicalTrends";
import ClinicalNoteAssistant from "@/components/ClinicalNoteAssistant";
import MedicalHistorySection from "@/components/patient-records/MedicalHistorySection";
import MedicationTracker from "@/components/patient-records/MedicationTracker";
import AllergiesSection from "@/components/patient-records/AllergiesSection";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function PatientHistory() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
        if (!id) return null;
        // We need a get by ID, typically filter or if specific method exists. 
        // Assuming filter returns array, we take first.
        const res = await appClient.entities.Patient.filter({ id }, "created_date", 1);
        return res[0];
    },
    enabled: !!id
  });

  if (!id) return <div className="p-10 text-center">No patient ID provided.</div>;

  return (
    <div className="space-y-8">
      <Link to={createPageUrl("Dashboard")}>
        <Button variant="ghost" className="pl-0 text-slate-500 hover:text-slate-900 hover:bg-transparent">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : patient ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-start">
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <User className="w-10 h-10 text-slate-400" />
            </div>
            
            <div className="flex-1 space-y-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{patient.full_name}</h1>
                    <p className="text-slate-500">ID: {patient.id}</p>
                </div>
                
                <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-4 h-4" />
                        {patient.phone_number || "N/A"}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4" />
                        {patient.date_of_birth ? format(new Date(patient.date_of_birth), "MMMM d, yyyy") : "N/A"}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 capitalize">
                        <User className="w-4 h-4" />
                        {patient.gender}
                    </div>
                </div>

                {patient.allergies && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 text-sm font-medium rounded-full border border-red-100">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Allergies: {patient.allergies}
                    </div>
                )}
            </div>
            
            <div className="text-right">
                <div className="text-sm text-slate-500">Registered Clinic</div>
                <div className="font-semibold text-slate-800">{patient.clinic_id}</div>
            </div>
        </div>
      ) : (
        <div>Patient not found</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PatientSummaryGenerator patientId={id} patient={patient} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AllergiesSection patient={patient} />
            <MedicationTracker patient={patient} />
          </div>

          <MedicalHistorySection patient={patient} />
          
          <ClinicalTrends patientId={id} />

          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-6">Medical Timeline</h3>
            <MedicalTimeline patientId={id} />
          </div>
        </div>

        <div className="space-y-8">
          <div className="sticky top-24">
             <ClinicalNoteAssistant patientId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}