import { createClientFromRequest } from './_shared/server-client';

Deno.serve(async (req) => {
  try {
    const appClient = createClientFromRequest(req);
    const user = await appClient.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { patient_email, patient_name, message } = await req.json();

    if (!patient_email) {
      return Response.json({ error: 'Patient email is required' }, { status: 400 });
    }

    // Check if connection already exists
    const existingConnections = await appClient.asServiceRole.entities.DoctorConnection.filter({
      doctor_email: user.email,
      patient_email: patient_email
    });
    console.log('Existing connections:', existingConnections);

    if (existingConnections && existingConnections.length > 0) {
      const existing = existingConnections[0];
      console.log('Found existing connection with status:', existing.status);
      if (existing.status === 'active') {
        return Response.json({ error: 'You are already connected to this patient' }, { status: 400 });
      }
      if (existing.status === 'pending') {
        return Response.json({ error: 'An invitation is already pending for this patient' }, { status: 400 });
      }
      // If status is revoked or expired, allow re-invite by updating the existing connection
      if (existing.status === 'revoked' || existing.status === 'expired') {
        const updated = await appClient.asServiceRole.entities.DoctorConnection.update(existing.id, {
          status: 'pending',
          patient_name: patient_name || existing.patient_name,
          invited_at: new Date().toISOString()
        });
        return Response.json({ 
          success: true, 
          connection: updated,
          message: 'Re-invitation sent',
          emailSent: true
        });
      }
    }

    // Create a pending connection (doctor-initiated)
    const connection = await appClient.asServiceRole.entities.DoctorConnection.create({
      patient_email: patient_email,
      patient_name: patient_name || patient_email,
      doctor_email: user.email,
      doctor_name: user.full_name,
      status: 'pending',
      permissions: ['view_logs', 'view_reports', 'view_insights'],
      invited_at: new Date().toISOString()
    });

    // Send invitation email
    const displayName = patient_name || 'there';
    const doctorName = user.full_name || 'Your Doctor';
    
    const emailBody = `
Dear ${displayName},

Dr. ${doctorName} would like to connect with you on Gluco Vital for better diabetes care management.

${message ? `Personal message: "${message}"\n` : ''}
HOW TO ACCEPT:

Step 1: Visit https://glucovital.fit
Step 2: Sign up or log in with this email address
Step 3: Navigate to Profile > Connections
Step 4: Accept the pending invitation from Dr. ${doctorName}

WHAT YOU GET:

- Your doctor can monitor your health trends remotely
- Receive personalized feedback directly in the app
- Better coordinated diabetes care

This invitation was sent because Dr. ${doctorName} added you as a patient. If you believe this was sent in error, no action is needed.

Questions? Reply to this email or contact support@glucovital.fit

Warm regards,
The Gluco Vital Team
https://glucovital.fit
    `.trim();

    let emailSent = false;
    let emailError = null;
    
    try {
      await appClient.asServiceRole.integrations.Core.SendEmail({
        to: patient_email,
        subject: `Dr. ${doctorName} wants to connect with you on Gluco Vital`,
        body: emailBody,
        from_name: "Gluco Vital Health"
      });
      emailSent = true;
      console.log('Email sent successfully to:', patient_email);
    } catch (err) {
      console.error('Email send error:', err);
      emailError = err.message || String(err);
    }

    return Response.json({ 
      success: true, 
      connection: connection,
      message: emailSent ? 'Invitation sent successfully' : 'Connection created but email failed',
      emailSent,
      emailError
    });
  } catch (error) {
    console.error('Invite patient error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});