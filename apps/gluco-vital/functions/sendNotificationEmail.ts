import { createClientFromRequest } from './_shared/server-client';

Deno.serve(async (req) => {
  try {
    const appClient = createClientFromRequest(req);
    const user = await appClient.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, body, type } = await req.json();

    if (!to || !subject || !body) {
      return Response.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 });
    }

    // Use the Core integration to send email
    const result = await appClient.asServiceRole.integrations.Core.SendEmail({
      to: to,
      subject: subject,
      body: body,
      from_name: "Gluco Vital"
    });

    return Response.json({ success: true, result });
  } catch (error) {
    console.error('Email send error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});