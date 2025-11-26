const hasWindow = typeof window !== 'undefined' && window.location;

const normalizeOrigin = (origin) => origin.replace(/\/+$/, '');

export const getDefaultApiBaseUrl = () => {
  const explicitUrl = process.env.REACT_APP_API_URL?.trim();
  if (explicitUrl) {
    return explicitUrl.replace(/\/+$/, '');
  }
  if (hasWindow && hasWindow.origin) {
    return `${normalizeOrigin(hasWindow.origin)}/api`;
  }
  return 'http://localhost:4000/api';
};

export const stripApiSuffix = (url) => url.replace(/\/api\/?$/, '');

export const getAuthBaseUrl = () => {
  const apiBase = getDefaultApiBaseUrl();
  return `${stripApiSuffix(apiBase)}/api/auth`;
};

export const getDefaultWsUrl = () => {
  const explicitUrl = process.env.REACT_APP_WS_URL?.trim();
  if (explicitUrl) {
    return explicitUrl;
  }
  if (hasWindow && hasWindow.protocol && hasWindow.host) {
    const protocol = hasWindow.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${hasWindow.host}/ws`;
  }
  return 'ws://localhost:4000/ws';
};

