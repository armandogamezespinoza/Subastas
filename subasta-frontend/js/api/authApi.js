import { request } from './client.js';

export const authApi = {
  sendCode(email) {
    return request('/auth/send-code', { method: 'POST', body: JSON.stringify({ email }) });
  },
  verifyCode(code, challengeToken) {
    return request('/auth/verify-code', { method: 'POST', body: JSON.stringify({ code, challengeToken }) });
  }
};
