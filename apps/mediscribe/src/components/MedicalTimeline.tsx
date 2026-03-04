import React from "react";
import { useQuery } from "@tanstack/react-query";
import { appClient } from "@/api/appClient";
import { format } from "date-fns";
import { Activity, Pill, FileText, FlaskConical, CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const typeConfig = {
  consultation: { icon: FileText, color: "bg-blue-100 text-blue-700" },
  vitals: { icon: Activity, color: "bg-green-100 text-green-700" },
  prescription: { icon: Pill, color: "bg-purple-100 text-purple-700" },
  lab_result: { icon: FlaskConical, color: "bg-amber-100 text-amber-700" },
  general_note: { icon: CalendarClock, color: "bg-slate-100 text-slate-700" },
  diagnosis: { icon: FileText, color: "bg-red-100 text-red-700" },
  procedure: { icon: Activity, color: "bg-indigo-100 text-indigo-700" },
  follow_up: { icon: CalendarClock, color: "bg-teal-100 text-teal-700" },
  imaging: { icon: FlaskConical, color: "bg-cyan-100 text-cyan-700" },
  vaccination: { icon: Pill, color: "bg-pink-100 text-pink-700" },
};

export default function MedicalTimeline({ patientId }) {
  const { data: entries, isLoading } = useQuery({
    queryKey: ["medical_entries", patientId],
    queryFn: () =>
      appClient.entities.MedicalEntry.list(
        "-date", // sort desc
        100,
        // We'd typically filter by patient_id here, but list() doesn't support direct filtering params in first arg usually unless supported by the client.
        // Assuming the SDK supports filtering via a separate method or we filter client side for this demo if simple list() is returned.
        // The prompt instructions say: appClient.entities.Todo.filter({status: 'active'}, '-created_date', 10)
      ),
  });
  
  // Correct way to fetch with filter according to instructions
  const { data: filteredEntries, isLoading: isFilteredLoading } = useQuery({
      queryKey: ["medical_entries_filtered", patientId],
      queryFn: () => appClient.entities.MedicalEntry.filter({ patient_id: patientId }, "-date", 50)
  });

  if (isFilteredLoading) return <div className="py-10 text-center text-slate-500">Loading history...</div>;
  
  if (!filteredEntries || filteredEntries.length === 0) {
       return <div className="py-10 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">No medical history recorded yet.</div>;
  }

  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
      {filteredEntries.map((entry) => {
        const Config = typeConfig[entry.entry_type] || typeConfig.general_note;
        const Icon = Config.icon;

        return (
          <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            
            {/* Icon Indicator */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-200 group-[.is-active]:bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${Config.color.replace('text-', 'bg-').split(' ')[0]} bg-opacity-20`}>
                    <Icon className={`w-3.5 h-3.5 ${Config.color.split(' ')[1]}`} />
                </div>
            </div>
            
            {/* Card Content */}
            <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 shadow-sm border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="secondary" className={`${Config.color} border-transparent font-medium capitalize`}>
                    {entry.entry_type.replace('_', ' ')}
                </Badge>
                <span className="text-xs font-medium text-slate-400">
                    {entry.date ? format(new Date(entry.date), "MMM d, h:mm a") : "No Date"}
                </span>
              </div>
              
              <h4 className="font-semibold text-slate-800 mb-1">{entry.summary}</h4>
              
              {entry.detailed_notes && (
                  <p className="text-sm text-slate-600 leading-relaxed mt-2 bg-slate-50 p-3 rounded-md border border-slate-100">
                    {entry.detailed_notes}
                  </p>
              )}
              
              {entry.medications_prescribed && entry.medications_prescribed.length > 0 && (
                  <div className="mt-3 p-2 bg-purple-50 rounded border border-purple-100">
                    <div className="text-xs font-semibold text-purple-700 mb-1">Medications Prescribed:</div>
                    <div className="space-y-1">
                      {entry.medications_prescribed.map((med, idx) => (
                        <div key={idx} className="text-xs text-purple-600">
                          • {med.medication_name} {med.dosage} - {med.frequency} {med.duration && `for ${med.duration}`}
                        </div>
                      ))}
                    </div>
                  </div>
              )}

              {entry.tags && entry.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {entry.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
              )}
              
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <span className="font-medium text-slate-500">Logged by:</span>
                {entry.doctor_name || "System Agent"}
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );
}