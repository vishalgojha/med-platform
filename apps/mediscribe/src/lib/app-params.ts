const isBrowser = typeof window !== 'undefined';
const storage = isBrowser ? window.localStorage : null;

const toSnakeCase = (value: string): string => value.replace(/([A-Z])/g, '_$1').toLowerCase();

const getParamValue = (
  name: string,
  options: { defaultValue?: string; removeFromUrl?: boolean } = {},
): string | null => {
  const { defaultValue, removeFromUrl = false } = options;
  if (!isBrowser || !storage) {
    return defaultValue ?? null;
  }

  const storageKey = `app_${toSnakeCase(name)}`;
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(name);

  if (removeFromUrl) {
    urlParams.delete(name);
    const query = urlParams.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history.replaceState({}, document.title, nextUrl);
  }

  if (searchParam) {
    storage.setItem(storageKey, searchParam);
    return searchParam;
  }

  if (defaultValue) {
    storage.setItem(storageKey, defaultValue);
    return defaultValue;
  }

  return storage.getItem(storageKey);
};

const getAppParams = () => {
  if (getParamValue('clear_access_token') === 'true' && storage) {
    storage.removeItem('app_access_token');
    storage.removeItem('access_token');
  }

  return {
    appId: getParamValue('app_id', { defaultValue: import.meta.env.VITE_APP_ID as string | undefined }),
    serverUrl: getParamValue('server_url', { defaultValue: import.meta.env.VITE_APP_BACKEND_URL as string | undefined }),
    token: getParamValue('access_token', { removeFromUrl: true }),
    fromUrl: getParamValue('from_url', { defaultValue: isBrowser ? window.location.href : '' }),
    functionsVersion: getParamValue('functions_version'),
  };
};

export const appParams = getAppParams();