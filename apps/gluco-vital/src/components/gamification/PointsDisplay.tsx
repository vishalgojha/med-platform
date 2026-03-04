import { Zap, Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PointsDisplay({ points = 0, streak = 0, rank }) {
  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-5 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-amber-100 text-sm font-medium">Total Points</p>
            <p className="text-3xl font-bold">{points.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="text-center">
            <div className={cn(
              "p-2 rounded-lg mb-1",
              streak > 0 ? "bg-white/20" : "bg-white/10"
            )}>
              <Flame className={cn("w-5 h-5", streak > 0 ? "text-yellow-200" : "text-white/50")} />
            </div>
            <p className="text-lg font-bold">{streak}</p>
            <p className="text-xs text-amber-100">Streak</p>
          </div>
          
          {rank && (
            <div className="text-center">
              <div className="p-2 bg-white/20 rounded-lg mb-1">
                <Trophy className="w-5 h-5 text-yellow-200" />
              </div>
              <p className="text-lg font-bold">#{rank}</p>
              <p className="text-xs text-amber-100">Rank</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}