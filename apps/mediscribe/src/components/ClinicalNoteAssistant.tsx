import React, { useState } from 'react';
import { appClient } from "@/api/appClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Wand2, Save, Loader2, FilePlus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function ClinicalNoteAssistant({ patientId, onEntryCreated }) {
    const [mode, setMode] = useState("input"); // input, review
    const [rawNotes, setRawNotes] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    
    const [structuredData, setStructuredData] = useState({
        entry_type: "consultation",
        summary: "",
        detailed_notes: ""
    });

    const queryClient = useQueryClient();

    const generateStructure = async () => {
        if (!rawNotes.trim()) {
            toast.error("Please enter some notes first.");
            return;
        }

        setIsProcessing(true);
        try {
            const prompt = `
                Act as an expert Medical Scribe. Transform the following raw dictated notes/key points into a structured professional medical entry.
                
                Raw Input: "${rawNotes}"
                
                Return a JSON object with:
                1. "entry_type": One of ["consultation", "vitals", "prescription", "lab_result", "general_note"]. Choose the best fit.
                2. "summary": A concise, professional title/summary (max 10 words).
                3. "detailed_notes": The full clinical note, rewritten in professional medical terminology, organized and clear.
            `;

            const response = await appClient.integrations.Core.InvokeLLM({
                prompt: prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        entry_type: { type: "string", enum: ["consultation", "vitals", "prescription", "lab_result", "general_note"] },
                        summary: { type: "string" },
                        detailed_notes: { type: "string" }
                    },
                    required: ["entry_type", "summary", "detailed_notes"]
                }
            });

            setStructuredData(response);
            setMode("review");
        } catch (error) {
            console.error("AI Generation failed:", error);
            toast.error("Failed to process notes. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const createEntryMutation = useMutation({
        mutationFn: async (data) => {
            // Try to get current user for doctor name, fallback to "Medical Staff"
            let doctorName = "Medical Staff";
            try {
                const user = await appClient.auth.me();
                if (user?.full_name) doctorName = user.full_name;
            } catch (e) {
                // User might not be logged in or other error
            }

            return appClient.entities.MedicalEntry.create({
                ...data,
                patient_id: patientId,
                doctor_name: doctorName,
                date: new Date().toISOString()
            });
        },
        onSuccess: () => {
            toast.success("Medical entry saved successfully");
            queryClient.invalidateQueries(["medical_entries", patientId]);
            // Reset form
            setRawNotes("");
            setStructuredData({
                entry_type: "consultation",
                summary: "",
                detailed_notes: ""
            });
            setMode("input");
            if (onEntryCreated) onEntryCreated();
        },
        onError: () => {
            toast.error("Failed to save entry");
        }
    });

    const handleSave = () => {
        if (!structuredData.summary || !structuredData.detailed_notes) {
            toast.error("Please ensure summary and notes are filled.");
            return;
        }
        createEntryMutation.mutate(structuredData);
    };

    return (
        <Card className="border-indigo-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <Wand2 className="w-4 h-4" />
                    </div>
                    AI Clinical Assistant
                </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-6">
                {mode === "input" ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="raw-notes" className="text-slate-600">
                                Dictation / Raw Notes
                            </Label>
                            <Textarea
                                id="raw-notes"
                                placeholder="Type raw notes here (e.g. 'Patient complains of persistent headache for 3 days, BP 130/85, prescribed Ibuprofen 400mg...')"
                                className="min-h-[120px] resize-none text-base"
                                value={rawNotes}
                                onChange={(e) => setRawNotes(e.target.value)}
                            />
                            <p className="text-xs text-slate-400">
                                The AI will structure this into professional clinical documentation.
                            </p>
                        </div>
                        
                        <Button 
                            onClick={generateStructure} 
                            disabled={isProcessing || !rawNotes.trim()}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing Clinical Data...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-4 h-4 mr-2" />
                                    Generate Structured Entry
                                </>
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium text-slate-900">Review & Save</h3>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setMode("input")}
                                className="text-slate-500 hover:text-slate-700"
                            >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Edit Raw Input
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Entry Type</Label>
                                <Select 
                                    value={structuredData.entry_type} 
                                    onValueChange={(val) => setStructuredData({...structuredData, entry_type: val})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="consultation">Consultation</SelectItem>
                                        <SelectItem value="vitals">Vitals</SelectItem>
                                        <SelectItem value="prescription">Prescription</SelectItem>
                                        <SelectItem value="lab_result">Lab Result</SelectItem>
                                        <SelectItem value="general_note">General Note</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Summary / Title</Label>
                                <Input 
                                    value={structuredData.summary}
                                    onChange={(e) => setStructuredData({...structuredData, summary: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Detailed Clinical Notes</Label>
                            <Textarea 
                                className="min-h-[200px] font-mono text-sm bg-slate-50"
                                value={structuredData.detailed_notes}
                                onChange={(e) => setStructuredData({...structuredData, detailed_notes: e.target.value})}
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => setMode("input")}
                            >
                                Cancel
                            </Button>
                            <Button 
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                onClick={handleSave}
                                disabled={createEntryMutation.isPending}
                            >
                                {createEntryMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                Save to Record
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}