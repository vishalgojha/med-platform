import { 
  Flame, Target, Calendar, Award, Star, Heart, 
  TrendingUp, CheckCircle, Zap, Crown, Shield, Sparkles 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const BADGES = {
  first_log: { 
    icon: Star, 
    name: "First Step", 
    description: "Logged your first health reading",
    color: "from-blue-400 to-blue-600",
    points: 10
  },
  streak_7: { 
    icon: Flame, 
    name: "Week Warrior", 
    description: "7-day logging streak",
    color: "from-orange-400 to-red-500",
    points: 50
  },
  streak_30: { 
    icon: Flame, 
    name: "Monthly Master", 
    description: "30-day logging streak",
    color: "from-red-500 to-pink-600",
    points: 200
  },
  target_hit_10: { 
    icon: Target, 
    name: "Sharpshooter", 
    description: "Hit your targets 10 times",
    color: "from-green-400 to-emerald-600",
    points: 75
  },
  target_hit_50: { 
    icon: Target, 
    name: "Target Master", 
    description: "Hit your targets 50 times",
    color: "from-emerald-500 to-teal-600",
    points: 250
  },
  logs_50: { 
    icon: Calendar, 
    name: "Consistent Logger", 
    description: "Logged 50 health entries",
    color: "from-violet-400 to-purple-600",
    points: 100
  },
  logs_200: { 
    icon: Calendar, 
    name: "Health Historian", 
    description: "Logged 200 health entries",
    color: "from-purple-500 to-indigo-600",
    points: 300
  },
  sugar_control: { 
    icon: TrendingUp, 
    name: "Sugar Controller", 
    description: "Maintained target sugar for 7 days",
    color: "from-cyan-400 to-blue-500",
    points: 150
  },
  early_bird: { 
    icon: Zap, 
    name: "Early Bird", 
    description: "Logged before 7 AM for 5 days",
    color: "from-yellow-400 to-orange-500",
    points: 40
  },
  complete_day: { 
    icon: CheckCircle, 
    name: "Perfect Day", 
    description: "Logged all 3 meals + sugar in one day",
    color: "from-pink-400 to-rose-500",
    points: 30
  },
  top_10: { 
    icon: Crown, 
    name: "Top 10", 
    description: "Reached top 10 on leaderboard",
    color: "from-amber-400 to-yellow-500",
    points: 100
  },
  challenger: { 
    icon: Shield, 
    name: "Challenger", 
    description: "Completed a weekly challenge",
    color: "from-indigo-400 to-violet-500",
    points: 75
  }
};

export default function BadgesGrid({ earnedBadges = [], showAll = false }) {
  const badgesToShow = showAll 
    ? Object.keys(BADGES) 
    : earnedBadges.length > 0 ? earnedBadges : [];

  if (badgesToShow.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Start logging to earn badges!</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
        {badgesToShow.map((badgeId) => {
          const badge = BADGES[badgeId];
          if (!badge) return null;
          
          const isEarned = earnedBadges.includes(badgeId);
          const Icon = badge.icon;

          return (
            <Tooltip key={badgeId}>
              <TooltipTrigger>
                <div className={cn(
                  "aspect-square rounded-xl flex items-center justify-center transition-all",
                  isEarned 
                    ? `bg-gradient-to-br ${badge.color} shadow-lg hover:scale-105` 
                    : "bg-slate-100 opacity-40"
                )}>
                  <Icon className={cn(
                    "w-6 h-6",
                    isEarned ? "text-white" : "text-slate-400"
                  )} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <p className="font-semibold">{badge.name}</p>
                <p className="text-xs text-slate-500">{badge.description}</p>
                <p className="text-xs text-amber-600 mt-1">+{badge.points} points</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

export { BADGES };