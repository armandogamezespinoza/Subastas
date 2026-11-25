import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('QA Frontend Fixes (TDD)', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
    dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/' });
    document = dom.window.document;
    window = dom.window;
    window.__TEST_ENV__ = true;
    window.scrollTo = vi.fn();
    global.window = window;
    global.document = document;
    global.FormData = window.FormData;
    global.File = window.File;
    global.Blob = window.Blob;
  });

  it('QA-FE-1: Onboarding disables fields until email is verified via #verifyOnboardingEmailBtn', async () => {
    const {
      state,
      setRole,
      bindEvents,
      updateOnboardingLockState,
      submitVerifyModal
    } = await import('../js/app.js');
    const { initAddressCascade } = await import('../js/services/addressService.js');

    state.verifiedEmail = '';
    state.verifiedEmailToken = '';
    setRole('COMPRADOR', document);
    initAddressCascade(document);
    bindEvents();
    updateOnboardingLockState(document);

    const emailInput = document.querySelector('#onboardingEmail');
    const verifyBtn = document.querySelector('#verifyOnboardingEmailBtn');
    const telefonoInput = document.querySelector('#onboardingForm [name="telefono"]');
    const nombresInput = document.querySelector('#onboardingForm [name="nombres"]');
    const submitBtn = document.querySelector('#submitOnboardingBtn');

    expect(verifyBtn).not.toBeNull();
    expect(emailInput.disabled).toBe(false);
    expect(telefonoInput.disabled).toBe(true);
    expect(nombresInput.disabled).toBe(true);
    expect(submitBtn.disabled).toBe(true);

    // Mock sendCode + verifyCode
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, challengeToken: 'chal-123' })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          success: true,
          verified: true,
          email: 'qa@subasta.mx',
          verifiedEmailToken: 'verified-jwt-999'
        })
      });
    global.fetch = fetchSpy;

    emailInput.value = 'qa@subasta.mx';
    verifyBtn.click();
    await new Promise(r => setTimeout(r, 20));

    expect(document.querySelector('#verifyModal').classList.contains('hidden')).toBe(false);

    document.querySelector('#verifyOtpCode').value = '123456';
    const verifyEvent = new window.Event('submit', { cancelable: true });
    await submitVerifyModal(verifyEvent);

    expect(state.verifiedEmail).toBe('qa@subasta.mx');
    expect(state.verifiedEmailToken).toBe('verified-jwt-999');
    expect(telefonoInput.disabled).toBe(false);
    expect(nombresInput.disabled).toBe(false);
    expect(submitBtn.disabled).toBe(false);
  });

  it('QA-FE-2: Navigating to #/registro scrolls to top of the screen', async () => {
    const { handleRoute } = await import('../js/app.js');
    window.scrollTo.mockClear();
    handleRoute('#/registro', document);
    expect(window.scrollTo).toHaveBeenCalled();
    const call = window.scrollTo.mock.calls[0];
    expect(call[0] === 0 || call[0]?.top === 0).toBe(true);
  });

  it('QA-FE-3: Extracts birth date from CURP and RFC and populates fechaNacimiento in dd/mm/aaaa', async () => {
    const { extractBirthDateFromCurpOrRfc, bindEvents } = await import('../js/app.js');

    expect(extractBirthDateFromCurpOrRfc('LOSC900515HDFRNR01')).toBe('15/05/1990');
    expect(extractBirthDateFromCurpOrRfc('GAGM020304MDFRRNA2')).toBe('04/03/2002');
    expect(extractBirthDateFromCurpOrRfc('LOSC900515AB1')).toBe('15/05/1990');
    expect(extractBirthDateFromCurpOrRfc('INVALID')).toBeNull();

    bindEvents();
    const curpInput = document.querySelector('#onboardingForm [name="curp"]');
    const birthInput = document.querySelector('#onboardingForm [name="fechaNacimiento"]');
    curpInput.disabled = false;
    birthInput.disabled = false;
    curpInput.value = 'LOSC900515HDFRNR01';
    curpInput.dispatchEvent(new window.Event('input'));
    expect(birthInput.value).toBe('15/05/1990');
  });

  it('QA-FE-4: Entering CP lists available colonias in #coloniaList', async () => {
    const { initAddressCascade, lookupByCodigoPostal } = await import('../js/services/addressService.js');

    const lookup = lookupByCodigoPostal('80000');
    expect(lookup).not.toBeNull();
    expect(lookup.colonias).toContain('Centro');

    initAddressCascade(document);
    const cpInput = document.querySelector('#codigoPostalInput');
    const colInput = document.querySelector('#coloniaInput');
    const colList = document.querySelector('#coloniaList');

    cpInput.disabled = false;
    cpInput.value = '80000';
    cpInput.dispatchEvent(new window.Event('input'));

    expect(colInput.disabled).toBe(false);
    const options = Array.from(colList.querySelectorAll('option')).map(o => o.value);
    expect(options).toContain('Centro');
    expect(options).toContain('Primer Cuadro');
  });

  it('QA-FE-5 & QA-FE-6: Removes login link from onboarding form and updates success message wording', () => {
    expect(document.querySelector('#onboardingToLoginBtn')).toBeNull();
    expect(document.querySelector('#onboardingForm .to-login-link')).toBeNull();

    const successCard = document.querySelector('#registrationSuccessMessage');
    expect(successCard).not.toBeNull();
    const text = successCard.textContent.replace(/\s+/g, ' ').trim();
    expect(text).toContain('Hemos recibido tu petición para dar de alta tu usuario en la plataforma de subastas');
    expect(text).toContain('En breve un administrador de la plataforma la estará revisando y se pondrá en contacto contigo.');
  });

  it('QA-FE-7: Requests grid displays profile type, RECIBIDO status label, and pagination controls', async () => {
    const { renderRequestsTable, paginateRequests } = await import('../js/components/requestsTable.js');

    const sample = Array.from({ length: 12 }, (_, idx) => ({
      id: idx + 1,
      folio: `CMP-00${idx + 1}`,
      nombre: `Usuario ${idx + 1}`,
      email: `u${idx + 1}@subasta.mx`,
      tipo: idx % 2 === 0 ? 'COMPRADOR' : 'VENDEDOR',
      tipoPersona: idx % 2 === 0 ? 'FISICA' : 'MORAL',
      estatus: idx === 0 ? 'RECIBIDO' : 'ENVIADO',
      totalDocumentos: 3
    }));

    const page1 = paginateRequests(sample, 1, 5);
    expect(page1.items).toHaveLength(5);
    expect(page1.totalPages).toBe(3);

    const html = renderRequestsTable(page1.items, { page: 1, totalPages: 3, totalItems: 12 });
    expect(html).toContain('Persona Física');
    expect(html).toContain('Persona Moral');
    expect(html).toContain('Recibido');
    expect(html).not.toContain('Sin estado');
    expect(html).toContain('data-page="2"');
  });

  it('QA-FE-8: Review detail allows editing email subject and body for EN_REVISION and passes them to updateStatus', async () => {
    const { renderDetail, updateRequestStatus } = await import('../js/app.js');

    const detail = {
      id: 10,
      folio: 'CMP-0010',
      tipo: 'COMPRADOR',
      estatus: 'RECIBIDO',
      datos: {
        nombres: 'Ana',
        apellidoPaterno: 'Ruiz',
        email: 'ana@subasta.mx'
      },
      documentos: []
    };

    renderDetail(detail, 'COMPRADOR', 10, document);

    const statusSelect = document.querySelector('#newStatus');
    const subjectInput = document.querySelector('#emailSubject');
    const bodyInput = document.querySelector('#emailBody');
    expect(subjectInput).not.toBeNull();
    expect(bodyInput).not.toBeNull();

    statusSelect.value = 'EN_REVISION';
    statusSelect.dispatchEvent(new window.Event('change'));

    expect(subjectInput.value).not.toBe('');
    expect(bodyInput.value).not.toBe('');

    subjectInput.value = 'Asunto editado por admin';
    bodyInput.value = 'Mensaje editado en navegador';

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true, estatus: 'EN_REVISION' })
    });
    global.fetch = fetchSpy;

    await updateRequestStatus('COMPRADOR', 10);

    const putCall = fetchSpy.mock.calls.find(c => c[0].includes('/estatus'));
    expect(putCall).toBeDefined();
    const sentBody = JSON.parse(putCall[1].body);
    expect(sentBody.estatus).toBe('EN_REVISION');
    expect(sentBody.asunto).toBe('Asunto editado por admin');
    expect(sentBody.mensaje).toBe('Mensaje editado en navegador');
  });

  it('QA-FE-9: OTP login blocks session creation when backend returns pendingApproval: true', async () => {
    const { state, submitLogin } = await import('../js/app.js');
    state.user = null;
    state.token = '';
    state.loginChallengeToken = 'otp-challenge-1';

    document.querySelector('#loginEmail').value = 'pendiente@subasta.mx';
    document.querySelector('#loginPassword').value = '';
    document.querySelector('#loginOtpCode').value = '123456';

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({
        success: true,
        verified: true,
        userExists: true,
        pendingApproval: true,
        user: { email: 'pendiente@subasta.mx', rol: 'COMPRADOR', estatus: 'ENVIADO' }
      })
    });

    await submitLogin(new window.Event('submit', { cancelable: true }));
    expect(state.user).toBeNull();
    expect(state.token).toBe('');
  });

  it('QA-FE-10: formatDateDDMMAAAA formats ISO and Date values into dia / mes / ano', async () => {
    const { formatDateDDMMAAAA, renderDetail } = await import('../js/app.js');
    expect(formatDateDDMMAAAA('1990-05-18')).toBe('18/05/1990');
    expect(formatDateDDMMAAAA('2024-11-25T14:30:00Z')).toBe('25/11/2024');
    expect(formatDateDDMMAAAA('05/12/1995')).toBe('05/12/1995');
    expect(formatDateDDMMAAAA(null)).toBe('—');

    const detailModal = document.querySelector('#detailContent');

    renderDetail({
      id: 1,
      tipo: 'COMPRADOR',
      folio: 'CMP-0001',
      fechaCreacion: '2024-03-15T10:00:00Z',
      datos: {
        email: 'test@subasta.mx',
        tipoPersona: 'FISICA',
        nombres: 'Juan',
        apellidoPaterno: 'Perez',
        fechaNacimiento: '1988-07-22'
      }
    }, 'COMPRADOR', 1, document);

    expect(detailModal.innerHTML).toContain('15/03/2024');
    expect(detailModal.innerHTML).toContain('22/07/1988');
  });

  it('QA-FE-11: Password validation blocks submitOnboarding and forgotStep3Submit when criteria are missing', async () => {
    const { submitOnboarding, forgotStep3Submit } = await import('../js/app.js');
    const form = document.querySelector('#onboardingForm');
    const emailInput = document.querySelector('#onboardingEmail');
    const passwordInput = document.querySelector('#onboardingPassword');

    emailInput.value = 'valida@subasta.mx';
    passwordInput.value = 'insegura'; // Sin mayúscula, número ni carácter especial

    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const event = new window.Event('submit', { cancelable: true });
    Object.defineProperty(event, 'currentTarget', { value: form });
    await submitOnboarding(event);

    // No debe llamar a fetch porque la contraseña fue rechazada en el cliente
    expect(fetchSpy).not.toHaveBeenCalled();

    // Prueba recuperación de contraseña
    const pw1 = document.querySelector('#forgotNewPassword');
    const pw2 = document.querySelector('#forgotConfirmPassword');
    pw1.value = 'SinEspecial1';
    pw2.value = 'SinEspecial1';

    await forgotStep3Submit(new window.Event('submit', { cancelable: true }));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
