import { Trophy, Medal, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Leaderboard({ 
  users = [], 
  currentUserEmail, 
  showOnLeaderboard = true,
  onToggleVisibility 
}) {
  const getRankStyle = (rank) => {
    switch(rank) {
      case 1: return "bg-gradient-to-r from-amber-400 to-yellow-500 text-white";
      case 2: return "bg-gradient-to-r from-slate-300 to-slate-400 text-white";
      case 3: return "bg-gradient-to-r from-orange-400 to-amber-500 text-white";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const getRankIcon = (rank) => {
    if (rank <= 3) {
      return <Trophy className={cn("w-4 h-4", rank === 1 ? "text-amber-300" : "text-white/80")} />;
    }
    return <span className="text-sm font-bold">{rank}</span>;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Medal className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-slate-800">Community Progress</h3>
          </div>
          
          {onToggleVisibility && (
            <div className="flex items-center gap-2">
              <Switch 
                id="visibility" 
                checked={showOnLeaderboard}
                onCheckedChange={onToggleVisibility}
              />
              <Label htmlFor="visibility" className="text-xs text-slate-500 cursor-pointer">
                {showOnLeaderboard ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Label>
            </div>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-50">
        {users.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Trophy className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No rankings yet</p>
          </div>
        ) : (
          users.slice(0, 10).map((user, index) => {
            const rank = index + 1;
            const isCurrentUser = user.user_email === currentUserEmail;
            
            return (
              <div 
                key={user.id || index}
                className={cn(
                  "flex items-center gap-3 p-4 transition-colors",
                  isCurrentUser ? "bg-blue-50" : "hover:bg-slate-50"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  getRankStyle(rank)
                )}>
                  {getRankIcon(rank)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium truncate",
                    isCurrentUser ? "text-blue-700" : "text-slate-700"
                  )}>
                    {user.display_name || user.user_email?.split('@')[0] || 'Anonymous'}
                    {isCurrentUser && <span className="text-xs ml-2 text-blue-500">(You)</span>}
                  </p>
                  <p className="text-xs text-slate-400">
                    🔥 {user.current_streak || 0} day streak
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-slate-800">{(user.total_points || 0).toLocaleString()}</p>
                  <p className="text-xs text-slate-400">points</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}