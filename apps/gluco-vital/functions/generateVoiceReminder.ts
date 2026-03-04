import { createClientFromRequest } from './_shared/server-client';

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

Deno.serve(async (req) => {
  try {
    const appClient = createClientFromRequest(req);
    const user = await appClient.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reminder_type, message, language = 'english', patient_name } = await req.json();

    if (!reminder_type || !message) {
      return Response.json({ error: 'reminder_type and message are required' }, { status: 400 });
    }

    // Voice ID mapping for different languages/accents
    const voiceMap = {
      english: 'EXAVITQu4vr4xnSDxMaL', // Sarah - warm, friendly
      hindi: 'pFZP5JQG7iQjIQuC4Bku', // Lily - can handle Hindi
      hinglish: 'pFZP5JQG7iQjIQuC4Bku',
      default: 'EXAVITQu4vr4xnSDxMaL'
    };

    const voiceId = voiceMap[language.toLowerCase()] || voiceMap.default;

    // Generate personalized message based on reminder type
    let fullMessage = message;
    if (patient_name) {
      fullMessage = `Hello ${patient_name}. ${message}`;
    }

    // Call ElevenLabs API to generate speech
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: fullMessage,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      return Response.json({ error: 'Failed to generate voice', details: errorText }, { status: 500 });
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    
    // Upload the audio file to storage
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const fileName = `voice_reminder_${Date.now()}.mp3`;
    
    // Create a File object for upload
    const file = new File([audioBlob], fileName, { type: 'audio/mpeg' });
    
    // Upload to appClient storage
    const uploadResult = await appClient.integrations.Core.UploadFile({ file });

    return Response.json({
      success: true,
      audio_url: uploadResult.file_url,
      message: fullMessage,
      reminder_type,
      language
    });

  } catch (error) {
    console.error('Voice reminder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});