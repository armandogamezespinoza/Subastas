import { request } from './client.js';

export const authApi = {
  login(identifier, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
  },
  sendCode(email, options = {}) {
    return request('/auth/send-code', { method: 'POST', body: JSON.stringify({ email, ...options }) });
  },
  verifyCode(code, challengeToken) {
    return request('/auth/verify-code', { method: 'POST', body: JSON.stringify({ code, challengeToken }) });
  },
  forgotPassword(email) {
    return request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
  },
  verifyResetCode(code, challengeToken) {
    return request('/auth/verify-reset-code', { method: 'POST', body: JSON.stringify({ code, challengeToken }) });
  },
  resetPassword(resetToken, newPassword) {
    return request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ resetToken, newPassword }) });
  }
};
