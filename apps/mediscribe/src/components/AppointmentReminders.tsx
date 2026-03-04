import React from 'react';
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, Loader2, CalendarCheck2 } from "lucide-react";
import { format, isAfter } from "date-fns";
import { toast } from "sonner";

export default function AppointmentReminders() {
    const [sendingId, setSendingId] = React.useState(null);

    const { data: appointments } = useQuery({
        queryKey: ["appointments"],
        queryFn: () => appClient.entities.Appointment.list("-start_time", 50),
    });

    // Filter strictly for upcoming
    const upcoming = appointments?.filter(a => 
        a.status === 'scheduled' && isAfter(new Date(a.start_time), new Date())
    ) || [];

    const handleSendReminder = async (apt) => {
        setSendingId(apt.id);
        try {
            const response = await appClient.functions.invoke('sendAppointmentReminder', {
                appointment_id: apt.id
            });
            
            const result = response.data;
            toast.success("Reminder sent!", {
                description: `Sent to ${result.reminder.patient_name}`
            });
            
        } catch (error) {
            toast.error("Failed to process reminder");
        } finally {
            setSendingId(null);
        }
    };

    return (
        <Card className="h-full border-slate-200 shadow-sm">
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    Upcoming Reminders
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {upcoming.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            No upcoming appointments to remind.
                        </div>
                    ) : (
                        upcoming.map(apt => (
                            <div key={apt.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div>
                                    <div className="font-medium text-slate-800">
                                        {format(new Date(apt.start_time), "MMM d, h:mm a")}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate max-w-[150px]">
                                        {apt.reason}
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={sendingId === apt.id}
                                    onClick={() => handleSendReminder(apt)}
                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                >
                                    {sendingId === apt.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}