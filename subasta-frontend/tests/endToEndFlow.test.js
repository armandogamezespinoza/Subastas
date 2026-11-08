import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('End-to-End Onboarding: Code Verification -> Registration Flow', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
    dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/' });
    document = dom.window.document;
    window = dom.window;
    global.window = window;
    global.document = document;
    global.FormData = window.FormData;
    global.File = window.File;
    global.Blob = window.Blob;
  });

  it('full flow: submits form, sends code, verifies code, and submits registration to backend', async () => {
    const {
      state,
      setRole,
      submitOnboarding,
      submitVerifyModal
    } = await import('../js/app.js');
    const { initAddressCascade } = await import('../js/services/addressService.js');

    // Initialize UI components in DOM
    setRole('COMPRADOR', document);
    initAddressCascade(document);

    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    // Mock sendCode response
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true, challengeToken: 'test-challenge-jwt-123', message: 'Código enviado a tu correo' })
    });

    // Mock verifyCode response
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true, verified: true, email: 'postor@subasta.mx', verifiedEmailToken: 'verified-token' })
    });

    // Mock registerBuyer response
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true, folio: 'CMP-0042', mensaje: 'Solicitud de comprador enviada exitosamente' })
    });

    // Fill form
    const form = document.querySelector('#onboardingForm');
    form.querySelector('[name="email"]').value = 'postor@subasta.mx';
    form.querySelector('[name="telefono"]').value = '6671234567';
    form.querySelector('[name="nombres"]').value = 'Carlos';
    form.querySelector('[name="apellidoPaterno"]').value = 'López';
    form.querySelector('[name="apellidoMaterno"]').value = 'Sánchez';
    form.querySelector('[name="fechaNacimiento"]').value = '1990-05-15';
    form.querySelector('[name="curp"]').value = 'LOSC900515HDFRNR01';
    form.querySelector('[name="rfc"]').value = 'LOSC900515AB1';

    // Cascading address selection
    const estadoSelect = form.querySelector('[name="estado"]');
    estadoSelect.value = 'Sinaloa';
    estadoSelect.dispatchEvent(new window.Event('change'));

    const ciudadSelect = form.querySelector('[name="ciudad"]');
    ciudadSelect.value = 'Culiacán';
    ciudadSelect.dispatchEvent(new window.Event('change'));

    const cpInput = form.querySelector('[name="codigoPostal"]');
    cpInput.value = '80000';
    cpInput.dispatchEvent(new window.Event('input'));

    const colInput = form.querySelector('[name="colonia"]');
    colInput.value = 'Centro';
    colInput.dispatchEvent(new window.Event('input'));

    const calleInput = form.querySelector('[name="calle"]');
    calleInput.value = 'Álvaro Obregón 100';

    form.querySelector('[name="password"]').value = 'Segura123!';

    // Provide mock files for required file inputs
    const mockFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });
    form.querySelectorAll('input[type="file"]').forEach(input => {
      Object.defineProperty(input, 'files', { value: [mockFile], writable: true });
    });

    // jsdom form validation helper
    form.reportValidity = () => true;

    // Submit form -> triggers sendCode
    const submitEvent = new window.Event('submit', { cancelable: true });
    Object.defineProperty(submitEvent, 'currentTarget', { value: form });
    await submitOnboarding(submitEvent);

    // Verify modal is open and registration has not happened yet
    const verifyModal = document.querySelector('#verifyModal');
    expect(verifyModal.classList.contains('hidden')).toBe(false);
    expect(document.querySelector('#verifyEmailDisplay').textContent).toBe('postor@subasta.mx');
    expect(state.preSubmitChallengeToken).toBe('test-challenge-jwt-123');

    // User inputs OTP code into verifyModal
    document.querySelector('#verifyOtpCode').value = '654321';
    const verifyForm = document.querySelector('#verifyForm');
    const verifyEvent = new window.Event('submit', { cancelable: true });
    await submitVerifyModal(verifyEvent);

    // Verify modal is now closed
    expect(verifyModal.classList.contains('hidden')).toBe(true);

    // Verify buyer registration was called with folio received
    const buyerCall = fetchSpy.mock.calls.find(call => call[0].includes('/onboarding/buyer'));
    expect(buyerCall).toBeDefined();
    expect(buyerCall[1].method).toBe('POST');

    // Verify solicitudes were automatically refreshed
    const refreshCall = fetchSpy.mock.calls.find(call => call[0].includes('/revision/solicitudes'));
    expect(refreshCall).toBeDefined();
  });
});

