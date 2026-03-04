import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";
import DocumentUploadModal from "./DocumentUploadModal";

export default function PatientDocumentUploader({ user, connections = [], connectionType = "doctor" }) {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const activeConnections = connections.filter(c => c.status === "active");

  if (activeConnections.length === 0) {
    return null;
  }

  const patientField = connectionType === "coach" ? "client_email" : "patient_email";
  const patientNameField = connectionType === "coach" ? "client_name" : "patient_name";

  return (
    <>
      <div className="flex items-center gap-2">
        <Select value={selectedPatient || ""} onValueChange={setSelectedPatient}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select patient" />
          </SelectTrigger>
          <SelectContent>
            {activeConnections.map(conn => (
              <SelectItem key={conn.id} value={conn[patientField]}>
                {conn[patientNameField] || conn[patientField]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          onClick={() => setShowUpload(true)} 
          disabled={!selectedPatient}
          className="bg-[#5b9a8b] hover:bg-[#4a8a7b]"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload for Patient
        </Button>
      </div>

      {selectedPatient && (
        <DocumentUploadModal
          open={showUpload}
          onClose={() => setShowUpload(false)}
          user={user}
          ownerEmail={selectedPatient}
          ownerName={activeConnections.find(c => c[patientField] === selectedPatient)?.[patientNameField]}
        />
      )}
    </>
  );
}