import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter, UserPlus } from "lucide-react";
import PatientCard from "@/components/PatientCard";
import { Skeleton } from "@/components/ui/skeleton";
import RegisterPatientDialog from "@/components/RegisterPatientDialog";

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);

  // Fetch patients
  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients_list"],
    queryFn: () => appClient.entities.Patient.list("-created_date", 50),
  });

  const filteredPatients = patients?.filter((p) =>
    p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone_number?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <RegisterPatientDialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Patients</h2>
            <p className="text-slate-500 mt-1">Full directory of registered patients.</p>
        </div>
        <Button 
          onClick={() => setShowRegisterDialog(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Register New Patient
        </Button>
      </div>

      <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <Input
          className="border-none shadow-none focus-visible:ring-0 text-base"
          placeholder="Search patients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-40 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
          ))
        ) : filteredPatients?.length > 0 ? (
          filteredPatients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-slate-500">
            <p>No patients found.</p>
          </div>
        )}
      </div>
    </div>
  );
}