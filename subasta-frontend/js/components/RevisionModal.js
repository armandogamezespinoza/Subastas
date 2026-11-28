// RevisionModal component – vanilla JS modal for moderator actions
// Provides: openRevisionModal(requestId, action, problematicField?)
//   action: 'approve' | 'correct' | 'reject'
//   problematicField: string (only used for 'correct')
// The modal fetches email templates from /api/v1/revision/plantillas,
// renders subject/body, allows editing, and sends via POST /api/v1/revision/plantillas/enviar.

import { revisionApi } from '../api/revisionApi.js';
import { toast } from '../services/uiService.js';

// Cache templates after first fetch
let cachedTemplates = null;

export async function openRevisionModal(requestId, action, problematicField = '') {
  try {
    // Ensure templates are loaded
    if (!cachedTemplates) {
      const list = await revisionApi.getTemplates();
      cachedTemplates = list; // expecting [{ codigo, asunto, cuerpo }]
    }

    // Determine which template code to use based on action
    const templateMap = {
      approve: 'APROBACION',
      correct: 'OBSERVACION_DOCUMENTO',
      reject: 'RECHAZO_DIRECTO'
    };
    const codigo = templateMap[action];
    const tmpl = cachedTemplates.find(t => t.codigo === codigo);
    if (!tmpl) throw new Error('Plantilla no encontrada');

    // Create modal DOM elements
    const modal = document.createElement('div');
    modal.id = 'revisionModal';
    modal.className = 'modal'; // basic styling assumed elsewhere
    // Header with action pills
    const header = document.createElement('div');
    header.className = 'modal-header';
    const pills = document.createElement('div');
    pills.className = 'pill-group';
    ['Aprobar', 'Corregir', 'Rechazar'].forEach(label => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `pill pill--${label === action ? 'solid' : 'outline'}`;
      pill.textContent = label;
      pill.addEventListener('click', () => {
        // Re-open with selected action
        modal.remove();
        openRevisionModal(requestId, label.toLowerCase(), problematicField);
      });
      pills.appendChild(pill);
    });
    header.appendChild(pills);
    modal.appendChild(header);

    // Subject input (read‑only for approve/reject, editable for correct)
    const subjectLabel = document.createElement('label');
    subjectLabel.textContent = 'Asunto';
    const subjectInput = document.createElement('input');
    subjectInput.type = 'text';
    subjectInput.value = tmpl.asunto;
    if (action !== 'correct') subjectInput.readOnly = true;
    modal.appendChild(subjectLabel);
    modal.appendChild(subjectInput);

    // Body textarea
    const bodyLabel = document.createElement('label');
    bodyLabel.textContent = 'Cuerpo del correo';
    const bodyTextarea = document.createElement('textarea');
    bodyTextarea.rows = 6;
    // Insert parameters placeholders
    let body = tmpl.cuerpo;
    // Replace placeholders for dynamic fields (folio, cuenta, etc.)
    // For simplicity we replace known placeholders with dummy values
    const params = {
      folio: `CMP-${requestId}`,
      numeroCuenta: 'XXXX-XXXX-XXXX',
      telefonoSoporte: '555-1234',
      nombreCliente: 'Cliente',
      campo: problematicField
    };
    // Simple placeholder replacement using {{key}}
    Object.entries(params).forEach(([k, v]) => {
      const re = new RegExp(`{${k}}`, 'g');
      body = body.replace(re, v);
    });
    bodyTextarea.textContent = body;
    if (action !== 'correct') bodyTextarea.readOnly = true;
    modal.appendChild(bodyLabel);
    modal.appendChild(bodyTextarea);

    // Action buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'modal-actions';
    const sendBtn = document.createElement('button');
    sendBtn.type = 'button';
    sendBtn.className = 'pill pill--solid';
    sendBtn.textContent = 'Enviar';
    sendBtn.addEventListener('click', async () => {
      try {
        const payload = {
          codigo,
          parametros: params,
          asunto: subjectInput.value,
          mensaje: bodyTextarea.value,
          solicitudId: requestId
        };
        await revisionApi.sendEmail(payload);
        toast('Correo enviado correctamente');
        modal.remove();
      } catch (err) {
        toast(err.message || 'Error al enviar correo', 'error');
      }
    });
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'pill pill--outline';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => modal.remove());
    actionsDiv.appendChild(sendBtn);
    actionsDiv.appendChild(cancelBtn);
    modal.appendChild(actionsDiv);

    // Append modal to body
    document.body.appendChild(modal);
    // Focus first editable field
    if (action === 'correct') {
      subjectInput.focus();
    } else {
      bodyTextarea.focus();
    }
  } catch (e) {
    toast(e.message || 'Error al abrir modal de revisión', 'error');
  }
}

// Expose for testing
export const __internal = { setCache: v => (cachedTemplates = v) };

