import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Loader2, X, FileText, CheckCircle } from "lucide-react";
import VoiceDictation from "./VoiceDictation";
import NoteAIAssistant from "./NoteAIAssistant";

export default function NoteEditor({ note, patients, onClose, onSaved }) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    patient_id: "",
    patient_name: "",
    category: "other",
    summary: "",
    icd10_codes: [],
    cpt_codes: [],
    status: "draft",
  });

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title || "",
        content: note.content || "",
        patient_id: note.patient_id || "",
        patient_name: note.patient_name || "",
        category: note.category || "other",
        summary: note.summary || "",
        icd10_codes: note.icd10_codes || [],
        cpt_codes: note.cpt_codes || [],
        status: note.status || "draft",
      });
    }
  }, [note]);

  const handleTranscript = (text) => {
    setFormData((prev) => ({
      ...prev,
      content: prev.content ? `${prev.content}\n\n${text}` : text,
    }));
  };

  const handlePatientChange = (patientId) => {
    const patient = patients?.find((p) => p.id === patientId);
    setFormData((prev) => ({
      ...prev,
      patient_id: patientId,
      patient_name: patient?.full_name || "",
    }));
  };

  const handleCategoryUpdate = (category) => {
    setFormData((prev) => ({ ...prev, category }));
  };

  const handleCodesUpdate = (type, codes) => {
    if (type === "icd10") {
      setFormData((prev) => ({ ...prev, icd10_codes: codes }));
    } else {
      setFormData((prev) => ({ ...prev, cpt_codes: codes }));
    }
  };

  const handleSummaryUpdate = (summary) => {
    setFormData((prev) => ({ ...prev, summary }));
  };

  const handleSave = async (status = "draft") => {
    setIsSaving(true);
    try {
      const dataToSave = { ...formData, status };
      
      if (note?.id) {
        await appClient.entities.ClinicalNote.update(note.id, dataToSave);
      } else {
        await appClient.entities.ClinicalNote.create(dataToSave);
      }
      
      queryClient.invalidateQueries({ queryKey: ["clinical_notes"] });
      onSaved?.();
      onClose?.();
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const categoryLabels = {
    patient_history: "Patient History",
    diagnosis: "Diagnosis",
    prescription: "Prescription",
    lab_results: "Lab Results",
    follow_up: "Follow-Up",
    procedure: "Procedure",
    consultation: "Consultation",
    other: "Other",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Note Editor */}
      <div className="lg:col-span-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle>{note?.id ? "Edit Note" : "New Clinical Note"}</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Voice Dictation */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <Label className="mb-3 block font-medium">Voice Dictation</Label>
              <VoiceDictation onTranscript={handleTranscript} />
              <p className="text-xs text-slate-500 mt-2">
                Click to start recording. Your speech will be transcribed and added to the note.
              </p>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Note Title</Label>
              <Input
                id="title"
                placeholder="Enter a title for this note..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Patient Selection */}
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select value={formData.patient_id} onValueChange={handlePatientChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients?.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Clinical Note Content</Label>
              <Textarea
                id="content"
                placeholder="Enter clinical note content or use voice dictation..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="min-h-[250px] resize-y"
              />
            </div>

            {/* AI Summary */}
            {formData.summary && (
              <div className="space-y-2">
                <Label>AI Summary</Label>
                <div className="p-3 bg-green-50 rounded-lg text-sm text-green-800 border border-green-100">
                  {formData.summary}
                </div>
              </div>
            )}

            {/* Codes Display */}
            {(formData.icd10_codes?.length > 0 || formData.cpt_codes?.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {formData.icd10_codes?.length > 0 && (
                  <div className="space-y-2">
                    <Label>ICD-10 Codes</Label>
                    <div className="flex flex-wrap gap-1">
                      {formData.icd10_codes.map((code, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {code.split(" - ")[0]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {formData.cpt_codes?.length > 0 && (
                  <div className="space-y-2">
                    <Label>CPT Codes</Label>
                    <div className="flex flex-wrap gap-1">
                      {formData.cpt_codes.map((code, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {code.split(" - ")[0]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSave("draft")}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Draft
              </Button>
              <Button
                onClick={() => handleSave("finalized")}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Finalize Note
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Assistant */}
      <div className="lg:col-span-1">
        <NoteAIAssistant
          noteContent={formData.content}
          onCategoryUpdate={handleCategoryUpdate}
          onCodesUpdate={handleCodesUpdate}
          onSummaryUpdate={handleSummaryUpdate}
        />
      </div>
    </div>
  );
}