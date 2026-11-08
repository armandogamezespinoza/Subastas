import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('Auth, Routing & User Profile Card', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
    dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/#/' });
    document = dom.window.document;
    window = dom.window;
    global.window = window;
    global.document = document;
  });

  it('1. should NOT contain "sistema operativo" anywhere in the document', () => {
    const bodyText = document.body.textContent.toLowerCase();
    expect(bodyText).not.toContain('sistema operativo');
  });

  it('2. router should support routes: landing/overview, login, registro, solicitudes', async () => {
    const { handleRoute, setActiveView } = await import('../js/app.js');

    // Route to login
    handleRoute('#/login', document);
    const loginSection = document.querySelector('#loginView');
    expect(loginSection).not.toBeNull();
    expect(loginSection.classList.contains('hidden')).toBe(false);

    // Route to registro
    handleRoute('#/registro', document);
    const onboardingSection = document.querySelector('#onboardingView');
    expect(onboardingSection.classList.contains('hidden')).toBe(false);
    expect(loginSection.classList.contains('hidden')).toBe(true);

    // Route to home / landing
    handleRoute('#/', document);
    const heroSection = document.querySelector('.hero-grid');
    expect(heroSection).not.toBeNull();
  });

  it('3. hero "Crear una cuenta" button should direct to login or registration route', () => {
    const ctaBtn = document.querySelector('.hero-actions [data-route], .hero-actions [data-view]');
    expect(ctaBtn).not.toBeNull();
    const route = ctaBtn.dataset.route || ctaBtn.dataset.view;
    expect(['login', 'registro', 'onboarding', '#/login', '#/registro']).toContain(route);
  });

  it('4. login view should provide options for email OTP code and account creation', () => {
    const loginView = document.querySelector('#loginView');
    expect(loginView).not.toBeNull();

    // Check login email input and submit
    const loginEmail = loginView.querySelector('#loginEmail');
    const sendCodeBtn = loginView.querySelector('#loginSendCodeBtn, #loginSubmitBtn');
    expect(loginEmail).not.toBeNull();
    expect(sendCodeBtn).not.toBeNull();

    // Check link/button to switch or go to registration
    const toRegisterBtn = loginView.querySelector('[data-route="registro"], [data-view="onboarding"], #toRegisterTab');
    expect(toRegisterBtn).not.toBeNull();
  });

  it('5. top-right user button should open user profile card when clicked', async () => {
    const { openUserProfile, closeUserProfile, state } = await import('../js/app.js');

    // Set an active mock user session
    state.user = {
      nombre: 'Carlos Mendoza',
      email: 'carlos@empresa.com',
      rol: 'COMPRADOR',
      folio: 'CMP-0042',
      estatus: 'APROBADO'
    };

    openUserProfile(document);
    const profileModal = document.querySelector('#userProfileModal, #userProfileCard');
    expect(profileModal).not.toBeNull();
    expect(profileModal.classList.contains('hidden')).toBe(false);

    // Profile card should render user details
    const userNameEl = profileModal.querySelector('#profileUserName');
    const userEmailEl = profileModal.querySelector('#profileUserEmail');
    const userFolioEl = profileModal.querySelector('#profileUserFolio');
    const logoutBtn = profileModal.querySelector('#logoutBtn');
    const updateRequestBtn = profileModal.querySelector('#updateProfileRequestBtn');

    expect(userNameEl.textContent).toContain('Carlos Mendoza');
    expect(userEmailEl.textContent).toContain('carlos@empresa.com');
    expect(userFolioEl.textContent).toContain('CMP-0042');
    expect(logoutBtn).not.toBeNull();
    expect(updateRequestBtn).not.toBeNull();

    closeUserProfile(document);
    expect(profileModal.classList.contains('hidden')).toBe(true);
  });
});
