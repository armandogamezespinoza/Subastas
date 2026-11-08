import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getApiBaseUrl, request, ApiError } from '../js/api/client.js';

describe('Backend Consumption & No Fake Test Data', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getApiBaseUrl should support relative path for Docker Nginx proxy or fallback', () => {
    const url = getApiBaseUrl();
    expect(url).toBeDefined();
    expect(url.endsWith('/api/v1') || url === '/api/v1').toBe(true);
  });

  it('client request should throw descriptive ApiError without mock fallbacks', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error connecting to backend'));
    await expect(request('/onboarding/buyer')).rejects.toThrow(ApiError);
  });

  it('should parse backend validation error messages from backend payload', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: false, error: 'El correo electrónico ya se encuentra registrado' })
    });

    await expect(request('/onboarding/buyer')).rejects.toThrow('El correo electrónico ya se encuentra registrado');
  });
});
