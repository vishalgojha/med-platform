type Json = Record<string, any>;

const toSnakeCase = (value: string): string => value.replace(/([A-Z])/g, '_$1').toLowerCase();

const createEntityClient = (entityName: string) => {
  const table = toSnakeCase(entityName);
  return {
    list: async (): Promise<any[]> => [],
    filter: async (): Promise<any[]> => [],
    create: async (payload: Json): Promise<any> => payload,
    update: async (id: string, payload: Json): Promise<any> => ({ id, ...payload }),
    delete: async (id: string): Promise<{ id: string; deleted: boolean }> => ({ id, deleted: true }),
    bulkCreate: async (payload: Json[]): Promise<any[]> => payload,
    _table: table,
  };
};

const entityProxy = new Proxy<Record<string, any>>(
  {},
  {
    get: (_, entityName: string) => createEntityClient(entityName),
  },
);

const createServerAppClientInternal = (request?: Request) => {
  const email = request?.headers?.get('x-user-email') ?? 'system@local';

  const client: any = {
    auth: {
      me: async () => ({ email }),
      isAuthenticated: async () => true,
      logout: async () => {},
      redirectToLogin: () => {},
      updateMe: async (payload: Json) => payload,
    },
    entities: entityProxy,
    integrations: {
      Core: {
        InvokeLLM: async (payload: Json) => ({ text: 'LLM integration is not configured yet.', payload }),
        SendEmail: async (payload: Json) => ({ ok: true, dryRun: true, payload }),
        SendSMS: async (payload: Json) => ({ ok: true, dryRun: true, payload }),
        UploadFile: async (payload: Json) => ({ file_url: payload?.file_url ?? '' }),
        GenerateImage: async (payload: Json) => ({ image_url: '', payload }),
        ExtractDataFromUploadedFile: async (payload: Json) => ({ extracted: null, payload }),
      },
    },
    functions: {
      invoke: async (_name: string, payload: Json = {}) => payload,
    },
    agents: {
      getWhatsAppConnectURL: (agentName: string) => `https://wa.me/?text=${encodeURIComponent(`Connect me with ${agentName}`)}`,
      createConversation: async (payload: Json = {}) => ({ id: `${Date.now()}`, ...payload }),
      subscribeToConversation: () => () => {},
      addMessage: async (_conversation: Json, message: Json) => ({ created_at: new Date().toISOString(), ...message }),
      listConversations: async () => [],
    },
    appLogs: {
      logUserInApp: async (_pageName: string) => {},
    },
  };

  client.asServiceRole = client;
  return client;
};

export const createClientFromRequest = (request: Request): any => createServerAppClientInternal(request);
export const createClient = (config: Json = {}): any => createServerAppClientInternal(config.request as Request | undefined);