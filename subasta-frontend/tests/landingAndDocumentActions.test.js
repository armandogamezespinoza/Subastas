import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('Landing vs Admin Dashboard Separation & Minimalist Document Actions (TDD)', () => {
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

  it('1. Public landing page on #/ must show ONLY hero-grid, and overviewView (Todo bajo control) MUST be hidden', async () => {
    const { handleRoute, state } = await import('../js/app.js');

    state.user = null;
    state.token = null;

    handleRoute('#/', document);

    const heroGrid = document.querySelector('.hero-grid');
    const overviewView = document.querySelector('#overviewView');

    expect(heroGrid).not.toBeNull();
    expect(heroGrid.classList.contains('hidden')).toBe(false);

    // "Todo bajo control" must NOT be displayed on the public landing
    expect(overviewView).not.toBeNull();
    expect(overviewView.classList.contains('hidden')).toBe(true);
  });

  it('2. Unauthenticated access to #/overview or #/panel must be blocked and redirected to login', async () => {
    const { handleRoute, state } = await import('../js/app.js');

    state.user = null;
    state.token = null;

    const route = handleRoute('#/overview', document);

    const overviewView = document.querySelector('#overviewView');
    const loginView = document.querySelector('#loginView');

    expect(route).toBe('login');
    expect(overviewView.classList.contains('hidden')).toBe(true);
    expect(loginView.classList.contains('hidden')).toBe(false);
  });

  it('3. Authenticated Admin lands on overviewView (Home interno) with hero-grid completely hidden', async () => {
    const { handleRoute, state } = await import('../js/app.js');

    state.token = 'jwt.admin.token';
    state.user = {
      nombre: 'Administrador General',
      email: 'admin@subasta.mx',
      rol: 'ADMINISTRADOR',
      token: 'jwt.admin.token'
    };

    const route = handleRoute('#/overview', document);

    const heroGrid = document.querySelector('.hero-grid');
    const overviewView = document.querySelector('#overviewView');

    expect(route).toBe('overview');
    expect(heroGrid.classList.contains('hidden')).toBe(true);
    expect(overviewView.classList.contains('hidden')).toBe(false);
    expect(overviewView.textContent).toContain('Todo bajo control');
  });

  it('4. Document list in renderDetail must use minimalist eye and download action buttons without draft text labels', async () => {
    const { renderDetail } = await import('../js/app.js');

    const mockDetail = {
      id: 5,
      folio: 'SOL-0005',
      tipo: 'COMPRADOR',
      estatus: 'RECIBIDO',
      datos: { nombres: 'María', email: 'maria@test.com' },
      documentos: [
        { id: 21, tipoDocumento: 'RFC', nombreArchivo: 'constancia_sat.pdf', previewUrl: '/doc/21', downloadUrl: '/down/21' }
      ]
    };

    renderDetail(mockDetail, 'COMPRADOR', 5, document);
    const detailContent = document.querySelector('#detailContent');
    expect(detailContent).not.toBeNull();

    // Must NOT contain verbose draft strings
    expect(detailContent.textContent).not.toContain('Opción de pre-visualizacion');
    expect(detailContent.textContent).not.toContain('Opción de descarga');

    // Must contain minimalist buttons with proper attributes and icons
    const previewBtn = detailContent.querySelector('.doc-preview-trigger');
    const downloadBtn = detailContent.querySelector('a[download]');

    expect(previewBtn).not.toBeNull();
    expect(downloadBtn).not.toBeNull();
    expect(previewBtn.getAttribute('aria-label') || previewBtn.getAttribute('title')).toContain('Previsualizar');
    expect(downloadBtn.getAttribute('aria-label') || downloadBtn.getAttribute('title')).toContain('Descargar');
  });

  it('5. resolveDocUrl must attach ?token= parameter when session token is active', async () => {
    const { resolveDocUrl, state } = await import('../js/app.js');

    state.token = 'test.jwt.token';
    const url = resolveDocUrl('/api/v1/revision/documentos/15/view');

    expect(url).toContain('/api/v1/revision/documentos/15/view');
    expect(url).toContain('token=test.jwt.token');
  });
});

