import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  Clock, 
  Pill,
  AlertTriangle,
  Droplet,
  Utensils,
  Bot,
  Activity,
  Heart,
  Footprints,
  Moon,
  MessageCircle
} from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isToday, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  parseISO
} from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_COLORS = {
  taken: "bg-green-500",
  missed: "bg-red-500",
  skipped: "bg-amber-500",
  late: "bg-orange-500",
  pending: "bg-slate-300"
};

export default function MedicationCalendar({ userEmail, reminders = [] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch health logs (agent-captured data)
  const { data: healthLogs = [] } = useQuery({
    queryKey: ['health-logs-calendar', userEmail, format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const logs = await appClient.entities.HealthLog.filter({ 
        user_email: userEmail 
      });
      return logs.filter(log => {
        const date = new Date(log.created_date);
        return date >= start && date <= end && log.status !== 'deleted' && log.status !== 'corrected';
      });
    },
    enabled: !!userEmail
  });

  const { data: adherenceRecords = [] } = useQuery({
    queryKey: ['medication-adherence-calendar', userEmail, format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      const records = await appClient.entities.MedicationAdherence.filter({ 
        user_email: userEmail 
      });
      return records.filter(r => {
        const date = new Date(r.scheduled_time);
        return date >= start && date <= end;
      });
    },
    enabled: !!userEmail
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getLogsForDay = (date) => {
    return healthLogs.filter(log => 
      isSameDay(new Date(log.created_date), date)
    );
  };

  const getDayStatus = (date) => {
    const dayLogs = getLogsForDay(date);
    if (dayLogs.length === 0) return null;
    
    // Check if we have multiple log types (good coverage)
    const logTypes = [...new Set(dayLogs.map(l => l.log_type))];
    if (logTypes.length >= 3) return 'complete';
    if (logTypes.length >= 1) return 'partial';
    return null;
  };

  const selectedDayLogs = getLogsForDay(selectedDate);

  // Calculate monthly stats based on health logs
  const monthlyStats = {
    total: healthLogs.length,
    glucose: healthLogs.filter(l => l.log_type === 'sugar').length,
    meals: healthLogs.filter(l => l.log_type === 'meal').length,
    medications: healthLogs.filter(l => l.log_type === 'medication').length
  };

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarIcon className="w-5 h-5 text-violet-500" />
              Daily Logs
              <Badge variant="outline" className="ml-2 text-xs font-normal text-violet-600 border-violet-200">
                <Bot className="w-3 h-3 mr-1" />
                Agent-powered
              </Badge>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">Auto-captured from WhatsApp & voice notes</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium text-slate-700 min-w-[140px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Monthly Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="p-2 bg-violet-50 rounded-lg text-center">
            <p className="text-lg font-bold text-violet-700">{monthlyStats.total}</p>
            <p className="text-xs text-violet-600">Logs Captured</p>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg text-center">
            <p className="text-lg font-bold text-blue-600">{monthlyStats.glucose}</p>
            <p className="text-xs text-blue-600">Glucose</p>
          </div>
          <div className="p-2 bg-amber-50 rounded-lg text-center">
            <p className="text-lg font-bold text-amber-600">{monthlyStats.meals}</p>
            <p className="text-xs text-amber-600">Meals</p>
          </div>
          <div className="p-2 bg-green-50 rounded-lg text-center">
            <p className="text-lg font-bold text-green-600">{monthlyStats.medications}</p>
            <p className="text-xs text-green-600">Medications</p>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
              {day}
            </div>
          ))}
          {days.map((day, idx) => {
            const status = getDayStatus(day);
            const dayLogs = getLogsForDay(day);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            
            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "aspect-square p-1 rounded-lg text-sm relative transition-all",
                  isCurrentMonth ? "text-slate-700" : "text-slate-300",
                  isToday(day) && "ring-2 ring-violet-400",
                  isSelected && "bg-violet-100",
                  !isSelected && "hover:bg-slate-50"
                )}
              >
                <span className="block">{format(day, 'd')}</span>
                {dayLogs.length > 0 && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {status === 'complete' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    )}
                    {status === 'partial' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    )}
                    {!status && dayLogs.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day Details */}
        <div className="border-t border-slate-100 pt-4">
          <div className="mb-3">
            <h4 className="font-medium text-slate-700 flex items-center gap-2">
              Daily Logs · {format(selectedDate, "EEE, MMM d")}
            </h4>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Bot className="w-3 h-3" /> Logged automatically by your care agent
            </p>
          </div>
          
          {selectedDayLogs.length > 0 ? (
            <div className="space-y-3">
              {/* Agent Summary */}
              <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
                <p className="text-sm text-violet-700">
                  {selectedDayLogs.length === 1 && "You logged 1 health update this day."}
                  {selectedDayLogs.length === 2 && "You logged 2 health updates this day."}
                  {selectedDayLogs.length >= 3 && selectedDayLogs.length < 5 && `Good consistency — ${selectedDayLogs.length} logs captured 👍`}
                  {selectedDayLogs.length >= 5 && `Excellent tracking — ${selectedDayLogs.length} logs captured 🎉`}
                </p>
              </div>

              {/* Timeline View */}
              <div className="space-y-1">
                {selectedDayLogs
                  .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                  .map((log, idx) => {
                    const logTime = new Date(log.created_date);
                    const LogIcon = {
                      sugar: Droplet,
                      blood_pressure: Heart,
                      meal: Utensils,
                      medication: Pill,
                      exercise: Footprints,
                      sleep: Moon,
                      steps: Footprints,
                      weight: Activity
                    }[log.log_type] || Clock;
                    
                    const bgColor = {
                      sugar: "bg-blue-50 border-blue-200",
                      blood_pressure: "bg-red-50 border-red-200",
                      meal: "bg-amber-50 border-amber-200",
                      medication: "bg-green-50 border-green-200",
                      exercise: "bg-teal-50 border-teal-200",
                      sleep: "bg-indigo-50 border-indigo-200"
                    }[log.log_type] || "bg-slate-50 border-slate-200";
                    
                    const iconColor = {
                      sugar: "text-blue-500",
                      blood_pressure: "text-red-500",
                      meal: "text-amber-500",
                      medication: "text-green-500",
                      exercise: "text-teal-500",
                      sleep: "text-indigo-500"
                    }[log.log_type] || "text-slate-500";

                    return (
                      <div 
                        key={idx} 
                        className={cn("flex items-start gap-3 p-3 rounded-lg border", bgColor)}
                      >
                        <div className="flex-shrink-0 text-xs text-slate-500 w-14 pt-0.5">
                          {format(logTime, "h:mm a")}
                        </div>
                        <LogIcon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", iconColor)} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-700 text-sm capitalize">
                            {log.log_type === 'sugar' && `Glucose: ${log.value}`}
                            {log.log_type === 'blood_pressure' && `BP: ${log.value}`}
                            {log.log_type === 'meal' && `${log.time_of_day?.replace('_', ' ') || 'Meal'}: ${log.value}`}
                            {log.log_type === 'medication' && `Medication: ${log.value}`}
                            {!['sugar', 'blood_pressure', 'meal', 'medication'].includes(log.log_type) && 
                              `${log.log_type.replace('_', ' ')}: ${log.value}`
                            }
                          </p>
                          {log.notes && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{log.notes}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-[10px] flex-shrink-0">
                          {log.source === 'whatsapp' ? 'chat' : log.source === 'agent' ? 'agent' : log.source || 'manual'}
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 bg-gradient-to-br from-violet-50 to-slate-50 rounded-lg border border-violet-100">
              <Bot className="w-10 h-10 text-violet-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">No logs this day</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
                Send a message on WhatsApp anytime to log
              </p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-green-500" /> Good coverage
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Agent activity
          </div>
        </div>
      </CardContent>
    </Card>
  );
}