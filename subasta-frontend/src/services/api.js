const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1')
  .replace(/\/+$/, '');

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let data = null;
  if (response.status !== 204) {
    data = isJson ? await response.json() : await response.text();
  }

  if (!response.ok) {
    const message = data && typeof data === 'object'
      ? data.error || data.message
      : null;
    throw new Error(message || `Error del servidor (${response.status})`);
  }

  if (data && typeof data === 'object' && data.success === false) {
    throw new Error(data.error || data.message || 'La operación no pudo completarse.');
  }

  return data;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
