// Vitest tests for new frontend enhancements (file validation, login rejection, phone duplicate, revision modal)
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import path from 'path';
import fs from 'fs';

// Helper to load a fresh copy of the module under test
async function loadModule(modulePath) {
  const mod = await import(modulePath);
  return mod;
}

describe('Frontend Enhancements (TDD)', () => {
  let dom, document, window;

  beforeEach(() => {
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
    dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/' });
    document = dom.window.document;
    window = dom.window;
    // expose globals used by the app code
    global.window = window;
    global.document = document;
    global.FormData = window.FormData;
    global.File = window.File;
    global.Blob = window.Blob;
    global.fetch = vi.fn(); // will be overridden per test
    // reset app state (state is exported from app.js)
    const { state } = await import('../js/app.js');
    Object.assign(state, {});
  });

  it('rejects unsupported file types on onboarding', async () => {
    const { submitOnboarding } = await loadModule('../js/app.js');
    // Build a minimal onboarding form
    const form = document.createElement('form');
    form.id = 'onboardingForm';
    // Add a file input (invalid .txt)
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.name = 'cd-ine';
    const txtFile = new window.File(['test'], 'test.txt', { type: 'text/plain' });
    Object.defineProperty(fileInput, 'files', { value: [txtFile] });
    form.appendChild(fileInput);
    // Add required hidden inputs to avoid early return
    const emailInput = document.createElement('input');
    emailInput.name = 'email';
    emailInput.value = 'test@example.com';
    form.appendChild(emailInput);
    // simulate submit event
    const event = { preventDefault: () => {}, currentTarget: form };
    await submitOnboarding(event);
    // Expect an error message appears next to the file input
    const err = fileInput.parentNode.querySelector('.error-msg');
    expect(err).not.toBeNull();
    expect(err.textContent).toContain('Tipo de archivo no permitido');
    // fetch should never be called because validation stopped
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows login rejection banner on 403 with rejected flag', async () => {
    const { submitLogin, state } = await loadModule('../js/app.js');
    // Mock DOM elements used by login
    const loginView = document.createElement('div');
    loginView.id = 'loginView';
    document.body.appendChild(loginView);
    const emailInput = document.createElement('input');
    emailInput.id = 'loginEmail';
    emailInput.value = 'rejected@example.com';
    const passwordInput = document.createElement('input');
    passwordInput.id = 'loginPassword';
    passwordInput.value = 'any';
    const submitBtn = document.createElement('button');
    submitBtn.id = 'loginSubmitBtn';
    document.body.append(emailInput, passwordInput, submitBtn);
    // Mock fetch to return a 403 response with rejected payload
    const apiErrorPayload = { rejected: true, error: 'Solicitud no aprobada' };
    global.fetch.mockResolvedValue({ ok: false, status: 403, json: async () => apiErrorPayload, headers: { get: () => 'application/json' } });
    // Create fake event
    const event = { preventDefault: () => {} };
    await submitLogin(event);
    // Expect banner inserted
    const alert = loginView.querySelector('.alert--error');
    expect(alert).not.toBeNull();
    expect(alert.textContent).toContain('Solicitud no aprobada');
  });

  it('displays phone duplicate error on onboarding conflict (409)', async () => {
    const { submitOnboarding } = await loadModule('../js/app.js');
    // Build a minimal onboarding form with phone field
    const form = document.createElement('form');
    const phoneInput = document.createElement('input');
    phoneInput.name = 'telefono';
    phoneInput.value = '5551234';
    form.appendChild(phoneInput);
    // Add other required fields to pass earlier checks
    const emailInput = document.createElement('input');
    emailInput.name = 'email';
    emailInput.value = 'dup@example.com';
    form.appendChild(emailInput);
    // Mock fetch for onboarding API to reject with 409
    const conflictPayload = { error: 'El número de teléfono ya está registrado.' };
    global.fetch.mockResolvedValue({ ok: false, status: 409, json: async () => conflictPayload, headers: { get: () => 'application/json' } });
    const event = { preventDefault: () => {}, currentTarget: form };
    await submitOnboarding(event);
    const err = phoneInput.parentNode.querySelector('.error-msg');
    expect(err).not.toBeNull();
    expect(err.textContent).toContain('El número de teléfono ya está registrado');
  });

  it('opens revision modal with correct template and read‑only fields for approve action', async () => {
    const { openRevisionModal } = await loadModule('../js/components/RevisionModal.js');
    // Mock revisionApi
    const mockTemplates = [
      { codigo: 'APROBACION', asunto: 'Aprobado', cuerpo: 'Tu solicitud {folio} ha sido aprobada.' },
      { codigo: 'OBSERVACION_DOCUMENTO', asunto: 'Observación', cuerpo: 'Falta el documento {campo}.' },
      { codigo: 'RECHAZO_DIRECTO', asunto: 'Rechazado', cuerpo: 'Tu solicitud {folio} fue rechazada.' }
    ];
    const revisionApi = { getTemplates: vi.fn().mockResolvedValue(mockTemplates), sendEmail: vi.fn().mockResolvedValue({}) };
    // replace imported module's revisionApi via temporary override
    const mod = await import('../js/components/RevisionModal.js');
    mod.revisionApi = revisionApi;
    // invoke modal for approve action
    await openRevisionModal(42, 'approve');
    const modal = document.getElementById('revisionModal');
    expect(modal).not.toBeNull();
    const subjectInput = modal.querySelector('input[type="text"]');
    const bodyTextarea = modal.querySelector('textarea');
    expect(subjectInput).not.toBeNull();
    expect(subjectInput.readOnly).toBe(true);
    expect(bodyTextarea).not.toBeNull();
    expect(bodyTextarea.readOnly).toBe(true);
    // Ensure placeholders were replaced (folio)
    expect(bodyTextarea.textContent).toContain('CMP-42');
    // Clean up
    modal.remove();
  });
});

