import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('RBAC, System Roles & User Session Suite (TDD)', () => {
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

  it('1. Avatar icon ("monito") CSS should be centered with flexbox', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../css/styles.css'), 'utf-8');
    // Ensure .avatar has centering properties
    const avatarRule = css.match(/\.avatar\s*\{([^}]+)\}/);
    expect(avatarRule).not.toBeNull();
    const ruleBody = avatarRule[1];
    expect(ruleBody).toMatch(/display:\s*(inline-flex|flex|grid)/);
    expect(ruleBody).toMatch(/align-items:\s*center/);
    expect(ruleBody).toMatch(/justify-content:\s*center/);
  });

  it('2. Logout button should truly clear user session and reset UI', async () => {
    const { logout, openUserProfile, state } = await import('../js/app.js');

    // Simulate logged in user
    state.user = {
      nombre: 'Armando Gámez',
      email: 'armando@subasta.mx',
      rol: 'CONTROLER',
      folio: 'CTRL-001',
      token: 'jwt.mock.token'
    };

    // Open profile modal while logged in
    openUserProfile(document);
    const profileModal = document.querySelector('#userProfileModal');
    expect(profileModal.classList.contains('hidden')).toBe(false);

    // Call logout
    logout(document);

    // Assert session is nullified
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();

    // Modal should be hidden
    expect(profileModal.classList.contains('hidden')).toBe(true);

    // After logout, opening profile with null user should NOT populate dummy active session
    openUserProfile(document);
    // When logged out, it should either keep modal closed or show logged-out prompt
    expect(state.user).toBeNull();
  });

  it('3. System should support all 8 defined roles and verify role capabilities', async () => {
    const { ROLE_PERMISSIONS, SYSTEM_ROLES } = await import('../js/app.js');

    expect(SYSTEM_ROLES).toBeDefined();
    expect(SYSTEM_ROLES).toContain('VENDEDOR');
    expect(SYSTEM_ROLES).toContain('COMPRADOR');
    expect(SYSTEM_ROLES).toContain('OPERADOR_SUBASTA');
    expect(SYSTEM_ROLES).toContain('CONTADOR');
    expect(SYSTEM_ROLES).toContain('CONTROLER');
    expect(SYSTEM_ROLES).toContain('MODERADOR');
    expect(SYSTEM_ROLES).toContain('ADMINISTRADOR');
    expect(SYSTEM_ROLES).toContain('RESGUARDO_CIUDAD');

    // Check specific role capabilities from specification
    expect(ROLE_PERMISSIONS['VENDEDOR'].capabilities).toContain('Registrar vehiculos');
    expect(ROLE_PERMISSIONS['COMPRADOR'].capabilities).toContain('Pujar');
    expect(ROLE_PERMISSIONS['OPERADOR_SUBASTA'].capabilities).toContain('Crear subastas');
    expect(ROLE_PERMISSIONS['CONTADOR'].capabilities).toContain('Revisar la operación financiera');
    expect(ROLE_PERMISSIONS['CONTROLER'].capabilities).toContain('Revisa las altas de compradores y vendedores');
    expect(ROLE_PERMISSIONS['MODERADOR'].capabilities).toContain('Revisar contenido');
    expect(ROLE_PERMISSIONS['ADMINISTRADOR'].capabilities).toContain('Todo lo anterior');
    expect(ROLE_PERMISSIONS['RESGUARDO_CIUDAD'].capabilities).toContain('Coordinar entrega');
  });

  it('4. User profile modal should display role capabilities and design principle', async () => {
    const { openUserProfile, state } = await import('../js/app.js');

    state.user = {
      nombre: 'Elena Controler',
      email: 'elena@subasta.mx',
      rol: 'CONTROLER',
      token: 'jwt.token.controler'
    };

    openUserProfile(document);

    const capabilitiesEl = document.querySelector('#profileRoleCapabilities');
    expect(capabilitiesEl).not.toBeNull();
    expect(capabilitiesEl.textContent).toContain('Revisa las altas de compradores y vendedores');

    const principleEl = document.querySelector('#profileDesignPrinciple');
    expect(principleEl).not.toBeNull();
    expect(principleEl.textContent).toContain('La plataforma nunca actúa a nombre de un tercero con datos sin verificar');
  });

  it('5. RBAC Route Guard: Only CONTROLER and ADMINISTRADOR can access #/solicitudes', async () => {
    const { handleRoute, state } = await import('../js/app.js');

    const requestsSection = document.querySelector('#reviewView, #requestsView');
    expect(requestsSection).not.toBeNull();

    // 1) As COMPRADOR, access to solicitudes should be blocked
    state.user = { email: 'comprador@test.mx', rol: 'COMPRADOR', token: 'jwt.token' };
    handleRoute('#/solicitudes', document);
    expect(requestsSection.classList.contains('hidden')).toBe(true);

    // 2) As CONTROLER, access to solicitudes should be allowed
    state.user = { email: 'controler@test.mx', rol: 'CONTROLER', token: 'jwt.token' };
    handleRoute('#/solicitudes', document);
    expect(requestsSection.classList.contains('hidden')).toBe(false);

    // 3) As ADMINISTRADOR, access to solicitudes should be allowed
    state.user = { email: 'admin@test.mx', rol: 'ADMINISTRADOR', token: 'jwt.token' };
    handleRoute('#/solicitudes', document);
    expect(requestsSection.classList.contains('hidden')).toBe(false);
  });

  it('6. Login view provides role selection and JWT authentication for all 8 roles', () => {
    const loginView = document.querySelector('#loginView');
    expect(loginView).not.toBeNull();

    const roleSelect = loginView.querySelector('#loginRoleSelect');
    expect(roleSelect).not.toBeNull();

    const options = Array.from(roleSelect.querySelectorAll('option')).map(o => o.value);
    expect(options).toContain('VENDEDOR');
    expect(options).toContain('COMPRADOR');
    expect(options).toContain('OPERADOR_SUBASTA');
    expect(options).toContain('CONTADOR');
    expect(options).toContain('CONTROLER');
    expect(options).toContain('MODERADOR');
    expect(options).toContain('ADMINISTRADOR');
    expect(options).toContain('RESGUARDO_CIUDAD');
  });
});
