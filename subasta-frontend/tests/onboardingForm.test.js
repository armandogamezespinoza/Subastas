import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('Onboarding Form (Address cascading, Required fields, Pre-submit Verification Code)', () => {
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

  it('should have Address fields in order: Estado first, then Ciudad/Municipio, then CP, Colonia, Calle', () => {
    const form = document.querySelector('#onboardingForm');
    expect(form).not.toBeNull();

    const estadoEl = form.querySelector('[name="estado"]');
    const ciudadEl = form.querySelector('[name="ciudad"]');
    const cpEl = form.querySelector('[name="codigoPostal"]');
    const coloniaEl = form.querySelector('[name="colonia"]');
    const calleEl = form.querySelector('[name="calle"]');

    expect(estadoEl).not.toBeNull();
    expect(ciudadEl).not.toBeNull();
    expect(cpEl).not.toBeNull();
    expect(coloniaEl).not.toBeNull();
    expect(calleEl).not.toBeNull();

    // Verify ordering in DOM: estado precedes ciudad, ciudad precedes cp, cp precedes colonia, colonia precedes calle
    const elements = [estadoEl, ciudadEl, cpEl, coloniaEl, calleEl];
    for (let i = 0; i < elements.length - 1; i++) {
      expect(elements[i].compareDocumentPosition(elements[i + 1]) & 4).toBeTruthy(); // Node.DOCUMENT_POSITION_FOLLOWING is 4
    }
  });

  it('should have ciudad as a select dropdown element for municipalities', () => {
    const ciudadEl = document.querySelector('#onboardingForm [name="ciudad"]');
    expect(ciudadEl.tagName.toLowerCase()).toBe('select');
  });

  it('should have estado as a select dropdown element with Mexican states', () => {
    const estadoEl = document.querySelector('#onboardingForm [name="estado"]');
    expect(estadoEl.tagName.toLowerCase()).toBe('select');
  });

  it('should mark all essential fields as required in HTML', () => {
    const form = document.querySelector('#onboardingForm');
    expect(form.querySelector('[name="email"]').required).toBe(true);
    expect(form.querySelector('[name="telefono"]').required).toBe(true);
    expect(form.querySelector('[name="estado"]').required).toBe(true);
    expect(form.querySelector('[name="ciudad"]').required).toBe(true);
    expect(form.querySelector('[name="codigoPostal"]').required).toBe(true);
    expect(form.querySelector('[name="colonia"]').required).toBe(true);
    expect(form.querySelector('[name="calle"]').required).toBe(true);
    expect(form.querySelector('[name="password"]').required).toBe(true);
  });

  it('should have autocomplete / datalist elements for codigoPostal, colonia, and calle', () => {
    const cpDatalist = document.querySelector('#cpList');
    const colDatalist = document.querySelector('#coloniaList');
    const calleDatalist = document.querySelector('#calleList');

    expect(cpDatalist).not.toBeNull();
    expect(colDatalist).not.toBeNull();
    expect(calleDatalist).not.toBeNull();
  });

  it('should have pre-submission email verification modal or dialog to verify code before registration', () => {
    const verifyModal = document.querySelector('#verifyModal') || document.querySelector('#authModal');
    expect(verifyModal).not.toBeNull();
  });
});
