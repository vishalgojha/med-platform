import { Clock, CheckCircle2, Circle, Droplet } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday } from "date-fns";

const INSULIN_SCHEDULE = [
  { id: "fasting", label: "Fasting", time: "Before breakfast", icon: "🌅", priority: "high" },
  { id: "pp_breakfast", label: "PP Breakfast", time: "2 hrs after breakfast", icon: "🍳", priority: "high" },
  { id: "pp_lunch", label: "PP Lunch", time: "2 hrs after lunch", icon: "🍛", priority: "medium" },
  { id: "pp_dinner", label: "PP Dinner", time: "2 hrs after dinner", icon: "🍽️", priority: "medium" },
];

const NON_INSULIN_SCHEDULE = [
  { id: "fasting", label: "Fasting", time: "Before breakfast", icon: "🌅", priority: "high" },
  { id: "pp_any", label: "Post-Meal", time: "2 hrs after any meal", icon: "🍽️", priority: "medium" },
];

export default function RecommendedSchedule({ isOnInsulin = false, todayLogs = [] }) {
  const schedule = isOnInsulin ? INSULIN_SCHEDULE : NON_INSULIN_SCHEDULE;
  
  // Check which readings are done today
  const getCompletedReadings = () => {
    const sugarLogs = todayLogs.filter(log => log.log_type === "sugar");
    const completed = new Set();
    
    sugarLogs.forEach(log => {
      if (log.time_of_day === "morning_fasting") completed.add("fasting");
      if (log.time_of_day === "after_breakfast") completed.add("pp_breakfast");
      if (log.time_of_day === "after_lunch") completed.add("pp_lunch");
      if (log.time_of_day === "after_dinner") completed.add("pp_dinner");
      if (["after_breakfast", "after_lunch", "after_dinner"].includes(log.time_of_day)) {
        completed.add("pp_any");
      }
    });
    
    return completed;
  };
  
  const completedReadings = getCompletedReadings();
  const completedCount = schedule.filter(s => completedReadings.has(s.id)).length;
  const progress = (completedCount / schedule.length) * 100;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Today's Schedule</h3>
            <p className="text-xs text-slate-500">
              {isOnInsulin ? "Insulin therapy plan" : "Daily monitoring"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-slate-800">{completedCount}/{schedule.length}</span>
          <p className="text-xs text-slate-500">done</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full mb-4 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Schedule items */}
      <div className="space-y-2">
        {schedule.map((item) => {
          const isCompleted = completedReadings.has(item.id);
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all",
                isCompleted 
                  ? "bg-green-50 border border-green-100" 
                  : item.priority === "high"
                    ? "bg-amber-50 border border-amber-100"
                    : "bg-slate-50 border border-slate-100"
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <div className="flex-1">
                <p className={cn(
                  "font-medium text-sm",
                  isCompleted ? "text-green-700" : "text-slate-700"
                )}>
                  {item.label}
                </p>
                <p className="text-xs text-slate-500">{item.time}</p>
              </div>
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300" />
              )}
            </div>
          );
        })}
      </div>

      {completedCount === schedule.length && (
        <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 text-center">
          <p className="text-green-700 font-medium">🎉 All readings done for today!</p>
          <p className="text-xs text-green-600 mt-1">Great job staying on track!</p>
        </div>
      )}
    </div>
  );
}