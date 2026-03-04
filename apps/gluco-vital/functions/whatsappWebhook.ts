import { createClient } from './_shared/server-client';

// Meta WhatsApp Webhook Handler
// Routes text messages through appClient AI
// Handles verification and incoming messages

// Initialize appClient client with service role for webhook operations
function getApp() {
  return createClient({
    appId: Deno.env.get('APP_APP_ID'),
    apiKey: Deno.env.get('APP_API_KEY')
  }).asServiceRole;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  
  // GET request = webhook verification from Meta
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    
    const VERIFY_TOKEN = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified');
      return new Response(challenge, { status: 200 });
    } else {
      console.log('Webhook verification failed');
      return new Response('Forbidden', { status: 403 });
    }
  }
  
  // POST request = incoming message or status update
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('Webhook received:', JSON.stringify(body, null, 2));
      
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      
      if (!value) {
        return Response.json({ status: 'no_value' });
      }
      
      // Handle incoming messages
      const messages = value.messages;
      if (messages && messages.length > 0) {
        const message = messages[0];
        const from = message.from; // User's WhatsApp number
        const messageBody = message.text?.body || '';
        const messageType = message.type;
        const imageId = message.image?.id;
        const imageCaption = message.image?.caption || '';
        
        console.log(`Message from ${from}: ${messageBody} (type: ${messageType})`);
        
        // Process the message (with image support)
        await processIncomingMessage(from, messageBody, messageType, imageId, imageCaption);
      }
      
      // Handle status updates (delivered, read, etc.)
      const statuses = value.statuses;
      if (statuses && statuses.length > 0) {
        console.log('Status update:', statuses[0].status);
      }
      
      return Response.json({ status: 'received' });
      
    } catch (error) {
      console.error('Webhook error:', error.message, error.stack);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }
  
  return new Response('Method not allowed', { status: 405 });
});

async function processIncomingMessage(phoneNumber, messageBody, messageType, imageId = null, imageCaption = '') {
  const appClient = getApp();
  
  try {
    // Find or create user by WhatsApp number (WhatsApp-first approach)
    let profiles = await appClient.entities.PatientProfile.filter({});
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    let profile = profiles.find(p => {
      const profilePhone = (p.whatsapp_number || '').replace(/\D/g, '');
      return profilePhone === cleanPhone || 
             profilePhone.endsWith(cleanPhone.slice(-10)) ||
             cleanPhone.endsWith(profilePhone.slice(-10));
    });
    
    // WhatsApp-first: Auto-create profile for new users
    if (!profile) {
      const userEmail = `wa_${cleanPhone}@whatsapp.glucovital.fit`;
      profile = await appClient.entities.PatientProfile.create({
        user_email: userEmail,
        name: `WhatsApp User`,
        whatsapp_number: cleanPhone,
        whatsapp_connected: true,
        whatsapp_reminders_enabled: true,
        language_preference: 'hinglish',
        timezone: 'Asia/Kolkata'
      });
      console.log('Created new WhatsApp profile:', profile.id);
      
      // Send welcome via agent
      const welcomeResponse = await routeToAgent(profile.user_email, "hi");
      await sendWhatsAppMessage(phoneNumber, welcomeResponse);
      return;
    }
    
    const userEmail = profile.user_email;
    const language = profile.language_preference || 'english';
    
    // Handle IMAGE messages (prescription, lab reports)
    if (messageType === 'image' && imageId) {
      console.log('Processing image message:', imageId);
      await processImageMessage(phoneNumber, userEmail, imageId, imageCaption, language);
      return;
    }
    
    // Route ALL text messages through AI agent
    console.log('Processing message with AI agent:', messageBody);
    const aiResponse = await routeToAgent(userEmail, messageBody);
    await sendWhatsAppMessage(phoneNumber, aiResponse);
    
  } catch (error) {
    console.error('Process message error:', error.message, error.stack);
    // Fallback response if AI fails
    await sendWhatsAppMessage(phoneNumber, 
      "Sorry, I'm having trouble right now. You can still log:\n• Sugar: \"sugar 120\"\n• BP: \"130/85\"\n• Medication: \"taken\""
    );
  }
}

async function routeToAgent(userEmail, message) {
  const appClient = getApp();
  
  try {
    // Get user profile for context
    const profiles = await appClient.entities.PatientProfile.filter({ user_email: userEmail });
    const profile = profiles[0] || {};
    
    // Get recent health logs for context
    let recentLogs = [];
    try {
      recentLogs = await appClient.entities.HealthLog.filter({ user_email: userEmail });
      recentLogs = recentLogs.slice(0, 5);
    } catch (e) {
      console.log('Could not fetch recent logs:', e.message);
    }
    
    // Get upcoming doctor visits
    let upcomingVisit = null;
    try {
      const visits = await appClient.entities.DoctorVisit.filter({ user_email: userEmail, status: 'scheduled' });
      if (visits.length > 0) {
        upcomingVisit = visits[0];
      }
    } catch (e) {
      console.log('Could not fetch visits:', e.message);
    }
    
    const contextSummary = recentLogs.length > 0 
      ? recentLogs.map(l => `${l.log_type}: ${l.value} (${l.time_of_day || 'unknown time'})`).join('\n')
      : 'No recent logs';
    
    const language = profile.language_preference || 'english';
    const userName = profile.name || 'User';
    
    // Use direct LLM call
    const response = await appClient.integrations.Core.InvokeLLM({
      prompt: `You are Asha from GlucoVital, a warm and friendly diabetes health companion on WhatsApp.

USER INFO:
- Name: ${userName}
- Email: ${userEmail}
- Language: ${language} (respond in this language, use Hinglish if hinglish)
${upcomingVisit ? `- Upcoming doctor visit: ${upcomingVisit.visit_date}` : ''}

RECENT HEALTH DATA:
${contextSummary}

YOUR CAPABILITIES:
1. LOG HEALTH DATA - If user mentions sugar/glucose numbers, BP readings, or medication taken, acknowledge and confirm
2. ANSWER QUESTIONS - About diabetes management, their data patterns, general health info
3. PROVIDE SUPPORT - Be warm, encouraging, non-judgmental like a caring friend
4. COLLECT DOCTOR QUESTIONS - Proactively ask if user has questions for their doctor

DOCTOR QUESTIONS COLLECTION (IMPORTANT):
- After logging a few readings, ask: "Any questions you want me to save for your doctor?"
- If user asks "why is this happening?" or expresses confusion, offer to save the question for their doctor
- When user shares a question, respond: "Good question - I'll save that for your doctor visit."
- DO NOT try to answer medical questions yourself - save them for the doctor

RESPONSE FORMAT:
- Keep responses SHORT (2-4 sentences max for WhatsApp)
- Use simple language
- No markdown formatting (no *, #, **, etc.)
- Add relevant emoji sparingly
- Be conversational and warm

IF USER SHARES A READING:
- Acknowledge it warmly
- Note if it's high (>180 mg/dL) or low (<70 mg/dL) with gentle guidance
- Celebrate if it's in range (70-140 fasting, 70-180 post-meal)

User message: "${message}"

Respond naturally as Asha:`
    });
    
    // Also try to extract and log any health data
    await tryExtractAndLogHealthData(userEmail, message);
    
    // Try to extract and save doctor questions
    await tryExtractDoctorQuestion(userEmail, message);
    
    return response || "Hi! I'm Asha, your health buddy. How can I help you today? 💚";
    
  } catch (error) {
    console.error('AI routing error:', error.message, error.stack);
    return "Hi! I'm here to help with your health tracking. You can tell me your sugar reading, BP, or just say hi! 💚";
  }
}

// Try to extract doctor questions from message
async function tryExtractDoctorQuestion(userEmail, message) {
  const appClient = getApp();
  try {
    const lowerMsg = message.toLowerCase();
    
    // Patterns that indicate a question for doctor
    const questionPatterns = [
      /why (is|are|do|does|am|was)/i,
      /should i/i,
      /can i/i,
      /is it (normal|okay|ok|safe)/i,
      /what (should|can|is)/i,
      /doctor.*question/i,
      /ask.*doctor/i,
      /save.*question/i,
      /\?$/  // Ends with question mark
    ];
    
    const isQuestion = questionPatterns.some(pattern => pattern.test(message));
    
    // Check if it's a health-related question (not just casual chat)
    const healthTerms = ['sugar', 'glucose', 'insulin', 'medication', 'medicine', 'tablet', 'dose', 'bp', 'pressure', 'tired', 'fatigue', 'eat', 'food', 'diet', 'exercise', 'walk', 'morning', 'fasting', 'meal', 'diabetes', 'reading'];
    const hasHealthTerm = healthTerms.some(term => lowerMsg.includes(term));
    
    if (isQuestion && hasHealthTerm && message.length > 15) {
      await appClient.entities.DoctorQuestion.create({
        user_email: userEmail,
        question: message,
        source: 'whatsapp',
        status: 'unanswered'
      });
      console.log('Saved doctor question:', message);
    }
  } catch (error) {
    console.error('Error saving doctor question:', error.message);
  }
}

// Try to extract health data from message and log it
async function tryExtractAndLogHealthData(userEmail, message) {
  const appClient = getApp();
  try {
    const lowerMsg = message.toLowerCase();
    
    // Sugar/glucose patterns
    const sugarMatch = message.match(/(\d{2,3})\s*(mg|sugar|glucose|fasting|pp|post|random)?/i);
    if (sugarMatch && parseInt(sugarMatch[1]) >= 50 && parseInt(sugarMatch[1]) <= 500) {
      const value = parseInt(sugarMatch[1]);
      const isFasting = lowerMsg.includes('fasting') || lowerMsg.includes('morning') || lowerMsg.includes('empty');
      const isPostMeal = lowerMsg.includes('pp') || lowerMsg.includes('post') || lowerMsg.includes('after');
      
      await appClient.entities.HealthLog.create({
        user_email: userEmail,
        log_type: 'sugar',
        value: `${value} mg/dL`,
        numeric_value: value,
        time_of_day: isFasting ? 'morning_fasting' : (isPostMeal ? 'after_breakfast' : 'other'),
        source: 'whatsapp',
        status: 'active',
        measured_at: new Date().toISOString()
      });
      console.log('Logged sugar reading:', value);
    }
    
    // BP patterns (e.g., 130/85, 120/80)
    const bpMatch = message.match(/(\d{2,3})\s*[\/\\]\s*(\d{2,3})/);
    if (bpMatch) {
      const systolic = parseInt(bpMatch[1]);
      const diastolic = parseInt(bpMatch[2]);
      if (systolic >= 80 && systolic <= 200 && diastolic >= 40 && diastolic <= 130) {
        await appClient.entities.HealthLog.create({
          user_email: userEmail,
          log_type: 'blood_pressure',
          value: `${systolic}/${diastolic} mmHg`,
          numeric_value: systolic,
          source: 'whatsapp',
          status: 'active',
          measured_at: new Date().toISOString()
        });
        console.log('Logged BP reading:', systolic, diastolic);
      }
    }
    
    // Medication taken patterns
    if (lowerMsg.includes('taken') || lowerMsg.includes('done') || lowerMsg.includes('had') || lowerMsg.includes('le liya') || lowerMsg.includes('kha liya')) {
      await appClient.entities.HealthLog.create({
        user_email: userEmail,
        log_type: 'medication',
        value: 'Medication taken',
        source: 'whatsapp',
        status: 'active',
        measured_at: new Date().toISOString()
      });
      console.log('Logged medication taken');
    }
    
  } catch (error) {
    console.error('Error extracting health data:', error.message);
  }
}

// Process image messages (prescriptions, lab reports)
async function processImageMessage(phoneNumber, userEmail, imageId, caption, language) {
  const appClient = getApp();
  const ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  
  try {
    // Step 1: Get media URL from WhatsApp
    console.log('Fetching media URL for:', imageId);
    const mediaRes = await fetch(`https://graph.facebook.com/v18.0/${imageId}`, {
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });
    const mediaData = await mediaRes.json();
    console.log('Media data:', JSON.stringify(mediaData));
    
    if (!mediaData.url) {
      await sendWhatsAppMessage(phoneNumber, '❌ Could not process image. Please try again.');
      return;
    }
    
    // Step 2: Download the image
    const imageRes = await fetch(mediaData.url, {
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });
    const imageBuffer = await imageRes.arrayBuffer();
    const mimeType = mediaData.mime_type || 'image/jpeg';
    
    // Step 3: Upload to appClient storage
    const blob = new Blob([imageBuffer], { type: mimeType });
    const file = new File([blob], `prescription_${Date.now()}.jpg`, { type: mimeType });
    const { file_url } = await appClient.integrations.Core.UploadFile({ file });
    console.log('Uploaded to:', file_url);
    
    // Notify user processing started
    await sendWhatsAppMessage(phoneNumber, 
      language === 'hindi' 
        ? '📸 तस्वीर मिल गई! प्रिस्क्रिप्शन पढ़ रहे हैं... कृपया रुकें।'
        : '📸 Got it! Reading your prescription... Please wait.'
    );
    
    // Step 4: Extract data using AI Vision
    const extractionResult = await appClient.integrations.Core.InvokeLLM({
      prompt: `Analyze this medical prescription/document image carefully. Extract ALL information you can find.

If it's a PRESCRIPTION, extract:
- Doctor's name, clinic, phone, registration number
- Patient name (if visible)
- All medications with: name, dosage, frequency, timing, duration
- Diagnosis if mentioned
- Date of prescription
- Any special instructions

If it's a LAB REPORT, extract:
- Test names and values
- Reference ranges
- Date of test
- Lab name

Be very accurate with medication names and dosages. If something is unclear, mention it.
Respond in a structured way.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          document_type: { type: "string", enum: ["prescription", "lab_report", "other", "unclear"] },
          doctor_name: { type: "string" },
          doctor_phone: { type: "string" },
          doctor_registration_no: { type: "string" },
          clinic_name: { type: "string" },
          clinic_address: { type: "string" },
          patient_name: { type: "string" },
          diagnosis: { type: "string" },
          prescription_date: { type: "string" },
          medications: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                dosage: { type: "string" },
                frequency: { type: "string" },
                timing: { type: "string" },
                duration: { type: "string" },
                notes: { type: "string" }
              }
            }
          },
          lab_results: {
            type: "array",
            items: {
              type: "object",
              properties: {
                test_name: { type: "string" },
                value: { type: "string" },
                unit: { type: "string" },
                reference_range: { type: "string" },
                status: { type: "string" }
              }
            }
          },
          special_instructions: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          notes: { type: "string" }
        }
      }
    });
    
    console.log('Extraction result:', JSON.stringify(extractionResult));
    
    // Step 5: Save extracted data
    if (extractionResult.document_type === 'prescription') {
      // Update patient profile with doctor & prescription info
      const updateData = {
        prescription_image_url: file_url,
        prescription_date: extractionResult.prescription_date || new Date().toISOString().split('T')[0]
      };
      
      if (extractionResult.doctor_name) updateData.doctor_name = extractionResult.doctor_name;
      if (extractionResult.doctor_phone) updateData.doctor_phone = extractionResult.doctor_phone;
      if (extractionResult.doctor_registration_no) updateData.doctor_registration_no = extractionResult.doctor_registration_no;
      if (extractionResult.clinic_name) updateData.prescription_clinic = extractionResult.clinic_name;
      if (extractionResult.clinic_address) updateData.prescription_clinic_address = extractionResult.clinic_address;
      if (extractionResult.diagnosis) updateData.prescription_diagnosis = extractionResult.diagnosis;
      if (extractionResult.medications?.length > 0) updateData.prescription_extracted_meds = extractionResult.medications;
      if (extractionResult.special_instructions) updateData.prescription_notes = extractionResult.special_instructions;
      
      // Find and update profile
      const profiles = await appClient.entities.PatientProfile.filter({ user_email: userEmail });
      if (profiles.length > 0) {
        await appClient.entities.PatientProfile.update(profiles[0].id, updateData);
      }
      
      // Create medication reminders
      if (extractionResult.medications?.length > 0) {
        for (const med of extractionResult.medications) {
          await appClient.entities.MedicationReminder.create({
            user_email: userEmail,
            medication_name: med.name,
            dosage: med.dosage || '',
            frequency: mapFrequency(med.frequency),
            timing_type: mapTiming(med.timing),
            notes: `${med.timing || ''} ${med.notes || ''} (From prescription)`.trim(),
            is_active: true
          });
        }
      }
      
      // Send confirmation with extracted info
      let response = language === 'hindi'
        ? `✅ प्रिस्क्रिप्शन सेव हो गया!\n\n`
        : `✅ Prescription saved!\n\n`;
      
      if (extractionResult.doctor_name) {
        response += `👨‍⚕️ Dr. ${extractionResult.doctor_name}\n`;
      }
      if (extractionResult.clinic_name) {
        response += `🏥 ${extractionResult.clinic_name}\n`;
      }
      
      if (extractionResult.medications?.length > 0) {
        response += language === 'hindi' ? `\n💊 दवाइयां:\n` : `\n💊 Medications:\n`;
        extractionResult.medications.forEach((med, i) => {
          response += `${i+1}. ${med.name}`;
          if (med.dosage) response += ` - ${med.dosage}`;
          if (med.frequency) response += ` (${med.frequency})`;
          response += '\n';
        });
        response += language === 'hindi' 
          ? `\n⏰ रिमाइंडर सेट हो गए!`
          : `\n⏰ Reminders have been set!`;
      }
      
      if (extractionResult.confidence === 'low') {
        response += language === 'hindi'
          ? `\n\n⚠️ कुछ जानकारी साफ नहीं दिखी। कृपया ऐप में जाकर चेक करें।`
          : `\n\n⚠️ Some info was unclear. Please verify in the app.`;
      }
      
      await sendWhatsAppMessage(phoneNumber, response);
      
    } else if (extractionResult.document_type === 'lab_report') {
      // Save lab results
      if (extractionResult.lab_results?.length > 0) {
        for (const result of extractionResult.lab_results) {
          await appClient.entities.LabResult.create({
            user_email: userEmail,
            test_type: mapTestType(result.test_name),
            test_name: result.test_name,
            value: parseFloat(result.value) || null,
            value_text: result.value,
            unit: result.unit || '',
            reference_range_text: result.reference_range || '',
            status: result.status || 'unknown',
            test_date: new Date().toISOString().split('T')[0],
            source: 'extracted'
          });
        }
      }
      
      let response = language === 'hindi'
        ? `✅ लैब रिपोर्ट सेव हो गई!\n\n📋 टेस्ट:\n`
        : `✅ Lab report saved!\n\n📋 Results:\n`;
      
      extractionResult.lab_results?.forEach((r, i) => {
        response += `${i+1}. ${r.test_name}: ${r.value} ${r.unit || ''}\n`;
      });
      
      await sendWhatsAppMessage(phoneNumber, response);
      
    } else {
      await sendWhatsAppMessage(phoneNumber, 
        language === 'hindi'
          ? `📸 तस्वीर मिली लेकिन यह प्रिस्क्रिप्शन नहीं लग रही। कृपया साफ फोटो भेजें।`
          : `📸 Got the image but couldn't identify it as a prescription. Please send a clearer photo.`
      );
    }
    
  } catch (error) {
    console.error('Image processing error:', error);
    await sendWhatsAppMessage(phoneNumber, 
      language === 'hindi'
        ? `❌ तस्वीर पढ़ने में दिक्कत हुई। कृपया दोबारा भेजें।`
        : `❌ Error reading image. Please try again.`
    );
  }
}

// Helper: Map frequency string to enum
function mapFrequency(freq) {
  if (!freq) return 'once_daily';
  const lower = freq.toLowerCase();
  if (lower.includes('twice') || lower.includes('bd') || lower.includes('2')) return 'twice_daily';
  if (lower.includes('thrice') || lower.includes('tds') || lower.includes('3')) return 'thrice_daily';
  if (lower.includes('four') || lower.includes('qid') || lower.includes('4')) return 'four_times';
  if (lower.includes('week')) return 'weekly';
  if (lower.includes('need') || lower.includes('sos')) return 'as_needed';
  return 'once_daily';
}

// Helper: Map timing to enum
function mapTiming(timing) {
  if (!timing) return 'specific_time';
  const lower = timing.toLowerCase();
  if (lower.includes('before') && lower.includes('meal')) return 'before_meal';
  if (lower.includes('after') && lower.includes('meal')) return 'after_meal';
  if (lower.includes('with') && lower.includes('meal')) return 'with_meal';
  if (lower.includes('bed') || lower.includes('night')) return 'bedtime';
  if (lower.includes('morning') || lower.includes('wake')) return 'wakeup';
  return 'specific_time';
}

// Helper: Map test name to enum
function mapTestType(testName) {
  if (!testName) return 'other';
  const lower = testName.toLowerCase();
  if (lower.includes('hba1c') || lower.includes('a1c')) return 'hba1c';
  if (lower.includes('fasting') && lower.includes('glucose')) return 'fasting_glucose';
  if (lower.includes('cholesterol')) return 'total_cholesterol';
  if (lower.includes('ldl')) return 'ldl';
  if (lower.includes('hdl')) return 'hdl';
  if (lower.includes('triglyceride')) return 'triglycerides';
  if (lower.includes('creatinine')) return 'creatinine';
  if (lower.includes('hemoglobin') && !lower.includes('a1c')) return 'hemoglobin';
  if (lower.includes('tsh')) return 'tsh';
  if (lower.includes('vitamin d')) return 'vitamin_d';
  if (lower.includes('b12')) return 'vitamin_b12';
  return 'other';
}

async function sendWhatsAppMessage(to, message) {
  const ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  
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
        to: to,
        type: 'text',
        text: { body: message }
      })
    }
  );
  
  const result = await response.json();
  console.log('Send message result:', result);
  return result;
}