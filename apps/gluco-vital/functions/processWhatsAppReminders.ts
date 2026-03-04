import { createClientFromRequest } from './_shared/server-client';

// Process and send WhatsApp reminders based on user schedules
// Called by scheduled task

Deno.serve(async (req) => {
  console.log('Processing WhatsApp reminders');
  
  try {
    const appClient = createClientFromRequest(req);
    const user = await appClient.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    
    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
      return Response.json({ error: 'WhatsApp not configured' }, { status: 500 });
    }

    // Get all profiles with WhatsApp reminders enabled
    const profiles = await appClient.asServiceRole.entities.PatientProfile.filter({
      whatsapp_reminders_enabled: true
    });

    console.log('Profiles with WhatsApp reminders:', profiles?.length || 0);
    
    const now = new Date();
    // Adjust to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const currentHour = istNow.getUTCHours();
    const currentMinute = istNow.getUTCMinutes();
    
    console.log(`Current IST time: ${currentHour}:${currentMinute}`);
    
    const results = [];
    const errors = [];

    for (const profile of profiles || []) {
      if (!profile.whatsapp_number) continue;
      
      const language = profile.language_preference || 'english';
      const patientName = profile.name?.split(' ')[0] || 'friend';
      
      // Get medication reminders for this user
      let medicationReminders = [];
      if (profile.whatsapp_medication_reminders) {
        try {
          medicationReminders = await appClient.asServiceRole.entities.MedicationReminder.filter({
            user_email: profile.user_email,
            is_active: true
          });
        } catch (e) {
          console.log('No medication reminders found');
        }
      }
      
      // Check each medication reminder
      for (const reminder of medicationReminders) {
        const shouldSend = checkReminderTime(reminder, currentHour, currentMinute);
        if (shouldSend) {
          const message = buildMedicationMessage(patientName, reminder.medication_name, language, currentHour);
          const result = await sendWhatsAppMessage(profile.whatsapp_number, message, ACCESS_TOKEN, PHONE_NUMBER_ID);
          results.push({
            type: 'medication',
            user: profile.user_email,
            medication: reminder.medication_name,
            success: !result.error
          });
        }
      }
      
      // Glucose reminders at specific times
      if (profile.whatsapp_glucose_reminders) {
        const glucoseTimes = [
          { hour: 7, type: 'fasting', label: 'fasting' },
          { hour: 10, type: 'post_breakfast', label: 'post-breakfast' },
          { hour: 15, type: 'post_lunch', label: 'post-lunch' },
          { hour: 21, type: 'bedtime', label: 'bedtime' }
        ];
        
        for (const gt of glucoseTimes) {
          if (currentHour === gt.hour && currentMinute < 5) {
            const message = buildGlucoseMessage(patientName, gt.label, language, currentHour);
            const result = await sendWhatsAppMessage(profile.whatsapp_number, message, ACCESS_TOKEN, PHONE_NUMBER_ID);
            results.push({
              type: 'glucose',
              user: profile.user_email,
              time: gt.label,
              success: !result.error
            });
          }
        }
      }
      
      // Appointment reminders
      if (profile.whatsapp_appointment_reminders) {
        try {
          const today = istNow.toISOString().split('T')[0];
          const appointments = await appClient.asServiceRole.entities.DoctorVisit.filter({
            user_email: profile.user_email,
            status: 'scheduled'
          });
          
          for (const apt of appointments || []) {
            const aptDate = apt.visit_date?.split('T')[0];
            // Send reminder at 8 AM on the day of appointment
            if (aptDate === today && currentHour === 8 && currentMinute < 5) {
              const message = buildAppointmentMessage(patientName, apt.doctor_name, language);
              const result = await sendWhatsAppMessage(profile.whatsapp_number, message, ACCESS_TOKEN, PHONE_NUMBER_ID);
              results.push({
                type: 'appointment',
                user: profile.user_email,
                doctor: apt.doctor_name,
                success: !result.error
              });
            }
          }
        } catch (e) {
          console.log('No appointments found');
        }
      }
    }

    console.log('Reminders sent:', results.length);

    return Response.json({
      success: true,
      processed_at: istNow.toISOString(),
      reminders_sent: results.length,
      results
    });

  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function checkReminderTime(reminder, currentHour, currentMinute) {
  if (!reminder.specific_times || reminder.specific_times.length === 0) {
    // Default medication times
    const defaultTimes = [8, 14, 20];
    return defaultTimes.includes(currentHour) && currentMinute < 5;
  }
  
  for (const time of reminder.specific_times) {
    const [hour, minute] = time.split(':').map(Number);
    if (hour === currentHour && Math.abs(minute - currentMinute) < 5) {
      return true;
    }
  }
  return false;
}

function buildMedicationMessage(name, medication, language, hour) {
  const greeting = hour < 12 ? 
    (language === 'hindi' ? 'सुप्रभात' : 'Good morning') :
    hour < 17 ? 
    (language === 'hindi' ? 'नमस्ते' : 'Good afternoon') :
    (language === 'hindi' ? 'शुभ संध्या' : 'Good evening');
  
  if (language === 'hindi') {
    return `${greeting} ${name} जी! 💊\n\nआपकी ${medication} लेने का समय हो गया है।\n\nलेने के बाद "done" या "ले ली" भेजें।`;
  } else if (language === 'hinglish') {
    return `${greeting} ${name} ji! 💊\n\nAapki ${medication} lene ka time ho gaya hai.\n\nLene ke baad "done" bhejein.`;
  }
  return `${greeting} ${name}! 💊\n\nTime to take your ${medication}.\n\nReply "done" once you've taken it.`;
}

function buildGlucoseMessage(name, timeLabel, language, hour) {
  const greeting = hour < 12 ? 
    (language === 'hindi' ? 'सुप्रभात' : 'Good morning') :
    hour < 17 ? 
    (language === 'hindi' ? 'नमस्ते' : 'Good afternoon') :
    (language === 'hindi' ? 'शुभ संध्या' : 'Good evening');
  
  if (language === 'hindi') {
    return `${greeting} ${name} जी! 🩸\n\nअपना ${timeLabel} शुगर चेक करने का समय है।\n\nरीडिंग भेजें: "120" या "sugar 120"`;
  } else if (language === 'hinglish') {
    return `${greeting} ${name} ji! 🩸\n\n${timeLabel} sugar check karne ka time hai.\n\nReading bhejein: "120" ya "sugar 120"`;
  }
  return `${greeting} ${name}! 🩸\n\nTime for your ${timeLabel} glucose check.\n\nSend your reading: "120" or "sugar 120"`;
}

function buildAppointmentMessage(name, doctorName, language) {
  if (language === 'hindi') {
    return `सुप्रभात ${name} जी! 📅\n\nआज ${doctorName || 'डॉक्टर'} से आपकी अपॉइंटमेंट है।\n\nकृपया समय पर पहुंचें और अपनी रिपोर्ट्स साथ लाएं।`;
  } else if (language === 'hinglish') {
    return `Good morning ${name} ji! 📅\n\nAaj ${doctorName || 'doctor'} se aapki appointment hai.\n\nPlease time pe pahunchein aur apni reports saath laayein.`;
  }
  return `Good morning ${name}! 📅\n\nYou have an appointment with ${doctorName || 'your doctor'} today.\n\nPlease arrive on time and bring your reports.`;
}

async function sendWhatsAppMessage(to, message, accessToken, phoneNumberId) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: message }
        })
      }
    );
    
    const result = await response.json();
    console.log(`Message to ${to}:`, result.messages?.[0]?.id || result.error?.message);
    return result;
  } catch (error) {
    console.error('Send error:', error.message);
    return { error: error.message };
  }
}