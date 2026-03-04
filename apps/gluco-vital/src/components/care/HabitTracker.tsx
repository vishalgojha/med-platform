import React, { useState } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  Droplets, Footprints, Moon, Apple, Salad, Heart, 
  Plus, Check, Flame, Target, Sparkles, Bot, MessageCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, isToday, parseISO } from "date-fns";

const HABIT_CONFIG = {
  water_intake: { icon: Droplets, color: "text-blue-500", bg: "bg-blue-50", label: "Water Intake", unit: "glasses", defaultTarget: 8 },
  exercise: { icon: Footprints, color: "text-green-500", bg: "bg-green-50", label: "Exercise", unit: "minutes", defaultTarget: 30 },
  walking: { icon: Footprints, color: "text-emerald-500", bg: "bg-emerald-50", label: "Walking", unit: "steps", defaultTarget: 5000 },
  sleep: { icon: Moon, color: "text-indigo-500", bg: "bg-indigo-50", label: "Sleep", unit: "hours", defaultTarget: 7 },
  foot_check: { icon: Heart, color: "text-pink-500", bg: "bg-pink-50", label: "Foot Check", unit: "times", defaultTarget: 1 },
  weight_check: { icon: Target, color: "text-purple-500", bg: "bg-purple-50", label: "Weight Check", unit: "times", defaultTarget: 1 },
  vegetable_intake: { icon: Salad, color: "text-lime-500", bg: "bg-lime-50", label: "Vegetables", unit: "servings", defaultTarget: 3 },
  meditation: { icon: Sparkles, color: "text-amber-500", bg: "bg-amber-50", label: "Meditation", unit: "minutes", defaultTarget: 10 },
  yoga: { icon: Heart, color: "text-rose-500", bg: "bg-rose-50", label: "Yoga", unit: "minutes", defaultTarget: 20 },
  no_sugar: { icon: Apple, color: "text-red-500", bg: "bg-red-50", label: "No Added Sugar", unit: "day", defaultTarget: 1 },
  other: { icon: Target, color: "text-slate-500", bg: "bg-slate-50", label: "Custom", unit: "", defaultTarget: 1 }
};

export default function HabitTracker({ userEmail }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ habit_type: "water_intake", habit_name: "", target_value: 8, target_unit: "glasses" });
  const [logValue, setLogValue] = useState({});
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: habits = [] } = useQuery({
    queryKey: ['daily-habits', userEmail],
    queryFn: () => appClient.entities.DailyHabit.filter({ user_email: userEmail }),
    enabled: !!userEmail
  });

  const { data: todayLogs = [] } = useQuery({
    queryKey: ['habit-logs', userEmail, today],
    queryFn: () => appClient.entities.HabitLog.filter({ user_email: userEmail, log_date: today }),
    enabled: !!userEmail
  });

  // Fetch health logs to detect habits from agent conversations
  const { data: healthLogs = [] } = useQuery({
    queryKey: ['health-logs-habits', userEmail, today],
    queryFn: async () => {
      const logs = await appClient.entities.HealthLog.filter({ user_email: userEmail });
      // Get last 7 days of logs
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return logs.filter(l => new Date(l.created_date) >= weekAgo && l.status !== 'deleted' && l.status !== 'corrected');
    },
    enabled: !!userEmail
  });

  // Infer habits from health logs
  const inferredHabits = React.useMemo(() => {
    const inferred = [];
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayHealthLogs = healthLogs.filter(l => format(new Date(l.created_date), 'yyyy-MM-dd') === todayStr);
    
    // Water intake from notes/values
    const waterLogs = healthLogs.filter(l => 
      l.notes?.toLowerCase().includes('water') || 
      l.notes?.toLowerCase().includes('drank') ||
      l.notes?.toLowerCase().includes('glasses')
    );
    if (waterLogs.length > 0) {
      inferred.push({
        type: 'water_intake',
        detected: true,
        todayCount: waterLogs.filter(l => format(new Date(l.created_date), 'yyyy-MM-dd') === todayStr).length,
        source: 'agent'
      });
    }

    // Exercise/walking from logs
    const exerciseLogs = healthLogs.filter(l => l.log_type === 'exercise' || l.log_type === 'steps');
    if (exerciseLogs.length > 0) {
      inferred.push({
        type: 'exercise',
        detected: true,
        todayCount: exerciseLogs.filter(l => format(new Date(l.created_date), 'yyyy-MM-dd') === todayStr).length,
        source: 'agent'
      });
    }

    // Sleep from logs
    const sleepLogs = healthLogs.filter(l => l.log_type === 'sleep');
    if (sleepLogs.length > 0) {
      inferred.push({
        type: 'sleep',
        detected: true,
        todayCount: sleepLogs.filter(l => format(new Date(l.created_date), 'yyyy-MM-dd') === todayStr).length,
        source: 'agent'
      });
    }

    // Meals/vegetables from meal logs
    const mealLogs = healthLogs.filter(l => l.log_type === 'meal');
    const vegMeals = mealLogs.filter(l => 
      l.notes?.toLowerCase().includes('vegetable') || 
      l.notes?.toLowerCase().includes('sabzi') ||
      l.notes?.toLowerCase().includes('salad') ||
      l.value?.toLowerCase().includes('vegetable')
    );
    if (vegMeals.length > 0) {
      inferred.push({
        type: 'vegetable_intake',
        detected: true,
        todayCount: vegMeals.filter(l => format(new Date(l.created_date), 'yyyy-MM-dd') === todayStr).length,
        source: 'agent'
      });
    }

    // Medication adherence
    const medLogs = healthLogs.filter(l => l.log_type === 'medication');
    if (medLogs.length > 0) {
      inferred.push({
        type: 'medication',
        detected: true,
        todayCount: medLogs.filter(l => format(new Date(l.created_date), 'yyyy-MM-dd') === todayStr).length,
        source: 'agent'
      });
    }

    return inferred;
  }, [healthLogs]);

  const createHabitMutation = useMutation({
    mutationFn: (data) => appClient.entities.DailyHabit.create({ 
      ...data, 
      user_email: userEmail,
      is_active: true,
      current_streak: 0,
      longest_streak: 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-habits'] });
      toast.success("Habit added!");
      setShowForm(false);
      setFormData({ habit_type: "water_intake", habit_name: "", target_value: 8, target_unit: "glasses" });
    }
  });

  const logHabitMutation = useMutation({
    mutationFn: async ({ habitId, habitType, value, target }) => {
      const completed = value >= target;
      await appClient.entities.HabitLog.create({
        user_email: userEmail,
        habit_id: habitId,
        habit_type: habitType,
        log_date: today,
        value: value,
        completed: completed,
        source: 'app'
      });
      // Update streak if completed
      if (completed) {
        const habit = habits.find(h => h.id === habitId);
        if (habit) {
          const newStreak = (habit.current_streak || 0) + 1;
          await appClient.entities.DailyHabit.update(habitId, {
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, habit.longest_streak || 0),
            last_completed_date: today
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['daily-habits'] });
      toast.success("Logged! 🎉");
    }
  });

  const getTodayLog = (habitId) => todayLogs.find(l => l.habit_id === habitId);

  const handleTypeChange = (type) => {
    const config = HABIT_CONFIG[type];
    setFormData(prev => ({
      ...prev,
      habit_type: type,
      target_value: config.defaultTarget,
      target_unit: config.unit
    }));
  };

  return (
    <Card className="border-slate-100 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Daily Habits
              <Badge variant="outline" className="ml-1 text-xs font-normal text-violet-600 border-violet-200">
                <Bot className="w-3 h-3 mr-1" />
                Auto-logged
              </Badge>
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">Detected from your chats & voice notes</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Agent-Inferred Habits */}
        {inferredHabits.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
              <Bot className="w-3 h-3" /> Detected by Agent
            </p>
            <div className="grid grid-cols-2 gap-2">
              {inferredHabits.map((inferred, idx) => {
                const config = HABIT_CONFIG[inferred.type] || HABIT_CONFIG.other;
                const Icon = config.icon;
                return (
                  <div key={idx} className={`p-3 rounded-lg ${config.bg} border border-slate-100`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${config.color}`} />
                      <span className="text-sm font-medium">{config.label}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">
                        {inferred.todayCount > 0 ? `${inferred.todayCount} today` : 'This week'}
                      </span>
                      <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">
                        ✓ Detected
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state when no agent-detected habits */}
        {inferredHabits.length === 0 && habits.length === 0 ? (
          <div className="text-center py-6 bg-gradient-to-br from-violet-50 to-slate-50 rounded-lg border border-violet-100">
            <Bot className="w-10 h-10 text-violet-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">No habits detected yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
              Just chat naturally on WhatsApp — I'll learn your routines automatically
            </p>
            <div className="mt-3 p-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-600">
              <p className="font-medium mb-1">Try saying:</p>
              <p className="text-slate-500">"Drank 3 glasses of water"</p>
              <p className="text-slate-500">"Walked 20 mins after dinner"</p>
              <p className="text-slate-500">"No sweets today"</p>
            </div>
          </div>
        ) : habits.length > 0 ? (
          <div className="space-y-3">
            {habits.filter(h => h.is_active).map(habit => {
              const config = HABIT_CONFIG[habit.habit_type] || HABIT_CONFIG.other;
              const Icon = config.icon;
              const todayLog = getTodayLog(habit.id);
              const currentValue = todayLog?.value || logValue[habit.id] || 0;
              const progress = Math.min((currentValue / habit.target_value) * 100, 100);
              const isCompleted = todayLog?.completed;

              return (
                <div key={habit.id} className={`p-3 rounded-lg ${config.bg} border border-slate-100`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${config.color}`} />
                      <span className="font-medium text-sm">
                        {habit.habit_name || config.label}
                      </span>
                      {habit.current_streak > 0 && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Flame className="w-3 h-3" /> {habit.current_streak}
                        </span>
                      )}
                    </div>
                    {isCompleted && (
                      <span className="text-green-600">
                        <Check className="w-5 h-5" />
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Progress value={progress} className="flex-1 h-2" />
                    <span className="text-xs text-slate-600 min-w-[60px] text-right">
                      {currentValue}/{habit.target_value} {habit.target_unit}
                    </span>
                  </div>

                  {!isCompleted && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={logValue[habit.id] || ""}
                        onChange={(e) => setLogValue(prev => ({ ...prev, [habit.id]: parseInt(e.target.value) || 0 }))}
                        placeholder={`Enter ${habit.target_unit}`}
                        className="h-8 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => logHabitMutation.mutate({
                          habitId: habit.id,
                          habitType: habit.habit_type,
                          value: logValue[habit.id] || 0,
                          target: habit.target_value
                        })}
                        disabled={!logValue[habit.id]}
                      >
                        Log
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Tip for agent logging */}
        {(inferredHabits.length > 0 || habits.length > 0) && (
          <div className="mt-4 p-3 bg-violet-50 rounded-lg border border-violet-100">
            <p className="text-xs text-violet-700 flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span className="font-medium">Tip:</span> Just chat naturally — "walked 30 mins", "no sugar today"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}