import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, CheckCircle2 } from "lucide-react";

export default function PatientBooking() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["current_user"],
    queryFn: () => appClient.auth.me(),
  });

  const { data: patients } = useQuery({
    queryKey: ["patients_for_booking"],
    queryFn: async () => {
      const allPatients = await appClient.entities.Patient.list("-created_date", 100);
      return allPatients.filter(p => p.created_by === user?.email);
    },
    enabled: !!user,
  });

  const createAppointment = useMutation({
    mutationFn: async (appointmentData) => {
      return await appClient.entities.Appointment.create(appointmentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_appointments"] });
      setShowSuccess(true);
      setSelectedDate(null);
      setSelectedTime("");
      setReason("");
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: (error) => {
      toast.error("Failed to book appointment");
    },
  });

  const timeSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !reason) {
      toast.error("Please fill all fields");
      return;
    }

    if (!patients || patients.length === 0) {
      toast.error("Please create your patient profile first");
      return;
    }

    const [hours, minutes, period] = selectedTime.match(/(\d+):(\d+)\s(AM|PM)/).slice(1);
    let hour = parseInt(hours);
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    const appointmentDate = new Date(selectedDate);
    appointmentDate.setHours(hour, parseInt(minutes), 0, 0);

    createAppointment.mutate({
      patient_id: patients[0].id,
      start_time: appointmentDate.toISOString(),
      reason: reason,
      status: "scheduled",
      duration_minutes: 30,
    });
  };

  if (showSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Appointment Booked!</h2>
            <p className="text-slate-600">Your appointment has been scheduled successfully.</p>
            <Button className="mt-6" onClick={() => setShowSuccess(false)}>
              Book Another
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Book Appointment</h1>
      <p className="text-slate-500 mb-4 md:mb-6 text-sm md:text-base">Schedule your visit with us</p>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <CalendarIcon className="w-4 h-4 md:w-5 md:h-5" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date.getDay() === 0}
                className="rounded-md border w-full"
              />
            </CardContent>
          </Card>

          <div className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Clock className="w-4 h-4 md:w-5 md:h-5" />
                  Select Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      type="button"
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                      className={`text-xs ${selectedTime === time ? "bg-blue-600" : ""}`}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Appointment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm">Reason for Visit *</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe your symptoms or reason for visit..."
                    rows={4}
                    required
                    className="text-sm"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-sm md:text-base"
                  disabled={createAppointment.isPending}
                >
                  {createAppointment.isPending ? "Booking..." : "Confirm Appointment"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}