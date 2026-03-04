import { Shield, Clock, Gift } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const WEEKLY_CHALLENGES = [
  { id: 1, name: "Log every day this week", target: 7, reward: 100, type: "daily_log" },
  { id: 2, name: "Hit sugar target 5 times", target: 5, reward: 75, type: "target_hit" },
  { id: 3, name: "Log 3 meals for 3 days", target: 9, reward: 50, type: "meal_log" },
  { id: 4, name: "Morning check 5 days", target: 5, reward: 60, type: "morning_log" },
];

export default function WeeklyChallenge({ progress = 0, challengeIndex = 0 }) {
  const challenge = WEEKLY_CHALLENGES[challengeIndex % WEEKLY_CHALLENGES.length];
  const progressPercent = Math.min((progress / challenge.target) * 100, 100);
  const isComplete = progress >= challenge.target;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-5 border border-indigo-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-indigo-100 rounded-xl">
          <Shield className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Weekly Challenge</h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            <span>Resets Sunday</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-amber-600 font-semibold text-sm">
          <Gift className="w-4 h-4" />
          +{challenge.reward}
        </div>
      </div>

      <p className="text-sm text-slate-700 font-medium mb-3">{challenge.name}</p>
      
      <div className="space-y-2">
        <Progress value={progressPercent} className="h-2.5" />
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">{progress}/{challenge.target} completed</span>
          {isComplete ? (
            <span className="text-green-600 font-medium">✓ Complete!</span>
          ) : (
            <span className="text-indigo-600 font-medium">{challenge.target - progress} to go</span>
          )}
        </div>
      </div>
    </div>
  );
}