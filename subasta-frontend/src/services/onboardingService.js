import { apiRequest } from './api.js';

export function registerOnboarding({ type, payload, files, token, signal }) {
  const formData = new FormData();

  formData.append(
    'datos',
    new Blob([JSON.stringify(payload)], { type: 'application/json' })
  );

  Object.entries(files || {}).forEach(([key, file]) => {
    if (file instanceof File) formData.append(key, file);
  });

  const endpoint = type === 'comprador'
    ? '/onboarding/buyer'
    : '/onboarding/seller';

  return apiRequest(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
    signal
  });
}
