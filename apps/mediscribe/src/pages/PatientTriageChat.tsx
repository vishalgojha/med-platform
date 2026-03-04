import React from "react";
import AgentChat from "@/components/AgentChat";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function PatientTriageChat() {
  return (
    <div className="max-w-4xl mx-auto pb-6">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Symptom Checker</h1>
        <p className="text-slate-500 text-sm md:text-base">Describe your symptoms and get instant guidance</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6 flex items-start gap-2 md:gap-3">
        <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs md:text-sm text-amber-800">
          <p className="font-medium mb-1">Important Notice</p>
          <p>This AI assistant provides guidance only and is not a substitute for professional medical advice. 
          For emergencies, call emergency services immediately.</p>
        </div>
      </div>

      <Card className="border-slate-200">
        <AgentChat agentName="patient_triage" />
      </Card>
    </div>
  );
}