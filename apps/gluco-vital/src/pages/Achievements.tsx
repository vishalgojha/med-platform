import React, { useState, useEffect } from "react";
import { appClient } from "@/api/appClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Award, Flame, Target, Calendar, TrendingUp, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PointsDisplay from "@/components/gamification/PointsDisplay";
import BadgesGrid, { BADGES } from "@/components/gamification/BadgesGrid";
import WeeklyChallenge from "@/components/gamification/WeeklyChallenge";
import Leaderboard from "@/components/gamification/Leaderboard";
import { toast } from "sonner";
import { generateDemoData } from "@/components/demo/DemoDataGenerator";
import DemoBanner from "@/components/demo/DemoBanner";

export default function Achievements() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [demoData, setDemoData] = useState(null);

  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const demoMode = urlParams.get('demo') === 'true';
    
    if (demoMode) {
      setIsDemo(true);
      const data = generateDemoData();
      setDemoData(data);
      setUser(data.user);
    } else {
      setIsDemo(false);
      setDemoData(null);
      appClient.auth.me().then(setUser).catch(() => {});
    }
  }, [window.location.search]);

  const syncAchievements = async () => {
    setSyncing(true);
    try {
      await appClient.functions.invoke('syncAchievements', {});
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      toast.success("Achievements synced!");
    } catch (error) {
      toast.error("Failed to sync");
    } finally {
      setSyncing(false);
    }
  };

  const { data: achievements, isLoading } = useQuery({
    queryKey: ['user-achievements', user?.email, isDemo],
    queryFn: async () => {
      if (isDemo && demoData) {
        return demoData.achievements;
      }
      // Try to find existing achievements (check both user_email and created_by)
      const allAchievements = await appClient.entities.UserAchievements.list('-created_date', 100);
      let results = allAchievements.filter(a => 
        a.user_email === user?.email || a.created_by === user?.email
      );
      
      // If no achievements exist, create initial record
      if (!results || results.length === 0) {
        const newAchievements = await appClient.entities.UserAchievements.create({
          user_email: user.email,
          total_points: 0,
          current_streak: 0,
          longest_streak: 0,
          badges: [],
          logs_count: 0,
          targets_hit_count: 0,
          weekly_challenge_progress: 0,
          show_on_leaderboard: true,
          display_name: user.full_name?.split(' ')[0] || 'User'
        });
        return newAchievements;
      }
      return results[0];
    },
    enabled: !!user?.email || isDemo
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['leaderboard', isDemo],
    queryFn: async () => {
      if (isDemo && demoData) {
        // Return demo user as sole leaderboard entry for demo
        return [demoData.achievements];
      }
      const all = await appClient.entities.UserAchievements.filter(
        { show_on_leaderboard: true },
        '-total_points',
        20
      );
      return all;
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (achievements?.id) {
        return appClient.entities.UserAchievements.update(achievements.id, data);
      } else {
        return appClient.entities.UserAchievements.create({ 
          user_email: user.email, 
          ...data 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      toast.success("Settings saved!");
    }
  });

  const handleToggleVisibility = (checked) => {
    updateMutation.mutate({ show_on_leaderboard: checked });
  };

  const handleSaveDisplayName = () => {
    if (displayName.trim()) {
      updateMutation.mutate({ display_name: displayName.trim() });
    }
  };

  useEffect(() => {
    if (achievements?.display_name) {
      setDisplayName(achievements.display_name);
    } else if (user?.full_name) {
      setDisplayName(user.full_name.split(' ')[0]);
    }
  }, [achievements, user]);

  const userRank = leaderboard.findIndex(u => u.user_email === user?.email) + 1;

  const stats = [
    { 
      icon: Calendar, 
      label: "Total Logs", 
      value: achievements?.logs_count || 0,
      color: "text-violet-600 bg-violet-50"
    },
    { 
      icon: Flame, 
      label: "Longest Streak", 
      value: achievements?.longest_streak || 0,
      color: "text-orange-600 bg-orange-50"
    },
    { 
      icon: Target, 
      label: "Targets Hit", 
      value: achievements?.targets_hit_count || 0,
      color: "text-green-600 bg-green-50"
    },
    { 
      icon: Award, 
      label: "Badges Earned", 
      value: achievements?.badges?.length || 0,
      color: "text-amber-600 bg-amber-50"
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50">
      {isDemo && <DemoBanner />}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Achievements</h1>
            <p className="text-slate-500 mt-1">Track your progress and earn rewards!</p>
          </div>
          {!isDemo && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={syncAchievements}
              disabled={syncing}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Points & Streak Display */}
          <PointsDisplay 
            points={achievements?.total_points || 0}
            streak={achievements?.current_streak || 0}
            rank={userRank > 0 ? userRank : null}
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl p-4 border border-slate-100">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Weekly Challenge */}
            <WeeklyChallenge 
              progress={achievements?.weekly_challenge_progress || 0}
              challengeIndex={new Date().getWeek?.() || 0}
            />

            {/* Display Name Settings */}
            <Card className="border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Community Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Display Name</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your nickname"
                    />
                    <Button onClick={handleSaveDisplayName} variant="outline">
                      Save
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Badges */}
          <Card className="border-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Your Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BadgesGrid 
                earnedBadges={achievements?.badges || []} 
                showAll={true}
              />
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Leaderboard 
            users={leaderboard}
            currentUserEmail={user?.email}
            showOnLeaderboard={achievements?.show_on_leaderboard ?? true}
            onToggleVisibility={handleToggleVisibility}
          />
        </div>
      </div>
    </div>
  );
}