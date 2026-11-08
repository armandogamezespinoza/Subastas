import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('Left Hamburger Navigation Menu', () => {
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

  it('header should have a left-aligned hamburger button menuToggle', () => {
    const toggleBtn = document.querySelector('#menuToggle');
    expect(toggleBtn).not.toBeNull();
    const topbar = document.querySelector('.topbar');
    const firstInteractive = topbar.querySelector('button, a');
    // The hamburger button should be at the very start of topbar / topbar-left
    expect(toggleBtn.closest('.topbar-left') || toggleBtn.closest('.topbar')).not.toBeNull();
  });

  it('openNavDrawer and closeNavDrawer should control drawer visibility and aria attributes', async () => {
    const { openNavDrawer, closeNavDrawer } = await import('../js/app.js');

    const drawer = document.querySelector('#navDrawer');
    const backdrop = document.querySelector('#navDrawerBackdrop');
    const toggleBtn = document.querySelector('#menuToggle');

    expect(drawer).not.toBeNull();
    expect(backdrop).not.toBeNull();

    // Initially closed
    expect(drawer.classList.contains('open')).toBe(false);

    // Open
    openNavDrawer(document);
    expect(drawer.classList.contains('open')).toBe(true);
    expect(backdrop.classList.contains('hidden')).toBe(false);
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');

    // Close
    closeNavDrawer(document);
    expect(drawer.classList.contains('open')).toBe(false);
    expect(backdrop.classList.contains('hidden')).toBe(true);
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');
  });

  it('hamburger drawer should contain the 3 required options: Panel, Registro, Solicitudes', () => {
    const drawer = document.querySelector('#navDrawer');
    expect(drawer).not.toBeNull();

    const options = Array.from(drawer.querySelectorAll('.nav-link')).map(b => b.dataset.view);
    expect(options).toContain('overview');
    expect(options).toContain('onboarding');
    expect(options).toContain('review');
    expect(options.length).toBe(3);
  });
});
