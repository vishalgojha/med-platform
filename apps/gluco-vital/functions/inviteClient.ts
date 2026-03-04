import { createClientFromRequest } from './_shared/server-client';

Deno.serve(async (req) => {
  try {
    const appClient = createClientFromRequest(req);
    const user = await appClient.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_email, client_name, message } = await req.json();

    if (!client_email) {
      return Response.json({ error: 'Client email is required' }, { status: 400 });
    }

    // Check if connection already exists
    const existingConnections = await appClient.asServiceRole.entities.CoachConnection.filter({
      coach_email: user.email,
      client_email: client_email
    });

    if (existingConnections && existingConnections.length > 0) {
      const existing = existingConnections[0];
      if (existing.status === 'active') {
        return Response.json({ error: 'You are already connected to this client' }, { status: 400 });
      }
      if (existing.status === 'pending') {
        return Response.json({ error: 'An invitation is already pending for this client' }, { status: 400 });
      }
      // If status is revoked or expired, allow re-invite
      if (existing.status === 'revoked' || existing.status === 'expired') {
        const updated = await appClient.asServiceRole.entities.CoachConnection.update(existing.id, {
          status: 'pending',
          client_name: client_name || existing.client_name,
          invited_at: new Date().toISOString()
        });
        
        // Send email for re-invite
        try {
          await sendInviteEmail(appClient, user, client_email, client_name, message);
        } catch (err) {
          console.error('Email error on re-invite:', err);
        }
        
        return Response.json({ 
          success: true, 
          connection: updated,
          message: 'Re-invitation sent',
          emailSent: true
        });
      }
    }

    // Create a pending connection (coach-initiated)
    const connection = await appClient.asServiceRole.entities.CoachConnection.create({
      client_email: client_email,
      client_name: client_name || client_email,
      coach_email: user.email,
      coach_name: user.full_name,
      status: 'pending',
      permissions: ['view_logs', 'view_reports', 'view_insights'],
      invited_at: new Date().toISOString()
    });

    // Send invitation email
    let emailSent = false;
    let emailError = null;
    
    try {
      await sendInviteEmail(appClient, user, client_email, client_name, message);
      emailSent = true;
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
    console.error('Invite client error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function sendInviteEmail(appClient, user, client_email, client_name, message) {
  const displayName = client_name || 'there';
  const coachName = user.full_name || 'Your Coach';
  
  const emailBody = `
Dear ${displayName},

${coachName} would like to connect with you on Gluco Vital to support your health journey.

${message ? `Personal message: "${message}"\n` : ''}
HOW TO ACCEPT:

Step 1: Visit https://glucovital.fit
Step 2: Sign up or log in with this email address
Step 3: Navigate to Profile > Connections
Step 4: Accept the pending invitation from ${coachName}

WHAT YOU GET:

- Personalized health insights from your coach
- Progress tracking and feedback
- Coordinated care for better outcomes

This invitation was sent because ${coachName} added you as a client. If you believe this was sent in error, no action is needed.

Questions? Reply to this email or contact support@glucovital.fit

Warm regards,
The Gluco Vital Team
https://glucovital.fit
  `.trim();

  await appClient.asServiceRole.integrations.Core.SendEmail({
    to: client_email,
    subject: `${coachName} wants to connect with you on Gluco Vital`,
    body: emailBody,
    from_name: "Gluco Vital Health"
  });
}