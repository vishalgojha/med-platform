import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from "framer-motion";

export default function PatientSummaryGenerator({ patientId, patient }) {
    const [summary, setSummary] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Fetch recent history specifically for the summary context
    const { data: entries } = useQuery({
        queryKey: ["medical_entries_for_summary", patientId],
        queryFn: () => appClient.entities.MedicalEntry.filter({ patient_id: patientId }, "-date", 50),
        enabled: !!patientId
    });

    const handleGenerate = async () => {
        if (!entries || entries.length === 0) {
            setSummary("No medical history available to generate a summary.");
            setIsExpanded(true);
            return;
        }

        setIsGenerating(true);
        setIsExpanded(true);
        
        try {
            const historyContext = entries.map(e => 
                `- ${e.date?.split('T')[0] || 'Unknown Date'} [${e.entry_type}]: ${e.summary} ${e.detailed_notes ? `(${e.detailed_notes})` : ''}`
            ).join('\n');

            const allergiesText = patient?.allergy_details?.length > 0
                ? patient.allergy_details.map(a => `${a.allergen} (${a.severity}): ${a.reaction}`).join('; ')
                : 'None recorded';

            const activeMeds = patient?.medication_history?.filter(m => m.status === 'active') || [];
            const medsText = activeMeds.length > 0
                ? activeMeds.map(m => `${m.medication_name} ${m.dosage} ${m.frequency}`).join(', ')
                : 'None recorded';

            const prompt = `
                Act as a senior medical consultant. Review the following comprehensive patient data and generate a detailed clinical summary for a doctor's review.
                
                Patient Name: ${patient?.full_name}
                DOB: ${patient?.date_of_birth || 'Unknown'}
                Blood Group: ${patient?.blood_group || 'Unknown'}
                
                **ALLERGIES & ADVERSE REACTIONS:**
                ${allergiesText}
                
                **CURRENT MEDICATIONS:**
                ${medsText}
                
                **CHRONIC CONDITIONS:**
                ${patient?.chronic_conditions || 'None recorded'}
                
                **PAST MEDICAL HISTORY:**
                ${patient?.past_medical_history || 'Not documented'}
                
                **Recent Medical Entries (Last 50):**
                ${historyContext}
                
                Please provide a comprehensive structured summary in Markdown format with these sections:
                
                ### 🏥 Clinical Overview
                Brief summary of patient's current health status and overall condition
                
                ### ⚠️ Critical Alerts
                Allergies, drug interactions, and safety concerns (HIGHLIGHT IF PRESENT)
                
                ### 📋 Active Problems & Diagnoses
                Current health issues requiring management
                
                ### 💊 Medication Review
                Current medications with assessment of adherence and effectiveness
                
                ### 📈 Clinical Trends
                Notable patterns in vitals, symptoms, or visit frequency
                
                ### 🔄 Recent Care Activities
                Summary of recent visits, procedures, and results
                
                ### 📝 Recommendations
                Clinical action items and follow-up needs

                Keep the tone professional, clinical, and objective. Prioritize patient safety information.
            `;

            const response = await appClient.integrations.Core.InvokeLLM({
                prompt: prompt
            });
            
            setSummary(response);
        } catch (error) {
            console.error("Failed to generate summary", error);
            setSummary("Failed to generate summary. Please try again later.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-100 mb-8">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-indigo-900 text-lg">AI Clinical Summary</CardTitle>
                            <p className="text-sm text-indigo-600/80">Generate an instant overview of patient history</p>
                        </div>
                    </div>
                    <Button 
                        onClick={handleGenerate} 
                        disabled={isGenerating}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <FileText className="w-4 h-4 mr-2" />
                                Generate Report
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>
            
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <CardContent className="pt-0 pb-6">
                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-indigo-100 mt-4">
                                {isGenerating ? (
                                    <div className="space-y-4 animate-pulse">
                                        <div className="h-4 bg-indigo-200 rounded w-3/4"></div>
                                        <div className="h-4 bg-indigo-200 rounded w-1/2"></div>
                                        <div className="h-32 bg-indigo-100 rounded w-full"></div>
                                    </div>
                                ) : (
                                    <div className="prose prose-sm prose-indigo max-w-none">
                                        <ReactMarkdown>{summary}</ReactMarkdown>
                                    </div>
                                )}
                                
                                <div className="flex justify-center mt-4">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-indigo-400 hover:text-indigo-600"
                                        onClick={() => setIsExpanded(false)}
                                    >
                                        <ChevronUp className="w-4 h-4 mr-1" />
                                        Hide Summary
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}