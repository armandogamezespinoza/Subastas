import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi } from '../js/api/authApi.js';
import { onboardingApi } from '../js/api/onboardingApi.js';

describe('Verification Flow & Registration API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('authApi should send code with email', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true, challengeToken: 'test-token', message: 'Código enviado' })
    });
    global.fetch = fetchSpy;

    const res = await authApi.sendCode('postor@ejemplo.com');
    expect(fetchSpy).toHaveBeenCalled();
    const calledUrl = fetchSpy.mock.calls[0][0];
    const calledBody = JSON.parse(fetchSpy.mock.calls[0][1].body);

    expect(calledUrl).toContain('/auth/send-code');
    expect(calledBody.email).toBe('postor@ejemplo.com');
    expect(res.challengeToken).toBe('test-token');
  });

  it('authApi should verify code with challengeToken', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true, verified: true, verifiedEmailToken: 'verified-jwt' })
    });
    global.fetch = fetchSpy;

    const res = await authApi.verifyCode('123456', 'test-token');
    expect(fetchSpy).toHaveBeenCalled();
    const calledUrl = fetchSpy.mock.calls[0][0];
    const calledBody = JSON.parse(fetchSpy.mock.calls[0][1].body);

    expect(calledUrl).toContain('/auth/verify-code');
    expect(calledBody.code).toBe('123456');
    expect(calledBody.challengeToken).toBe('test-token');
    expect(res.verified).toBe(true);
  });

  it('onboardingApi should submit buyer registration as multipart/form-data with datos and files', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true, folio: 'CMP-0001', mensaje: 'Registrado con éxito' })
    });
    global.fetch = fetchSpy;

    const buyerData = {
      email: 'comprador@subasta.mx',
      telefono: '6671234567',
      tipoPersona: 'FISICA',
      nombres: 'Juan',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'García',
      estado: 'Sinaloa',
      ciudad: 'Culiacán',
      codigoPostal: '80000',
      colonia: 'Centro',
      calle: 'Álvaro Obregón 123',
      password: 'Password123!'
    };
    const files = {
      'cd-curp': new File(['curp-dummy'], 'curp.pdf', { type: 'application/pdf' })
    };

    const res = await onboardingApi.registerBuyer(buyerData, files);
    expect(fetchSpy).toHaveBeenCalled();
    const calledUrl = fetchSpy.mock.calls[0][0];
    const calledOptions = fetchSpy.mock.calls[0][1];

    expect(calledUrl).toContain('/onboarding/buyer');
    expect(calledOptions.method).toBe('POST');
    expect(calledOptions.body instanceof FormData).toBe(true);
    expect(res.folio).toBe('CMP-0001');
  });

  it('onboardingApi should submit seller registration as multipart/form-data with datos and files', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true, folio: 'VND-0001', mensaje: 'Registrado con éxito' })
    });
    global.fetch = fetchSpy;

    const sellerData = {
      email: 'vendedor@subasta.mx',
      telefono: '6677654321',
      tipoPersona: 'MORAL',
      razonSocial: 'Subastas del Norte S.A.',
      rfc: 'SNO200101ABC',
      estado: 'Sinaloa',
      ciudad: 'Culiacán',
      codigoPostal: '80000',
      colonia: 'Centro',
      calle: 'Álvaro Obregón 456',
      password: 'Password123!'
    };
    const files = {};

    const res = await onboardingApi.registerSeller(sellerData, files);
    expect(fetchSpy).toHaveBeenCalled();
    const calledUrl = fetchSpy.mock.calls[0][0];
    expect(calledUrl).toContain('/onboarding/seller');
    expect(res.folio).toBe('VND-0001');
  });
});
