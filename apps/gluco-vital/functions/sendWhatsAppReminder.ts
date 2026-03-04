import { createClientFromRequest } from './_shared/server-client';

// Send WhatsApp reminders to users via Meta Cloud API

Deno.serve(async (req) => {
  try {
    const appClient = createClientFromRequest(req);
    const user = await appClient.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const { 
      phone_number,
      reminder_type = 'general',
      medication_name,
      language = 'english',
      voice_audio_url
    } = body;
    
    if (!phone_number) {
      return Response.json({ error: 'Phone number required' }, { status: 400 });
    }
    
    const ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    
    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
      return Response.json({ error: 'WhatsApp not configured' }, { status: 500 });
    }
    
    const patientName = user.full_name?.split(' ')[0] || 'friend';
    const hour = new Date().getHours();
    
    // Build message based on type and language
    let message = '';
    
    if (language === 'hindi') {
      const greeting = hour < 12 ? 'सुप्रभात' : hour < 17 ? 'नमस्ते' : 'शुभ संध्या';
      
      if (reminder_type === 'medication') {
        message = `${greeting} ${patientName} जी! 💊\n\nआपकी ${medication_name || 'दवाई'} लेने का समय हो गया है।\n\nलेने के बाद "done" या "ले ली" भेजें।`;
      } else if (reminder_type === 'glucose') {
        message = `${greeting} ${patientName} जी! 🩸\n\nअपना शुगर लेवल चेक करने का समय है।\n\nरीडिंग भेजें जैसे: "sugar 120" या "120 fasting"`;
      } else if (reminder_type === 'appointment') {
        message = `${greeting} ${patientName} जी! 📅\n\nआपकी डॉक्टर की अपॉइंटमेंट आज है। कृपया समय पर पहुंचें।`;
      } else {
        message = `${greeting} ${patientName} जी! 💚\n\nयह आपका हेल्थ रिमाइंडर है।`;
      }
    } else if (language === 'hinglish') {
      const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Namaste' : 'Good evening';
      
      if (reminder_type === 'medication') {
        message = `${greeting} ${patientName} ji! 💊\n\nAapki ${medication_name || 'medicine'} lene ka time ho gaya hai.\n\nLene ke baad "done" ya "taken" bhejein.`;
      } else if (reminder_type === 'glucose') {
        message = `${greeting} ${patientName} ji! 🩸\n\nSugar check karne ka time hai.\n\nReading bhejein jaise: "sugar 120" ya "120 fasting"`;
      } else if (reminder_type === 'appointment') {
        message = `${greeting} ${patientName} ji! 📅\n\nAapki doctor appointment aaj hai. Please time pe pahunchein.`;
      } else {
        message = `${greeting} ${patientName} ji! 💚\n\nYeh aapka health reminder hai.`;
      }
    } else {
      // English
      const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      
      if (reminder_type === 'medication') {
        message = `${greeting} ${patientName}! 💊\n\nTime to take your ${medication_name || 'medication'}.\n\nReply "done" or "taken" once you've taken it.`;
      } else if (reminder_type === 'glucose') {
        message = `${greeting} ${patientName}! 🩸\n\nTime for your glucose check.\n\nSend your reading like: "sugar 120" or "120 fasting"`;
      } else if (reminder_type === 'appointment') {
        message = `${greeting} ${patientName}! 📅\n\nYou have a doctor's appointment today. Please arrive on time.`;
      } else {
        message = `${greeting} ${patientName}! 💚\n\nThis is your health reminder.`;
      }
    }
    
    // Add voice reminder link if available
    if (voice_audio_url) {
      message += language === 'hindi' 
        ? `\n\n🔊 वॉइस रिमाइंडर सुनें: ${voice_audio_url}`
        : `\n\n🔊 Listen to voice reminder: ${voice_audio_url}`;
    }
    
    // Send via Meta WhatsApp API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone_number,
          type: 'text',
          text: { body: message }
        })
      }
    );
    
    const result = await response.json();
    console.log('WhatsApp API response:', JSON.stringify(result, null, 2));
    console.log('Sent to phone:', phone_number);
    console.log('Using Phone ID:', PHONE_NUMBER_ID);
    
    if (result.error) {
      console.error('WhatsApp error:', result.error);
      return Response.json({ 
        error: result.error.message,
        error_code: result.error.code,
        error_details: result.error
      }, { status: 400 });
    }
    
    return Response.json({
      success: true,
      message_id: result.messages?.[0]?.id,
      message_sent: message,
      phone_sent_to: phone_number,
      wa_response: result
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});