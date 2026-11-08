import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('Document Preview & Download in Solicitudes', () => {
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

  it('renderDetail should render document list with preview and download actions', async () => {
    const { renderDetail } = await import('../js/app.js');

    const mockDetail = {
      id: 1,
      folio: 'CMP-0001',
      tipo: 'COMPRADOR',
      estatus: 'ENVIADO',
      datos: {
        nombres: 'Carlos',
        apellidoPaterno: 'López',
        email: 'postor@subasta.mx',
        telefono: '6671234567',
        rfc: 'LOSC900515AB1',
        tipoPersona: 'FISICA',
        curp: 'LOSC900515HDFRNR01',
        estado: 'Sinaloa',
        ciudad: 'Culiacán',
        codigoPostal: '80000',
        colonia: 'Centro',
        calle: 'Álvaro Obregón 100'
      },
      documentos: [
        {
          id: 10,
          tipoDocumento: 'IDENTIFICACION_OFICIAL',
          nombreArchivo: 'ine_carlos.pdf',
          previewUrl: '/api/v1/revision/documentos/10/view',
          downloadUrl: '/api/v1/revision/documentos/10/download'
        },
        {
          id: 11,
          tipoDocumento: 'CONSTANCIA_SITUACION_FISCAL',
          nombreArchivo: 'sat_carlos.pdf',
          previewUrl: '/api/v1/revision/documentos/11/view',
          downloadUrl: '/api/v1/revision/documentos/11/download'
        }
      ]
    };

    renderDetail(mockDetail, 'COMPRADOR', 1, document);

    const detailContent = document.querySelector('#detailContent');
    expect(detailContent).not.toBeNull();

    // Check that documents are listed
    expect(detailContent.textContent).toContain('ine_carlos.pdf');
    expect(detailContent.textContent).toContain('sat_carlos.pdf');

    // Check preview and download buttons
    const previewButtons = detailContent.querySelectorAll('[data-preview-url]');
    const downloadLinks = detailContent.querySelectorAll('a[download]');

    expect(previewButtons.length).toBe(2);
    expect(downloadLinks.length).toBe(2);

  });

  it('index.html should have a document preview modal (docPreviewModal)', () => {
    const modal = document.querySelector('#docPreviewModal');
    expect(modal).not.toBeNull();
    expect(modal.querySelector('#docPreviewFrame')).not.toBeNull();
    expect(modal.querySelector('#docPreviewTitle')).not.toBeNull();
  });
});
