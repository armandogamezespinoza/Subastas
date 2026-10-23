import { request } from './client.js';

function toMultipart(data, files) {
  const formData = new FormData();
  formData.append('datos', new Blob([JSON.stringify(data)], { type: 'application/json' }));
  for (const [field, file] of Object.entries(files)) {
    if (file instanceof File) formData.append(field, file);
  }
  return formData;
}

export const onboardingApi = {
  registerBuyer(data, files) {
    return request('/onboarding/buyer', { method: 'POST', body: toMultipart(data, files) });
  },
  registerSeller(data, files) {
    return request('/onboarding/seller', { method: 'POST', body: toMultipart(data, files) });
  }
};
