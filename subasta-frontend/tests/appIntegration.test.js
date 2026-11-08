import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('App Integration (Address Cascading, Dynamic Required, Pre-submit Verification, Real Backend)', () => {
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

  it('should populate estados and cascade municipalities on state selection', async () => {
    const { initAddressCascade } = await import('../js/services/addressService.js');
    initAddressCascade(document);

    const estadoSelect = document.querySelector('#estadoSelect');
    const ciudadSelect = document.querySelector('#ciudadSelect');
    const cpInput = document.querySelector('#codigoPostalInput');

    expect(estadoSelect.options.length).toBeGreaterThan(30);

    // Select Sinaloa
    estadoSelect.value = 'Sinaloa';
    estadoSelect.dispatchEvent(new window.Event('change'));

    expect(ciudadSelect.disabled).toBe(false);
    expect(ciudadSelect.options.length).toBeGreaterThan(5);
    const optionTexts = Array.from(ciudadSelect.options).map(o => o.value);
    expect(optionTexts).toContain('Culiacán');
    expect(optionTexts).toContain('Mazatlán');
  });

  it('should populate CP and colonias when municipality is selected', async () => {
    const { initAddressCascade } = await import('../js/services/addressService.js');
    initAddressCascade(document);

    const estadoSelect = document.querySelector('#estadoSelect');
    const ciudadSelect = document.querySelector('#ciudadSelect');
    const cpInput = document.querySelector('#codigoPostalInput');
    const cpList = document.querySelector('#cpList');
    const colInput = document.querySelector('#coloniaInput');
    const colList = document.querySelector('#coloniaList');

    estadoSelect.value = 'Sinaloa';
    estadoSelect.dispatchEvent(new window.Event('change'));

    ciudadSelect.value = 'Culiacán';
    ciudadSelect.dispatchEvent(new window.Event('change'));

    expect(cpInput.disabled).toBe(false);
    expect(cpList.children.length).toBeGreaterThan(0);

    // User types CP 80000
    cpInput.value = '80000';
    cpInput.dispatchEvent(new window.Event('input'));

    expect(colInput.disabled).toBe(false);
    expect(colList.children.length).toBeGreaterThan(0);
    const colonias = Array.from(colList.children).map(o => o.value);
    expect(colonias.some(c => c.toLowerCase().includes('centro'))).toBe(true);
  });

  it('should toggle required attributes dynamically when changing persona type', async () => {
    const { setupPersonFieldToggles } = await import('../js/app.js');
    setupPersonFieldToggles(document);

    const tipoPersona = document.querySelector('#tipoPersona');
    const nombres = document.querySelector('[name="nombres"]');
    const curp = document.querySelector('[name="curp"]');
    const razonSocial = document.querySelector('[name="razonSocial"]');
    const fechaConstitucion = document.querySelector('[name="fechaConstitucion"]');

    // Initially FISICA
    expect(tipoPersona.value).toBe('FISICA');
    expect(nombres.required).toBe(true);
    expect(curp.required).toBe(true);
    expect(razonSocial.required).toBe(false);

    // Switch to MORAL
    tipoPersona.value = 'MORAL';
    tipoPersona.dispatchEvent(new window.Event('change'));

    expect(nombres.required).toBe(false);
    expect(curp.required).toBe(false);
    expect(razonSocial.required).toBe(true);
    expect(fechaConstitucion.required).toBe(true);
  });

  it('should render document fields with required attribute', async () => {
    const { renderDocumentFields } = await import('../js/app.js');
    renderDocumentFields('COMPRADOR', document);

    const inputs = document.querySelectorAll('#documentFields input[type="file"]');
    expect(inputs.length).toBeGreaterThan(0);
    inputs.forEach(input => {
      expect(input.required).toBe(true);
    });
  });
});
