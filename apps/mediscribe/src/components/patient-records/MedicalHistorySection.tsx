import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Edit, Save, X, Loader2, Sparkles } from "lucide-react";
import { appClient } from "@/api/appClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function MedicalHistorySection({ patient }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(patient?.past_medical_history || "");
  const [isAiExtracting, setIsAiExtracting] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => appClient.entities.Patient.update(patient.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", patient.id] });
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({ past_medical_history: value });
  };

  const handleAiExtract = async () => {
    setIsAiExtracting(true);
    try {
      // Fetch medical entries for context
      const entries = await appClient.entities.MedicalEntry.filter(
        { patient_id: patient.id },
        "-date",
        50
      );

      const context = entries
        .map((e) => `${e.date?.split("T")[0]}: ${e.summary} - ${e.detailed_notes}`)
        .join("\n");

      const prompt = `
        Based on the following medical records, extract and summarize the patient's past medical history.
        Include: previous diagnoses, surgeries, hospitalizations, major health events, and chronic conditions.
        Format as a clear, chronological summary.

        Medical Records:
        ${context}
        
        Current chronic conditions: ${patient.chronic_conditions || "None recorded"}

        Provide a concise but comprehensive past medical history summary.
      `;

      const response = await appClient.integrations.Core.InvokeLLM({ prompt });
      setValue(response);
      setIsEditing(true);
    } catch (error) {
      console.error("Failed to extract medical history", error);
    } finally {
      setIsAiExtracting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <CardTitle>Past Medical History</CardTitle>
          </div>
          <div className="flex gap-2">
            {!isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAiExtract}
                  disabled={isAiExtracting}
                >
                  {isAiExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI Extract
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </>
            )}
            {isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setValue(patient?.past_medical_history || "");
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="min-h-[200px]"
            placeholder="Enter past medical history: previous surgeries, hospitalizations, major diagnoses..."
          />
        ) : (
          <div className="text-sm text-slate-600 whitespace-pre-wrap">
            {patient?.past_medical_history || (
              <div className="text-slate-400 italic py-8 text-center">
                No past medical history recorded. Click "AI Extract" to automatically generate from
                existing records or "Edit" to add manually.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}