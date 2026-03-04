import { createClient } from './_shared/server-client';

// Initialize appClient client with service role
function getServiceClient() {
  return createClient({
    appId: Deno.env.get("APP_APP_ID"),
    apiKey: Deno.env.get("APP_SERVICE_ROLE_KEY")
  });
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, ElevenLabs-Signature'
      }
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await req.json();
    console.log('ElevenLabs webhook received:', JSON.stringify(body, null, 2));

    // Extract conversation data - ElevenLabs sends user_id for WhatsApp number
    const { 
      conversation_id,
      agent_id,
      phone_number,
      user_id,
      transcript,
      messages,
      metadata,
      event_type,
      analysis
    } = body;

    // ElevenLabs sends WhatsApp number as user_id
    const whatsappNumber = user_id || phone_number;
    
    console.log('Event type:', event_type);
    console.log('User ID (WhatsApp):', user_id);
    console.log('Phone:', phone_number);

    const appClient = getServiceClient();

    // WhatsApp-first: Find or CREATE user by WhatsApp number
    let userEmail = null;
    let profile = null;
    
    if (whatsappNumber) {
      const cleanPhone = whatsappNumber.replace(/\D/g, '');
      console.log('Looking for phone:', cleanPhone);
      
      const profiles = await appClient.entities.PatientProfile.filter({});
      console.log('Found profiles:', profiles.length);
      
      profile = profiles.find(p => {
        const profilePhone = (p.whatsapp_number || '').replace(/\D/g, '');
        const match = profilePhone === cleanPhone || 
                      profilePhone.endsWith(cleanPhone.slice(-10)) ||
                      cleanPhone.endsWith(profilePhone.slice(-10));
        return match;
      });
      
      if (profile) {
        userEmail = profile.user_email;
        console.log('Matched existing user:', userEmail);
      } else {
        // WhatsApp-first: Auto-create profile for new users
        // WhatsApp number IS the identity
        userEmail = `wa_${cleanPhone}@whatsapp.glucovital.fit`;
        console.log('Creating new WhatsApp user:', userEmail);
        
        profile = await appClient.entities.PatientProfile.create({
          user_email: userEmail,
          name: `WhatsApp User ${cleanPhone.slice(-4)}`,
          whatsapp_number: cleanPhone,
          whatsapp_connected: true,
          whatsapp_reminders_enabled: true,
          language_preference: 'hinglish',
          timezone: 'Asia/Kolkata'
        });
        console.log('Created new profile:', profile.id);
      }
    }

    // Process based on event type or transcript content
    if (transcript || messages) {
      const conversationText = transcript || messages?.map(m => m.content).join(' ') || '';
      console.log('Conversation:', conversationText);

      // Parse health data from conversation
      const healthData = parseHealthData(conversationText);
      
      if (healthData.length > 0 && userEmail) {
        for (const data of healthData) {
          await appClient.entities.HealthLog.create({
            user_email: userEmail,
            log_type: data.type,
            value: data.value,
            numeric_value: data.numericValue,
            time_of_day: data.timeOfDay || 'other',
            source: 'whatsapp',
            status: 'active',
            notes: `Logged via ElevenLabs WhatsApp. Conversation: ${conversation_id}`
          });
          console.log('Created health log:', data);
        }
      }

      // Store conversation for analysis
      await appClient.entities.ConversationMemory.create({
        user_email: userEmail || 'unknown',
        memory_type: 'context',
        key: `elevenlabs_conversation_${conversation_id}`,
        value: conversationText.substring(0, 1000),
        metadata: {
          conversation_id,
          agent_id,
          phone_number,
          event_type
        },
        source: 'system'
      });
    }

    return Response.json({ 
      success: true, 
      user_matched: !!userEmail,
      conversation_id 
    });

  } catch (error) {
    console.error('ElevenLabs webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Parse health data from conversation text
function parseHealthData(text) {
  const results = [];
  const lowerText = text.toLowerCase();

  // Sugar/glucose patterns
  const sugarPatterns = [
    /(?:sugar|glucose|reading|level)[\s:]*(\d{2,3})/gi,
    /(\d{2,3})\s*(?:mg\/dl|mg|sugar|glucose)/gi,
    /(?:fasting|post\s*meal|before\s*meal|after\s*meal)[\s:]*(\d{2,3})/gi
  ];

  for (const pattern of sugarPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const value = parseInt(match[1]);
      if (value >= 40 && value <= 500) {
        let timeOfDay = 'other';
        if (lowerText.includes('fasting') || lowerText.includes('morning')) {
          timeOfDay = 'morning_fasting';
        } else if (lowerText.includes('after') || lowerText.includes('post')) {
          timeOfDay = 'after_breakfast';
        } else if (lowerText.includes('before')) {
          timeOfDay = 'before_breakfast';
        }

        results.push({
          type: 'sugar',
          value: `${value} mg/dL`,
          numericValue: value,
          timeOfDay
        });
        break; // One sugar reading per conversation
      }
    }
    if (results.some(r => r.type === 'sugar')) break;
  }

  // BP patterns
  const bpPattern = /(\d{2,3})\s*[\/\\]\s*(\d{2,3})/g;
  const bpMatches = text.matchAll(bpPattern);
  for (const match of bpMatches) {
    const systolic = parseInt(match[1]);
    const diastolic = parseInt(match[2]);
    if (systolic >= 70 && systolic <= 250 && diastolic >= 40 && diastolic <= 150) {
      results.push({
        type: 'blood_pressure',
        value: `${systolic}/${diastolic}`,
        numericValue: systolic,
        timeOfDay: 'other'
      });
      break;
    }
  }

  // Medication taken confirmation
  if (lowerText.includes('taken') || lowerText.includes('done') || lowerText.includes('le liya')) {
    const medPatterns = [
      /(?:taken|done|le liya)[\s:]*([a-zA-Z]+)/i,
      /([a-zA-Z]+)[\s]*(?:taken|done|le liya)/i
    ];
    
    for (const pattern of medPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        results.push({
          type: 'medication',
          value: match[1],
          numericValue: null,
          timeOfDay: 'other'
        });
        break;
      }
    }
  }

  return results;
}