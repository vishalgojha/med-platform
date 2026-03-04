import { createClientFromRequest } from './_shared/server-client';

Deno.serve(async (req) => {
  try {
    const appClient = createClientFromRequest(req);
    
    // Get authenticated user
    const user = await appClient.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, entity, data, filter } = await req.json();

    // Use service role for reliable operations
    const entityClient = appClient.asServiceRole.entities[entity];
    
    if (!entityClient) {
      return Response.json({ error: `Entity ${entity} not found` }, { status: 400 });
    }

    let result;

    switch (operation) {
      case 'create':
        const createData = { ...data, user_email: user.email };
        result = await entityClient.create(createData);
        break;

      case 'read':
        result = await entityClient.filter({ 
          ...filter, 
          user_email: user.email 
        });
        break;

      case 'update':
        if (!data.id) {
          // Find and update by user_email
          const existing = await entityClient.filter({ user_email: user.email });
          if (existing && existing.length > 0) {
            result = await entityClient.update(existing[0].id, data);
          } else {
            return Response.json({ error: 'Record not found' }, { status: 404 });
          }
        } else {
          result = await entityClient.update(data.id, data);
        }
        break;

      case 'upsert':
        const existingRecs = await entityClient.filter({ user_email: user.email });
        if (existingRecs && existingRecs.length > 0) {
          result = await entityClient.update(existingRecs[0].id, data);
        } else {
          const upsertData = { ...data, user_email: user.email };
          result = await entityClient.create(upsertData);
        }
        break;

      default:
        return Response.json({ error: 'Invalid operation' }, { status: 400 });
    }

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('Agent profile error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});