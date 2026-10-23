const API_BASE_URL = 'http://localhost:8080/api/v1';

export class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export async function request(path, options = {}) {
  const { headers = {}, ...rest } = options;
  const config = { ...rest, headers: { ...headers } };
  if (!(config.body instanceof FormData) && config.body !== undefined) {
    config.headers['Content-Type'] ??= 'application/json';
  }
  config.headers['Accept'] ??= 'application/json';
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, config);
  } catch (error) {
    throw new ApiError('No se pudo conectar con el servidor. Verifica que Spring Boot esté activo.', 0, error);
  }
  const contentType = response.headers.get('content-type') || '';
  let payload = null;
  if (response.status !== 204) {
    try { payload = contentType.includes('application/json') ? await response.json() : await response.text(); }
    catch { payload = null; }
  }
  if (!response.ok) {
    const message = payload && typeof payload === 'object'
      ? (payload.message || payload.mensaje || payload.error || `Error ${response.status}`)
      : (typeof payload === 'string' && payload ? payload : `Error ${response.status}`);
    throw new ApiError(message, response.status, payload);
  }
  return payload;
}

export { API_BASE_URL };
