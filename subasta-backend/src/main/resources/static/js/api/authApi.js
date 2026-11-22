import { request } from './client.js';

export const authApi = {
  login(identifier, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
  },
  sendCode(email) {
    return request('/auth/send-code', { method: 'POST', body: JSON.stringify({ email }) });
  },
  verifyCode(code, challengeToken) {
    return request('/auth/verify-code', { method: 'POST', body: JSON.stringify({ code, challengeToken }) });
  }
};
