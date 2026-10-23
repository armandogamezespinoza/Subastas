import { authApi } from './api/authApi.js';
import { onboardingApi } from './api/onboardingApi.js';
import { revisionApi } from './api/revisionApi.js';
import { renderKpiCards, renderStatusProgress } from './components/kpiCards.js';
import { renderRequestsTable, filterRequests } from './components/requestsTable.js';
import { resetAuthModal } from './components/authModal.js';
import { toast, setLoading, setActiveView, escapeHtml } from './services/uiService.js';

const state = {
  role: 'COMPRADOR', kpis: {}, requests: [], challengeToken: '', verifiedEmailToken: '',
  detail: null, demoMode: false
};
const $ = selector => document.querySelector(selector);

function initIcons(scope = document) {
  if (window.lucide) window.lucide.createIcons({ nodes: scope === document ? undefined : [scope] });
}
function showModal(id) { $(`#${id}`)?.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
function hideModal(id) { $(`#${id}`)?.classList.add('hidden'); if (!$('.modal-backdrop:not(.hidden)')) document.body.style.overflow = ''; }
function setRole(role) {
  state.role = role;
  document.querySelectorAll('.role-option').forEach(button => button.classList.toggle('active', button.dataset.role === role));
  renderDocumentFields();
  updatePersonFields();
}
function renderDocumentFields() {
  const docs = state.role === 'COMPRADOR'
    ? [['cd-curp','CURP'],['cd-rfc','Constancia de RFC'],['cd-dom','Comprobante de domicilio'],['cd-estado-cuenta','Estado de cuenta'],['cd-ine','Identificación oficial']]
    : [['d-ine','Identificación oficial'],['d-curp','CURP'],['d-situacion','Situación fiscal'],['d-dom','Comprobante de domicilio'],['d-estado-cuenta','Estado de cuenta'],['dm-acta','Acta constitutiva'],['dm-estatutos','Estatutos sociales'],['dm-ine-rep','INE del representante'],['v-rep-poder','Poder del representante'],['v-aut-file','Archivo de autorización']];
  $('#documentFields').innerHTML = docs.map(([name, label]) => `<label class="document-field"><i data-lucide="file-up"></i><div><span>${label}</span><small>PDF, JPG o PNG</small><input type="file" name="${name}" accept=".pdf,.jpg,.jpeg,.png"></div></label>`).join('');
  initIcons($('#documentFields'));
}
function updatePersonFields() {
  const moral = $('#tipoPersona').value === 'MORAL';
  document.querySelectorAll('[data-physical]').forEach(el => el.classList.toggle('hidden', moral));
  document.querySelectorAll('[data-legal]').forEach(el => el.classList.toggle('hidden', !moral));
  // Only required fields belonging to the visible profile are validated.
  document.querySelectorAll('[data-physical] input,[data-legal] input').forEach(input => {
    input.required = false;
  });
}
function renderKpis(data) {
  state.kpis = data || {};
  $('#kpiCards').innerHTML = renderKpiCards(state.kpis);
  $('#statusProgress').innerHTML = renderStatusProgress(state.kpis);
  $('#heroTotal').textContent = Number(state.kpis.total || 0).toLocaleString('es-MX');
  $('#heroBuyers').textContent = Number(state.kpis.totalCompradores || 0).toLocaleString('es-MX');
  $('#heroSellers').textContent = Number(state.kpis.totalVendedores || 0).toLocaleString('es-MX');
  initIcons();
}
function demoKpis() {
  return { totalCompradores: 128, totalVendedores: 86, total: 214, aprobados: 126, rechazados: 18, enRevision: 42, enviados: 28 };
}
function demoRequests() {
  return [
    { id: 101, folio: 'COM-0101', tipo: 'COMPRADOR', tipoPersona: 'FISICA', nombre: 'Mariana López', rfc: 'LOPM900514AB2', email: 'mariana.lopez@correo.mx', telefono: '667 125 8930', estatus: 'EN_REVISION', fechaCreacion: '2026-10-22T10:00:00', totalDocumentos: 4 },
    { id: 102, folio: 'VEN-0102', tipo: 'VENDEDOR', tipoPersona: 'MORAL', nombre: 'Norte Industrial S.A.', rfc: 'NIN180420KM3', email: 'contacto@norteindustrial.mx', telefono: '667 310 7742', estatus: 'ENVIADO', fechaCreacion: '2026-10-21T15:20:00', totalDocumentos: 7 },
    { id: 103, folio: 'COM-0103', tipo: 'COMPRADOR', tipoPersona: 'MORAL', nombre: 'Grupo Horizonte', rfc: 'GHO210915JK8', email: 'compras@horizonte.mx', telefono: '55 2140 9821', estatus: 'APROBADO', fechaCreacion: '2026-10-20T09:30:00', totalDocumentos: 5 },
    { id: 104, folio: 'VEN-0104', tipo: 'VENDEDOR', tipoPersona: 'FISICA', nombre: 'Daniel Reyes', rfc: 'REDL870305QF1', email: 'daniel.reyes@correo.mx', telefono: '667 450 1290', estatus: 'RECHAZADO', fechaCreacion: '2026-10-19T11:40:00', totalDocumentos: 3 },
    { id: 105, folio: 'COM-0105', tipo: 'COMPRADOR', tipoPersona: 'FISICA', nombre: 'Sofía Ramírez', rfc: 'RARS950812MJ6', email: 'sofia.ramirez@correo.mx', telefono: '667 206 4431', estatus: 'ENVIADO', fechaCreacion: '2026-10-18T12:10:00', totalDocumentos: 4 }
  ];
}
async function loadDashboard({ quiet = false } = {}) {
  try {
    const kpis = await revisionApi.getKpis();
    state.demoMode = false;
    renderKpis(kpis);
  } catch (error) {
    state.demoMode = true;
    renderKpis(demoKpis());
    if (!quiet) toast('Mostrando datos de demostración. ' + error.message, 'error');
  }
}
async function loadRequests({ quiet = false } = {}) {
  try {
    const data = await revisionApi.getRequests({ tipo: $('#typeFilter').value, estatus: $('#statusFilter').value });
    state.requests = Array.isArray(data) ? data : [];
    state.demoMode = false;
  } catch (error) {
    state.requests = demoRequests();
    state.demoMode = true;
    if (!quiet) toast('Mostrando solicitudes de ejemplo. ' + error.message, 'error');
  }
  paintRequests();
}
function paintRequests() {
  const filtered = filterRequests(state.requests, $('#searchRequests').value);
  $('#requestsTable').innerHTML = renderRequestsTable(filtered);
  $('#requestCount').textContent = `${filtered.length} ${filtered.length === 1 ? 'solicitud' : 'solicitudes'}`;
  initIcons($('#requestsTable'));
}
function setDemoDetail(item) {
  return { ...item, datos: item, documentos: [] };
}
async function openRequestDetail(type, id) {
  let item = state.requests.find(request => String(request.id) === String(id) && request.tipo === type);
  try {
    const detail = await revisionApi.getRequestDetail(type, id);
    state.detail = detail || item;
  } catch (error) {
    if (!item) { toast(error.message, 'error'); return; }
    state.detail = setDemoDetail(item);
    toast('Detalle de ejemplo: no fue posible conectar con el backend.', 'error');
  }
  renderDetail(state.detail, type, id);
  showModal('detailModal');
}
function renderDetail(detail, type, id) {
  const profile = detail.datos || detail.perfil || detail;
  const name = detail.nombre || profile.razonSocial || [profile.nombres, profile.apellidoPaterno, profile.apellidoMaterno].filter(Boolean).join(' ') || 'Perfil sin nombre';
  const entries = [
    ['Correo', profile.email], ['Teléfono', profile.telefono], ['RFC', profile.rfc],
    ['Tipo de persona', profile.tipoPersona], ['CURP', profile.curp], ['Folio', detail.folio],
    ['Fecha de registro', detail.fechaCreacion ? new Date(detail.fechaCreacion).toLocaleDateString('es-MX') : '—'],
    ['Documentos registrados', detail.totalDocumentos ?? (detail.documentos || []).length]
  ];
  $('#detailContent').innerHTML = `
    <div class="detail-title-row"><div><div class="eyebrow dark">DETALLE DE SOLICITUD</div><h2 id="detailTitle">${escapeHtml(name)}<span class="lime-period">.</span></h2><div class="detail-meta">${escapeHtml(detail.folio || `Solicitud #${id}`)} · ${type === 'VENDEDOR' ? 'Vendedor' : 'Comprador'}</div></div><span class="status-pill status-${escapeHtml(detail.estatus || 'ENVIADO')}">${escapeHtml(({ENVIADO:'Enviado',EN_REVISION:'En revisión',APROBADO:'Aprobado',RECHAZADO:'Rechazado'})[detail.estatus] || 'Sin estado')}</span></div>
    <div class="detail-info-grid">${entries.map(([label, value]) => `<div class="detail-info"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value ?? '—')}</strong></div>`).join('')}</div>
    <div class="detail-actions"><select id="newStatus" aria-label="Nuevo estado"><option value="EN_REVISION">En revisión</option><option value="APROBADO">Aprobar</option><option value="RECHAZADO">Rechazar</option></select><input id="statusReason" placeholder="Motivo (opcional)"><button class="btn btn-lime" id="saveStatus">Guardar estado <i data-lucide="check"></i></button></div>`;
  $('#saveStatus').addEventListener('click', () => updateRequestStatus(type, id));
  initIcons($('#detailContent'));
}
async function updateRequestStatus(type, id) {
  const status = $('#newStatus').value;
  const reason = $('#statusReason').value.trim();
  const button = $('#saveStatus');
  setLoading(button, true, 'Guardando...');
  try {
    await revisionApi.updateStatus(type, id, status, reason);
    toast('El estado de la solicitud se actualizó correctamente.');
    hideModal('detailModal');
    await Promise.all([loadDashboard({ quiet: true }), loadRequests({ quiet: true })]);
  } catch (error) {
    if (state.demoMode) {
      const item = state.requests.find(row => String(row.id) === String(id) && row.tipo === type);
      if (item) item.estatus = status;
      toast('Modo demostración: el cambio solo se aplicó en pantalla.');
      hideModal('detailModal');
      paintRequests();
    } else toast(error.message, 'error');
  } finally { setLoading(button, false); }
}
function collectForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const files = {};
  form.querySelectorAll('input[type="file"]').forEach(input => {
    if (input.files?.[0]) files[input.name] = input.files[0];
    delete data[input.name];
  });
  delete data[''];
  if (data.tipoPersona === 'FISICA') {
    delete data.razonSocial; delete data.fechaConstitucion;
  } else {
    delete data.nombres; delete data.apellidoPaterno; delete data.apellidoMaterno; delete data.fechaNacimiento; delete data.curp;
  }
  return { data, files };
}
async function submitOnboarding(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const { data, files } = collectForm(form);
  const button = form.querySelector('[type="submit"]');
  setLoading(button, true, 'Enviando solicitud...');
  try {
    const result = state.role === 'COMPRADOR'
      ? await onboardingApi.registerBuyer(data, files)
      : await onboardingApi.registerSeller(data, files);
    toast(`${result?.mensaje || 'Solicitud enviada correctamente'}${result?.folio ? ` · Folio ${result.folio}` : ''}`);
    form.reset(); setRole('COMPRADOR');
  } catch (error) { toast(error.message, 'error'); }
  finally { setLoading(button, false); }
}
async function submitAuth(event) {
  event.preventDefault();
  const button = $('#authSubmit');
  setLoading(button, true);
  try {
    if (!state.challengeToken) {
      const result = await authApi.sendCode($('#authEmail').value.trim());
      state.challengeToken = result?.challengeToken || '';
      if (!state.challengeToken) throw new Error('El servidor no devolvió el token de verificación.');
      $('#otpField').classList.remove('hidden');
      $('#otpCode').required = true;
      button.innerHTML = 'Verificar código <i data-lucide="arrow-right"></i>';
      toast(result?.message || 'Código enviado. Revisa tu correo.');
      $('#otpCode').focus();
    } else {
      const result = await authApi.verifyCode($('#otpCode').value.trim(), state.challengeToken);
      state.verifiedEmailToken = result?.verifiedEmailToken || '';
      toast(result?.verified ? `Correo verificado: ${result.email || $('#authEmail').value}` : 'No se pudo verificar el código.', result?.verified ? 'success' : 'error');
      if (result?.verified) { hideModal('authModal'); resetAuthModal(); state.challengeToken = ''; }
    }
  } catch (error) { toast(error.message, 'error'); }
  finally { setLoading(button, false); }
}
function bindEvents() {
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', async () => {
    const view = button.dataset.view;
    setActiveView(view);
    if (view === 'review') await loadRequests({ quiet: true });
  }));
  document.querySelectorAll('.role-option').forEach(button => button.addEventListener('click', () => setRole(button.dataset.role)));
  $('#tipoPersona').addEventListener('change', updatePersonFields);
  $('#onboardingForm').addEventListener('submit', submitOnboarding);
  $('#searchRequests').addEventListener('input', paintRequests);
  $('#typeFilter').addEventListener('change', () => loadRequests());
  $('#statusFilter').addEventListener('change', () => loadRequests());
  $('#refreshRequests').addEventListener('click', () => loadRequests());
  $('#requestsTable').addEventListener('click', event => {
    const button = event.target.closest('[data-detail-id]');
    if (button) openRequestDetail(button.dataset.detailType, button.dataset.detailId);
  });
  $('#openAuth').addEventListener('click', () => showModal('authModal'));
  $('#closeAuth').addEventListener('click', () => { hideModal('authModal'); state.challengeToken = ''; resetAuthModal(); });
  $('#closeDetail').addEventListener('click', () => hideModal('detailModal'));
  document.querySelectorAll('.modal-backdrop').forEach(modal => modal.addEventListener('click', event => { if (event.target === modal) hideModal(modal.id); }));
  $('#authForm').addEventListener('submit', submitAuth);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach(modal => hideModal(modal.id)); });
}
async function init() {
  $('#year').textContent = new Date().getFullYear();
  bindEvents(); setRole('COMPRADOR'); initIcons();
  await Promise.all([loadDashboard({ quiet: true }), loadRequests({ quiet: true })]);
  // Backend errors are surfaced once, while the polished demo state remains usable.
  if (state.demoMode) toast('Vista de demostración activa. Conecta Spring Boot en localhost:8080 para usar datos reales.', 'error');
}
init();
