import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('Protected Routes, JWT Role Extraction & Session Middleware (TDD)', () => {
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

  it('1. parseJwtPayload should decode claims and normalize ADMIN to ADMINISTRADOR', async () => {
    const { parseJwtPayload } = await import('../js/app.js');

    expect(typeof parseJwtPayload).toBe('function');

    // Create a mock base64url payload with rol: 'ADMIN'
    const payload = {
      sub: 'admin@subasta.mx',
      rol: 'admin',
      type: 'ACCESS_TOKEN',
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    const base64Url = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const fakeToken = `eyJhbGciOiJIUzI1NiJ9.${base64Url}.fakesignature`;

    const claims = parseJwtPayload(fakeToken);
    expect(claims).not.toBeNull();
    expect(claims.sub).toBe('admin@subasta.mx');
    expect(claims.rol).toBe('ADMINISTRADOR');
  });

  it('2. isTokenValid should return true for valid tokens and false for expired ones', async () => {
    const { isTokenValid } = await import('../js/app.js');

    expect(typeof isTokenValid).toBe('function');

    // Future token
    const futurePayload = { exp: Math.floor(Date.now() / 1000) + 1800, rol: 'ADMINISTRADOR' };
    const validToken = `h.${Buffer.from(JSON.stringify(futurePayload)).toString('base64url')}.s`;
    expect(isTokenValid(validToken)).toBe(true);

    // Expired token (10 minutes ago)
    const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 600, rol: 'ADMINISTRADOR' };
    const expiredToken = `h.${Buffer.from(JSON.stringify(expiredPayload)).toString('base64url')}.s`;
    expect(isTokenValid(expiredToken)).toBe(false);

    expect(isTokenValid('')).toBe(false);
    expect(isTokenValid(null)).toBe(false);
  });

  it('3. Unauthenticated users see the landing hero on #/ and are blocked from #/solicitudes', async () => {
    const { handleRoute, state } = await import('../js/app.js');

    // Ensure session is clear
    state.user = null;
    state.token = null;

    // Root route should display hero
    handleRoute('#/', document);
    const heroGrid = document.querySelector('.hero-grid');
    expect(heroGrid).not.toBeNull();
    expect(heroGrid.classList.contains('hidden')).toBe(false);

    // Trying to access #/solicitudes without session should block access and keep review hidden
    const routeResult = handleRoute('#/solicitudes', document);
    const reviewView = document.querySelector('#reviewView');
    expect(reviewView.classList.contains('hidden')).toBe(true);
    expect(['login', 'overview']).toContain(routeResult);
  });

  it('4. Authenticated users with valid JWT must NOT see public landing page and are redirected to panel', async () => {
    const { handleRoute, state } = await import('../js/app.js');

    // Active session for a Buyer
    state.token = 'jwt.token.buyer';
    state.user = {
      nombre: 'Juan Comprador',
      email: 'juan@test.com',
      rol: 'COMPRADOR',
      token: 'jwt.token.buyer'
    };

    // Navigating to root #/ must hide hero-grid and show panel
    handleRoute('#/', document);
    const heroGrid = document.querySelector('.hero-grid');
    expect(heroGrid.classList.contains('hidden')).toBe(true);
    const overviewView = document.querySelector('#overviewView');
    expect(overviewView.classList.contains('hidden')).toBe(false);

    // Navigating to #/login with an active session redirects away from login
    handleRoute('#/login', document);
    const loginView = document.querySelector('#loginView');
    expect(loginView.classList.contains('hidden')).toBe(true);
    expect(heroGrid.classList.contains('hidden')).toBe(true);
  });

  it('5. Admin / Aprobador created in DB with "admin" or "ADMIN" has elevated access and auto-redirects to solicitudes', async () => {
    const { handleRoute, state, updateUserAvatar, ROLE_PERMISSIONS } = await import('../js/app.js');

    // Admin created in DB with role 'ADMIN'
    state.token = 'jwt.token.admin';
    state.user = {
      nombre: 'Admin Database',
      email: 'admin@subasta.mx',
      rol: 'ADMIN',
      token: 'jwt.token.admin'
    };

    // Verify ROLE_PERMISSIONS recognizes 'ADMIN' (same as ADMINISTRADOR)
    expect(ROLE_PERMISSIONS['ADMIN']?.canAccessSolicitudes).toBe(true);

    // On root navigation, admin is redirected to #/solicitudes / review panel
    const target = handleRoute('#/', document);
    expect(['review', 'solicitudes', 'overview']).toContain(target);

    // Hero-grid must be hidden for admin
    const heroGrid = document.querySelector('.hero-grid');
    expect(heroGrid.classList.contains('hidden')).toBe(true);

    // Solicitudes section is accessible
    handleRoute('#/solicitudes', document);
    const reviewView = document.querySelector('#reviewView');
    expect(reviewView.classList.contains('hidden')).toBe(false);

    // Hamburger button is visible for admin
    updateUserAvatar(document);
    const hamburger = document.querySelector('#menuToggle');
    expect(hamburger.classList.contains('hidden')).toBe(false);
  });

  it('6. client.js request attaches Authorization header automatically when token is present', async () => {
    const { request, getApiBaseUrl } = await import('../js/api/client.js');

    // Mock global fetch
    const originalFetch = global.fetch;
    let interceptedHeaders = null;

    global.fetch = vi.fn().mockImplementation((url, config) => {
      interceptedHeaders = config?.headers;
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: true, data: [] })
      });
    });

    try {
      // Simulate stored token
      const mockToken = 'mock.jwt.bearer.token';
      const result = await request('/revision/solicitudes', { token: mockToken });
      expect(result).toBeDefined();
      expect(interceptedHeaders).not.toBeNull();
      expect(interceptedHeaders['Authorization']).toBe(`Bearer ${mockToken}`);
    } finally {
      global.fetch = originalFetch;
    }
  });
});

