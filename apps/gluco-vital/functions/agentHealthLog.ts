import { createClientFromRequest } from './_shared/server-client';

Deno.serve(async (req) => {
  try {
    const appClient = createClientFromRequest(req);
    
    // Get authenticated user
    const user = await appClient.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, data, filter } = await req.json();

    // Use service role for reliable operations
    const healthLog = appClient.asServiceRole.entities.HealthLog;

    let result;

    switch (operation) {
      case 'create':
        // Always set user_email from authenticated user
        const createData = { 
          ...data, 
          user_email: user.email,
          source: data.source || 'manual'
        };
        result = await healthLog.create(createData);
        break;

      case 'read':
        // Read only user's own logs
        result = await healthLog.filter({ 
          ...filter, 
          user_email: user.email 
        }, '-created_date', 100);
        break;

      case 'update':
        if (!data.id) {
          return Response.json({ error: 'ID required for update' }, { status: 400 });
        }
        result = await healthLog.update(data.id, data);
        break;

      default:
        return Response.json({ error: 'Invalid operation' }, { status: 400 });
    }

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('Agent health log error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});