import { createClientFromRequest } from './_shared/server-client';

// This function checks for reminders due and could be called by a scheduled task
// For WhatsApp, it prepares reminder messages that the agent can reference

Deno.serve(async (req) => {
  console.log('Scheduled voice reminders check');
  
  try {
    const appClient = createClientFromRequest(req);
    const user = await appClient.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all profiles with voice reminders enabled
    const profiles = await appClient.asServiceRole.entities.PatientProfile.filter({
      voice_reminders_enabled: true
    });

    console.log('Profiles with voice reminders:', profiles?.length || 0);
    
    const now = new Date();
    const currentHour = now.getHours();
    const results = [];

    for (const profile of profiles || []) {
      const reminders = [];
      
      // Morning medication reminder (8 AM)
      if (currentHour === 8 && profile.voice_medication_reminders) {
        reminders.push({ type: 'medication', time: 'morning' });
      }
      
      // Afternoon medication (2 PM)
      if (currentHour === 14 && profile.voice_medication_reminders) {
        reminders.push({ type: 'medication', time: 'afternoon' });
      }
      
      // Evening medication (8 PM)
      if (currentHour === 20 && profile.voice_medication_reminders) {
        reminders.push({ type: 'medication', time: 'evening' });
      }
      
      // Glucose check reminders
      if (currentHour === 7 && profile.voice_glucose_reminders) {
        reminders.push({ type: 'glucose', time: 'fasting' });
      }
      
      if (currentHour === 10 && profile.voice_glucose_reminders) {
        reminders.push({ type: 'glucose', time: 'post-breakfast' });
      }
      
      if (currentHour === 15 && profile.voice_glucose_reminders) {
        reminders.push({ type: 'glucose', time: 'post-lunch' });
      }

      if (reminders.length > 0) {
        results.push({
          user_email: profile.user_email,
          name: profile.name,
          language: profile.language_preference || 'english',
          reminders
        });
      }
    }

    console.log('Reminders to send:', results.length);

    return Response.json({
      success: true,
      checked_at: now.toISOString(),
      reminders_due: results
    });

  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});