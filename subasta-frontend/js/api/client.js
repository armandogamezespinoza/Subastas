export function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.location) {
    // When served via Docker Nginx on port 80 or reverse proxy
    if (window.location.port === '80' || window.location.port === '' || window.location.pathname.startsWith('/api')) {
      return '/api/v1';
    }
  }
  return 'http://localhost:8080/api/v1';
}

const API_BASE_URL = getApiBaseUrl();

export class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export async function request(path, options = {}) {
  const { headers = {}, token, ...rest } = options;
  const config = { ...rest, headers: { ...headers } };

  // Attach JWT Bearer token if available
  const activeToken = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('subasta_token') : null);
  if (activeToken && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${activeToken}`;
  }

  if (!(config.body instanceof FormData) && config.body !== undefined) {
    config.headers['Content-Type'] ??= 'application/json';
  }
  config.headers['Accept'] ??= 'application/json';
  let response;
  const baseUrl = getApiBaseUrl();
  try {
    response = await fetch(`${baseUrl}${path}`, config);
  } catch (error) {
    throw new ApiError('No se pudo conectar con el servidor backend. Verifica que Spring Boot esté activo.', 0, error);
  }
  const contentType = response.headers.get('content-type') || '';
  let payload = null;
  if (response.status !== 204) {
    try { payload = contentType.includes('application/json') ? await response.json() : await response.text(); }
    catch { payload = null; }
  }
  if (!response.ok) {
    const message = payload && typeof payload === 'object'
      ? (payload.error || payload.message || payload.mensaje || `Error ${response.status}`)
      : (typeof payload === 'string' && payload ? payload : `Error ${response.status}`);
    throw new ApiError(message, response.status, payload);
  }
  return payload;
}

export { API_BASE_URL };
