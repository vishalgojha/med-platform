import React from "react";
import AppointmentScheduler from "@/components/AppointmentScheduler";
import AppointmentReminders from "@/components/AppointmentReminders";
import { Calendar as CalendarIcon } from "lucide-react";

export default function Appointments() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Appointments</h2>
        <p className="text-slate-500 mt-1">Smart scheduling and automated patient reminders.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <AppointmentScheduler />
        </div>
        <div>
            <AppointmentReminders />
        </div>
      </div>
    </div>
  );
}