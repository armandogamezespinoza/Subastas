export function getApiBaseUrl() {
  return '/api/v1';
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
    let message = `Error ${response.status}`;
    if (payload && typeof payload === 'object') {
      if (payload.details && typeof payload.details === 'object') {
        const detailValues = Object.values(payload.details);
        if (detailValues.length > 0 && detailValues[0]) {
          message = detailValues[0];
        }
      }
      if (message === `Error ${response.status}` || (payload.error && payload.error !== 'Validación fallida')) {
        message = payload.error || payload.message || payload.mensaje || message;
      }
    } else if (typeof payload === 'string' && payload) {
      message = payload;
    }
    throw new ApiError(message, response.status, payload);
  }
  return payload;
}

export { API_BASE_URL };
