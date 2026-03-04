import { createClientFromRequest } from './_shared/server-client';

Deno.serve(async (req) => {
  try {
    const appClient = createClientFromRequest(req);
    
    const user = await appClient.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all user's health logs (active only)
    const allLogs = await appClient.asServiceRole.entities.HealthLog.list('-created_date', 1000);
    const logs = allLogs.filter(log => 
      (log.user_email === user.email || log.created_by === user.email) &&
      log.status !== 'corrected' && log.status !== 'deleted'
    );

    // Calculate stats
    const sugarLogs = logs.filter(l => l.log_type === 'sugar' && l.numeric_value);
    const totalLogs = logs.length;

    // Calculate streak (consecutive days with logs)
    const logDates = [...new Set(logs.map(l => 
      new Date(l.created_date).toISOString().split('T')[0]
    ))].sort().reverse();

    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (logDates.includes(today) || logDates.includes(yesterday)) {
      currentStreak = 1;
      let checkDate = logDates[0] === today ? today : yesterday;
      
      for (let i = 1; i < logDates.length; i++) {
        const prevDate = new Date(checkDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const expectedPrevDate = prevDate.toISOString().split('T')[0];
        
        if (logDates[i] === expectedPrevDate) {
          currentStreak++;
          checkDate = expectedPrevDate;
        } else {
          break;
        }
      }
    }

    // Calculate targets hit (sugar within range)
    const targetsHit = sugarLogs.filter(l => l.numeric_value <= 180 && l.numeric_value >= 70).length;

    // Calculate points (10 per log, 50 bonus per 7-day streak)
    const basePoints = totalLogs * 10;
    const streakBonus = Math.floor(currentStreak / 7) * 50;
    const targetBonus = targetsHit * 5;
    const totalPoints = basePoints + streakBonus + targetBonus;

    // Determine badges
    const badges = [];
    if (totalLogs >= 1) badges.push('first_log');
    if (totalLogs >= 7) badges.push('week_warrior');
    if (totalLogs >= 30) badges.push('month_master');
    if (currentStreak >= 3) badges.push('streak_starter');
    if (currentStreak >= 7) badges.push('week_streak');
    if (currentStreak >= 30) badges.push('month_streak');
    if (targetsHit >= 10) badges.push('target_achiever');
    if (sugarLogs.length >= 50) badges.push('sugar_tracker');

    // Update or create achievements
    const existingAchievements = await appClient.asServiceRole.entities.UserAchievements.list('-created_date', 100);
    const userAchievements = existingAchievements.find(a => 
      a.user_email === user.email || a.created_by === user.email
    );

    const achievementData = {
      user_email: user.email,
      total_points: totalPoints,
      current_streak: currentStreak,
      longest_streak: Math.max(currentStreak, userAchievements?.longest_streak || 0),
      logs_count: totalLogs,
      targets_hit_count: targetsHit,
      badges: badges,
      last_log_date: logs[0]?.created_date ? new Date(logs[0].created_date).toISOString().split('T')[0] : null
    };

    let result;
    if (userAchievements) {
      result = await appClient.asServiceRole.entities.UserAchievements.update(
        userAchievements.id, 
        achievementData
      );
    } else {
      result = await appClient.asServiceRole.entities.UserAchievements.create({
        ...achievementData,
        show_on_leaderboard: true,
        display_name: user.full_name?.split(' ')[0] || 'User'
      });
    }

    return Response.json({ 
      success: true, 
      data: result,
      stats: {
        totalLogs,
        currentStreak,
        targetsHit,
        totalPoints,
        badges
      }
    });
  } catch (error) {
    console.error('Sync achievements error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});