import { createClientFromRequest } from './_shared/server-client';

Deno.serve(async (req) => {
  try {
    const appClient = createClientFromRequest(req);
    const user = await appClient.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, entity, data, id, filter } = await req.json();

    // Use service role for operations that need elevated privileges
    const entityClient = appClient.asServiceRole.entities[entity];

    if (!entityClient) {
      return Response.json({ error: `Entity ${entity} not found` }, { status: 400 });
    }

    let result;

    switch (operation) {
      case 'create':
        // Ensure user_email is set to current user
        const createData = { ...data, user_email: user.email };
        result = await entityClient.create(createData);
        break;

      case 'update':
        if (!id) {
          return Response.json({ error: 'ID required for update' }, { status: 400 });
        }
        result = await entityClient.update(id, data);
        break;

      case 'upsert':
        // Find existing record first
        const existing = await entityClient.filter({ user_email: user.email });
        if (existing && existing.length > 0) {
          result = await entityClient.update(existing[0].id, data);
        } else {
          const upsertData = { ...data, user_email: user.email };
          result = await entityClient.create(upsertData);
        }
        break;

      case 'read':
        if (id) {
          result = await entityClient.get(id);
        } else if (filter) {
          result = await entityClient.filter({ ...filter, user_email: user.email });
        } else {
          result = await entityClient.filter({ user_email: user.email });
        }
        break;

      case 'delete':
        if (!id) {
          return Response.json({ error: 'ID required for delete' }, { status: 400 });
        }
        result = await entityClient.delete(id);
        break;

      default:
        return Response.json({ error: 'Invalid operation' }, { status: 400 });
    }

    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('Entity operation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});