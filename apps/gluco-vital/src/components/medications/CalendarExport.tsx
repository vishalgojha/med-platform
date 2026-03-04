import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Download } from "lucide-react";
import { format, addDays, setHours, setMinutes } from "date-fns";
import { toast } from "sonner";

// Generate ICS file content for a medication reminder
const generateICSContent = (reminder, daysAhead = 30) => {
  const events = [];
  const now = new Date();
  
  const times = reminder.specific_times || ["08:00"];
  
  for (let day = 0; day < daysAhead; day++) {
    const date = addDays(now, day);
    
    times.forEach((timeStr) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const eventDate = setMinutes(setHours(date, hours), minutes);
      
      const dtStart = format(eventDate, "yyyyMMdd'T'HHmmss");
      const dtEnd = format(new Date(eventDate.getTime() + 15 * 60000), "yyyyMMdd'T'HHmmss");
      const uid = `glucovital-${reminder.id}-${dtStart}@glucovital.fit`;
      
      events.push(`BEGIN:VEVENT
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:💊 ${reminder.medication_name}${reminder.dosage ? ` - ${reminder.dosage}` : ""}
DESCRIPTION:Time to take your ${reminder.medication_name}.${reminder.notes ? `\\n\\nNotes: ${reminder.notes}` : ""}\\n\\nLogged via GlucoVital.fit
LOCATION:
STATUS:CONFIRMED
UID:${uid}
BEGIN:VALARM
TRIGGER:-PT5M
ACTION:DISPLAY
DESCRIPTION:Take ${reminder.medication_name}
END:VALARM
BEGIN:VALARM
TRIGGER:PT0M
ACTION:DISPLAY
DESCRIPTION:Take ${reminder.medication_name} NOW
END:VALARM
END:VEVENT`);
    });
  }
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GlucoVital.fit//Medication Reminders//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${reminder.medication_name} Reminders
X-WR-TIMEZONE:Asia/Kolkata
${events.join("\n")}
END:VCALENDAR`;
};

// Generate ICS for all reminders combined
const generateAllRemindersICS = (reminders, daysAhead = 30) => {
  const events = [];
  const now = new Date();
  
  reminders.forEach((reminder) => {
    if (!reminder.is_active) return;
    
    const times = reminder.specific_times || ["08:00"];
    
    for (let day = 0; day < daysAhead; day++) {
      const date = addDays(now, day);
      
      times.forEach((timeStr) => {
        const [hours, minutes] = timeStr.split(":").map(Number);
        const eventDate = setMinutes(setHours(date, hours), minutes);
        
        const dtStart = format(eventDate, "yyyyMMdd'T'HHmmss");
        const dtEnd = format(new Date(eventDate.getTime() + 15 * 60000), "yyyyMMdd'T'HHmmss");
        const uid = `glucovital-${reminder.id}-${dtStart}@glucovital.fit`;
        
        events.push(`BEGIN:VEVENT
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:💊 ${reminder.medication_name}${reminder.dosage ? ` - ${reminder.dosage}` : ""}
DESCRIPTION:Time to take your ${reminder.medication_name}.${reminder.notes ? `\\n\\nNotes: ${reminder.notes}` : ""}\\n\\nLogged via GlucoVital.fit
LOCATION:
STATUS:CONFIRMED
UID:${uid}
BEGIN:VALARM
TRIGGER:-PT5M
ACTION:DISPLAY
DESCRIPTION:Take ${reminder.medication_name}
END:VALARM
BEGIN:VALARM
TRIGGER:PT0M
ACTION:DISPLAY
DESCRIPTION:Take ${reminder.medication_name} NOW
END:VALARM
END:VEVENT`);
      });
    }
  });
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//GlucoVital.fit//Medication Reminders//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:GlucoVital Medication Reminders
X-WR-TIMEZONE:Asia/Kolkata
${events.join("\n")}
END:VCALENDAR`;
};

const downloadICS = (content, filename) => {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function CalendarExportButton({ reminder }) {
  const handleExport = () => {
    const icsContent = generateICSContent(reminder);
    const filename = `${reminder.medication_name.replace(/\s+/g, "_")}_reminders.ics`;
    downloadICS(icsContent, filename);
    toast.success("Calendar file downloaded!", {
      description: "Open the .ics file to add reminders to your calendar"
    });
  };
  
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleExport}
      className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
    >
      <Calendar className="w-3.5 h-3.5" />
      Add to Calendar
    </Button>
  );
}

export function ExportAllRemindersButton({ reminders }) {
  const activeReminders = reminders.filter(r => r.is_active);
  
  const handleExport = () => {
    if (activeReminders.length === 0) {
      toast.error("No active reminders to export");
      return;
    }
    
    const icsContent = generateAllRemindersICS(activeReminders);
    downloadICS(icsContent, "glucovital_medication_reminders.ics");
    toast.success("Calendar file downloaded!", {
      description: `${activeReminders.length} medication reminders for 30 days. Open the .ics file to add to your calendar.`
    });
  };
  
  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={activeReminders.length === 0}
      className="gap-2"
    >
      <Download className="w-4 h-4" />
      Export All to Calendar ({activeReminders.length})
    </Button>
  );
}

export default CalendarExportButton;