import { createClientFromRequest } from './_shared/server-client';
import { encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

Deno.serve(async (req) => {
  console.log('sendVoiceReminder function called');
  
  try {
    const appClient = createClientFromRequest(req);
    const user = await appClient.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('User:', user.email);

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      return Response.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
    }

    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      console.log('Using defaults');
    }
    
    const { 
      reminder_type = 'general',
      medication_name = 'medication',
      language = 'english'
    } = body;

    const patientName = user.full_name?.split(' ')[0] || 'friend';
    const hour = new Date().getHours();
    
    // Generate message based on language
    let message = '';
    
    if (language === 'hindi') {
      const greeting = hour < 12 ? 'सुप्रभात' : hour < 17 ? 'नमस्ते' : 'शुभ संध्या';
      if (reminder_type === 'medication') {
        message = `${greeting} ${patientName} जी! आपकी ${medication_name} दवाई लेने का समय हो गया है। कृपया अपनी दवाई लें।`;
      } else if (reminder_type === 'glucose') {
        message = `${greeting} ${patientName} जी! अपना शुगर लेवल चेक करने का समय हो गया है।`;
      } else if (reminder_type === 'appointment') {
        message = `${greeting} ${patientName} जी! आपकी डॉक्टर की अपॉइंटमेंट याद रखें।`;
      } else {
        message = `${greeting} ${patientName} जी! यह आपका हेल्थ रिमाइंडर है।`;
      }
    } else if (language === 'hinglish') {
      const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Namaste' : 'Good evening';
      if (reminder_type === 'medication') {
        message = `${greeting} ${patientName} ji! Aapki ${medication_name} medicine lene ka time ho gaya hai. Please apni dawai le lein.`;
      } else if (reminder_type === 'glucose') {
        message = `${greeting} ${patientName} ji! Sugar check karne ka time ho gaya hai.`;
      } else if (reminder_type === 'appointment') {
        message = `${greeting} ${patientName} ji! Doctor ki appointment yaad rakhein.`;
      } else {
        message = `${greeting} ${patientName} ji! Yeh aapka health reminder hai.`;
      }
    } else {
      // English
      const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      if (reminder_type === 'medication') {
        message = `${greeting} ${patientName}! It's time to take your ${medication_name}. Please take your medicine now.`;
      } else if (reminder_type === 'glucose') {
        message = `${greeting} ${patientName}! Time for your glucose check.`;
      } else if (reminder_type === 'appointment') {
        message = `${greeting} ${patientName}! Don't forget your doctor's appointment.`;
      } else {
        message = `${greeting} ${patientName}! This is your health reminder.`;
      }
    }

    console.log('Language:', language, 'Message:', message);
    
    // Use multilingual model for Hindi, monolingual for English
    const modelId = (language === 'hindi' || language === 'hinglish') 
      ? 'eleven_multilingual_v2' 
      : 'eleven_monolingual_v1';
    
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: message,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    console.log('ElevenLabs status:', ttsResponse.status);

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      console.error('ElevenLabs error:', errText);
      return Response.json({ error: 'ElevenLabs failed', details: errText }, { status: 500 });
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const base64Audio = base64Encode(new Uint8Array(audioBuffer));

    return Response.json({
      success: true,
      audio_base64: base64Audio,
      message: message,
      language: language
    });

  } catch (error) {
    console.error('Error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});