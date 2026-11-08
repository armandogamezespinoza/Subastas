import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('Pre-submit Verification Workflow', () => {
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

  it('should have verifyModal elements with email display, OTP input and submit button', () => {
    const modal = document.querySelector('#verifyModal');
    expect(modal).not.toBeNull();
    expect(document.querySelector('#verifyEmailDisplay')).not.toBeNull();
    expect(document.querySelector('#verifyOtpCode')).not.toBeNull();
    expect(document.querySelector('#confirmVerifyBtn')).not.toBeNull();
    expect(document.querySelector('#resendVerifyCodeBtn')).not.toBeNull();
  });

  it('email input should have a verification badge', () => {
    const badge = document.querySelector('#emailVerifyBadge');
    expect(badge).not.toBeNull();
    expect(badge.textContent.toLowerCase()).toContain('código');
  });
});
