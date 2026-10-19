import { apiRequest } from './api.js';

export function requestEmailCode(email, signal) {
  return apiRequest('/auth/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    signal
  });
}

export function confirmEmailCode({ challengeToken, code, signal }) {
  // Ajusta ruta y propiedades al contrato real de Spring Boot.
  return apiRequest('/auth/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeToken, code }),
    signal
  });
}
