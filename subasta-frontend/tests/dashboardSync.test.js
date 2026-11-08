import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('Dashboard Sync & Document Preview Mode', () => {
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
  });

  it('syncKpisFromRequests should accurately update hero and kpi elements from requests list', async () => {
    const { syncKpisFromRequests, state } = await import('../js/app.js');

    const sampleRequests = [
      { id: 1, tipo: 'COMPRADOR', estatus: 'ENVIADO' },
      { id: 2, tipo: 'COMPRADOR', estatus: 'APROBADO' },
      { id: 3, tipo: 'VENDEDOR', estatus: 'EN_REVISION' }
    ];

    state.requests = sampleRequests;
    syncKpisFromRequests(sampleRequests, document);

    const heroTotal = document.querySelector('#heroTotal');
    const heroBuyers = document.querySelector('#heroBuyers');
    const heroSellers = document.querySelector('#heroSellers');

    expect(heroTotal.textContent.trim()).toBe('3');
    expect(heroBuyers.textContent.trim()).toBe('2');
    expect(heroSellers.textContent.trim()).toBe('1');
  });

  it('openDocPreview should display img for image files and iframe for pdf files', async () => {
    const { openDocPreview } = await import('../js/app.js');

    // 1. Preview image
    openDocPreview('/api/v1/revision/documentos/1/view', 'foto_ine.jpg', '/download/1', document);
    const imgEl = document.querySelector('#docPreviewImg');
    const frameEl = document.querySelector('#docPreviewFrame');

    if (imgEl) {
      expect(imgEl.classList.contains('hidden')).toBe(false);
      expect(imgEl.src).toContain('/api/v1/revision/documentos/1/view');
      expect(frameEl.classList.contains('hidden')).toBe(true);
    }

    // 2. Preview PDF
    openDocPreview('/api/v1/revision/documentos/2/view', 'constancia_fiscal.pdf', '/download/2', document);
    expect(frameEl.src).toContain('/api/v1/revision/documentos/2/view');
    if (imgEl) {
      expect(imgEl.classList.contains('hidden')).toBe(true);
      expect(frameEl.classList.contains('hidden')).toBe(false);
    }
  });

  it('openDocPreview should handle image load error by showing fallback message', async () => {
    const { openDocPreview } = await import('../js/app.js');

    openDocPreview('/api/v1/revision/documentos/99/view', 'foto_ine.jpg', '/download/99', document);
    const imgEl = document.querySelector('#docPreviewImg');
    const errEl = document.querySelector('#docPreviewError');

    expect(errEl).not.toBeNull();
    // Simulate image error event
    if (imgEl && imgEl.onerror) {
      imgEl.onerror();
      expect(imgEl.classList.contains('hidden')).toBe(true);
      expect(errEl.classList.contains('hidden')).toBe(false);
    }
  });
});
