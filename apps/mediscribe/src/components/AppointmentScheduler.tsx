import React, { useState } from 'react';
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Sparkles, Loader2, Check } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AppointmentScheduler() {
    const [selectedPatient, setSelectedPatient] = useState("");
    const [availability, setAvailability] = useState("");
    const [reason, setReason] = useState("");
    const [suggestedSlot, setSuggestedSlot] = useState(null);
    const [isThinking, setIsThinking] = useState(false);
    const queryClient = useQueryClient();

    const { data: patients } = useQuery({
        queryKey: ["patients_list_simple"],
        queryFn: () => appClient.entities.Patient.list("full_name", 100),
    });

    const handleGetSuggestion = async () => {
        if (!availability || !selectedPatient) {
            toast.error("Please select a patient and specify availability.");
            return;
        }

        setIsThinking(true);
        try {
            // Get existing appointments to check conflicts (mock context for now or simple fetch)
            const existing = await appClient.entities.Appointment.list("-start_time", 20);
            const existingContext = existing.map(a => `${a.start_time} (${a.duration_minutes}m)`).join(", ");

            const prompt = `
                Suggest an optimal appointment slot.
                Current Date: ${new Date().toISOString()}
                
                Doctor's Availability/Constraints: "${availability}"
                Patient Reason: "${reason}"
                
                Existing Appointments (to avoid): ${existingContext}
                
                Return a JSON object with:
                - "suggested_time": ISO 8601 datetime string
                - "explanation": Short reason for this slot
            `;

            const res = await appClient.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        suggested_time: { type: "string" },
                        explanation: { type: "string" }
                    }
                }
            });

            setSuggestedSlot(res);
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate suggestion");
        } finally {
            setIsThinking(false);
        }
    };

    const createAppointment = useMutation({
        mutationFn: (data) => appClient.entities.Appointment.create(data),
        onSuccess: () => {
            toast.success("Appointment scheduled!");
            queryClient.invalidateQueries(["appointments"]);
            setSuggestedSlot(null);
            setReason("");
            setAvailability("");
        }
    });

    const handleConfirm = () => {
        if (!suggestedSlot || !selectedPatient) return;
        createAppointment.mutate({
            patient_id: selectedPatient,
            start_time: suggestedSlot.suggested_time,
            reason: reason || "General Consultation",
            duration_minutes: 30,
            status: "scheduled"
        });
    };

    return (
        <Card className="h-full border-slate-200 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    AI Scheduler
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Patient</label>
                    <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Patient" />
                        </SelectTrigger>
                        <SelectContent>
                            {patients?.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Visit Reason</label>
                    <Input 
                        placeholder="e.g. Annual checkup, Persistent cough..." 
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Availability / Constraints</label>
                    <Textarea 
                        placeholder="e.g. I'm free next Tuesday afternoon or Friday morning."
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value)}
                        className="h-24 resize-none"
                    />
                </div>

                {!suggestedSlot ? (
                    <Button 
                        onClick={handleGetSuggestion} 
                        disabled={isThinking}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {isThinking ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Finding Best Slot...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Suggest Slot
                            </>
                        )}
                    </Button>
                ) : (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-start gap-3">
                            <div className="bg-white p-2 rounded-lg shadow-sm text-indigo-600">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-indigo-900">
                                    {format(new Date(suggestedSlot.suggested_time), "EEEE, MMMM d, yyyy")}
                                </p>
                                <p className="text-lg font-bold text-indigo-700">
                                    {format(new Date(suggestedSlot.suggested_time), "h:mm a")}
                                </p>
                                <p className="text-xs text-indigo-600/80 mt-1">{suggestedSlot.explanation}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setSuggestedSlot(null)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button 
                                size="sm" 
                                onClick={handleConfirm}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                            >
                                <Check className="w-4 h-4 mr-2" />
                                Confirm & Book
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}