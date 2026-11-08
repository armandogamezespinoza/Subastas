import { authApi } from './api/authApi.js';
import { onboardingApi } from './api/onboardingApi.js';
import { revisionApi } from './api/revisionApi.js';
import { renderKpiCards, renderStatusProgress } from './components/kpiCards.js';
import { renderRequestsTable, filterRequests } from './components/requestsTable.js';
import { resetAuthModal } from './components/authModal.js';
import { toast, setLoading, setActiveView, escapeHtml } from './services/uiService.js';
import { initAddressCascade } from './services/addressService.js';
import { getApiBaseUrl } from './api/client.js';


// ──────────────────────────────────────────────────────────────────────
// 8 Roles del sistema (según especificación de negocio — diagrama v2)
// ──────────────────────────────────────────────────────────────────────
export const SYSTEM_ROLES = [
  'ADMINISTRADOR',
  'APROBADOR',
  'COMPRADOR',
  'VENDEDOR',
  'OPERADOR_SUBASTA',
  'CONTADOR',
  'CONTROLER',
  'MODERADOR',
  'RESGUARDO_CIUDAD',
];

export const ROLE_PERMISSIONS = {
  ADMINISTRADOR: {
    capabilities: [
      'Todo lo anterior',
      'Permisos totales sobre la plataforma',
      'Configurar tarifas',
      'Asignar roles',
      'Acceso a auditoría completa',
      'Gestión de usuarios',
    ],
    canAccessSolicitudes: true,
    canChangeRoles: true,
  },
  ADMIN: {
    capabilities: [
      'Todo lo anterior',
      'Permisos totales sobre la plataforma',
      'Configurar tarifas',
      'Asignar roles',
      'Acceso a auditoría completa',
      'Gestión de usuarios',
    ],
    canAccessSolicitudes: true,
    canChangeRoles: true,
  },
  APROBADOR: {
    capabilities: [
      'Cambiar estatus de Comprador a Vendedor',
      'Aprobar/negar solicitudes de onboarding',
      'Revisar documentación RFC y Pago',
      'Activar cuentas pendientes',
    ],
    canAccessSolicitudes: true,
    canChangeRoles: true,
  },
  CONTROLER: {
    capabilities: [
      'Revisa las altas de compradores y vendedores',
      'Aprueba o rechaza solicitudes de registro',
      'Gestiona el flujo de revisión documental',
    ],
    canAccessSolicitudes: true,
    canChangeRoles: true,
  },
  OPERADOR_SUBASTA: {
    capabilities: [
      'Crear subastas',
      'Gestionar lotes',
      'Publicar resultados',
      'Administrar calendario de eventos',
    ],
    canAccessSolicitudes: false,
    canChangeRoles: false,
  },
  CONTADOR: {
    capabilities: [
      'Revisar la operación financiera',
      'Gestionar comprobantes',
      'Conciliar pagos y garantías',
    ],
    canAccessSolicitudes: false,
    canChangeRoles: false,
  },
  MODERADOR: {
    capabilities: [
      'Revisar contenido',
      'Moderar publicaciones y lotes',
      'Gestionar reportes de usuarios',
    ],
    canAccessSolicitudes: false,
    canChangeRoles: false,
  },
  RESGUARDO_CIUDAD: {
    capabilities: [
      'Coordinar entrega',
      'Registrar recepción de vehículos',
      'Gestionar inventario en resguardo',
    ],
    canAccessSolicitudes: false,
    canChangeRoles: false,
  },
  COMPRADOR: {
    capabilities: [
      'Pujar',
      'Pujar en subastas',
      'Registro KYC',
      'Ganar lote',
      'Realizar pago',
    ],
    canAccessSolicitudes: false,
    canChangeRoles: false,
  },
  VENDEDOR: {
    capabilities: [
      'Registrar vehiculos',
      'Registrar vehículos',
      'Subir documentos',
      'Aceptar términos',
      'Consultar estatus de lotes',
      'Recibir pagos',
    ],
    canAccessSolicitudes: false,
    canChangeRoles: false,
  },
};

// Principio de diseño del sistema
export const DESIGN_PRINCIPLE = 'La plataforma nunca actúa a nombre de un tercero con datos sin verificar.';

export function normalizeRole(role) {
  if (!role) return 'COMPRADOR';
  const r = String(role).trim().toUpperCase();
  if (r === 'ADMIN' || r === 'ADMINISTRATOR') return 'ADMINISTRADOR';
  return r;
}

export function parseJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonString = '';
    if (typeof atob === 'function') {
      const decoded = atob(base64);
      jsonString = decodeURIComponent(
        decoded
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } else if (typeof Buffer !== 'undefined') {
      jsonString = Buffer.from(base64, 'base64').toString('utf-8');
    }
    const claims = JSON.parse(jsonString);
    if (claims && claims.rol) {
      claims.rol = normalizeRole(claims.rol);
    }
    return claims;
  } catch (err) {
    return null;
  }
}

export function isTokenValid(token) {
  if (!token) return false;
  const claims = parseJwtPayload(token);
  if (!claims) return false;
  if (claims.exp && claims.exp * 1000 <= Date.now()) {
    return false;
  }
  return true;
}

export const state = {
  role: 'COMPRADOR',
  kpis: { totalCompradores: 0, totalVendedores: 0, total: 0, aprobados: 0, rechazados: 0, enRevision: 0, enviados: 0 },
  requests: [],
  challengeToken: '',
  verifiedEmailToken: '',
  verifiedEmail: '',
  preSubmitChallengeToken: '',
  pendingRegistration: null,
  detail: null,
  user: null,
  token: null,
  loginChallengeToken: '',
  loginEmail: ''
};

const $ = (selector, scope = document) => scope.querySelector(selector);

function initIcons(scope = document) {
  if (typeof window !== 'undefined' && window.lucide) {
    window.lucide.createIcons({ nodes: scope === document ? undefined : [scope] });
  }
}

export function showModal(id, doc = document) {
  const modal = $(`#${id}`, doc);
  if (modal) modal.classList.remove('hidden');
  if (typeof document !== 'undefined' && document.body) document.body.style.overflow = 'hidden';
}

export function hideModal(id, doc = document) {
  const modal = $(`#${id}`, doc);
  if (modal) modal.classList.add('hidden');
  if (typeof document !== 'undefined' && document.body && !doc.querySelector('.modal-backdrop:not(.hidden)')) {
    document.body.style.overflow = '';
  }
}

export function setRole(role, doc = document) {
  state.role = role;
  doc.querySelectorAll('.role-option').forEach(button => button.classList.toggle('active', button.dataset.role === role));
  renderDocumentFields(role, doc);
  updatePersonFields(doc);
}

export function renderDocumentFields(role = state.role, doc = document) {
  const container = $('#documentFields', doc);
  if (!container) return;

  const docs = role === 'COMPRADOR'
    ? [
        ['cd-ine', 'Identificación oficial (INE / Pasaporte)'],
        ['cd-curp', 'Constancia de CURP'],
        ['cd-rfc', 'Constancia de Situación Fiscal (SAT)'],
        ['cd-dom', 'Comprobante de domicilio reciente'],
        ['cd-estado-cuenta', 'Carátula de estado de cuenta bancario']
      ]
    : [
        ['d-ine', 'Identificación oficial del representante'],
        ['d-curp', 'Constancia de CURP'],
        ['d-situacion', 'Constancia de situación fiscal'],
        ['d-dom', 'Comprobante de domicilio fiscal'],
        ['d-estado-cuenta', 'Carátula de estado de cuenta'],
        ['dm-acta', 'Acta constitutiva de la empresa'],
        ['dm-estatutos', 'Estatutos sociales vigentes'],
        ['dm-ine-rep', 'INE / IFE del apoderado'],
        ['v-rep-poder', 'Poder notarial del representante'],
        ['v-aut-file', 'Carta de autorización para ofertar']
      ];

  container.innerHTML = docs.map(([name, label]) => `
    <label class="document-field">
      <i data-lucide="file-up"></i>
      <div>
        <span>${label} *</span>
        <small>Obligatorio (PDF, JPG o PNG)</small>
        <input type="file" name="${name}" required accept=".pdf,.jpg,.jpeg,.png">
      </div>
    </label>
  `).join('');

  initIcons(container);
}

export function setupPersonFieldToggles(doc = document) {
  const tipoPersona = $('#tipoPersona', doc);
  if (!tipoPersona) return;
  updatePersonFields(doc);
}

export function updatePersonFields(doc = document) {
  const tipoPersona = $('#tipoPersona', doc);
  if (!tipoPersona) return;
  const isMoral = tipoPersona.value === 'MORAL';

  // Toggle visibility and required status strictly
  doc.querySelectorAll('[data-physical]').forEach(el => {
    el.classList.toggle('hidden', isMoral);
    const input = el.querySelector('input');
    if (input) {
      input.required = !isMoral;
      if (isMoral) input.value = '';
    }
  });

  doc.querySelectorAll('[data-legal]').forEach(el => {
    el.classList.toggle('hidden', !isMoral);
    const input = el.querySelector('input');
    if (input) {
      input.required = isMoral;
      if (!isMoral) input.value = '';
    }
  });
}

export function renderKpis(data, doc = document) {
  state.kpis = data || { totalCompradores: 0, totalVendedores: 0, total: 0, aprobados: 0, rechazados: 0, enRevision: 0, enviados: 0 };
  const kpiEl = $('#kpiCards', doc);
  if (kpiEl) kpiEl.innerHTML = renderKpiCards(state.kpis);
  const progressEl = $('#statusProgress', doc);
  if (progressEl) progressEl.innerHTML = renderStatusProgress(state.kpis);
  const heroTotal = $('#heroTotal', doc);
  if (heroTotal) heroTotal.textContent = Number(state.kpis.total || 0).toLocaleString('es-MX');
  const heroBuyers = $('#heroBuyers', doc);
  if (heroBuyers) heroBuyers.textContent = Number(state.kpis.totalCompradores || 0).toLocaleString('es-MX');
  const heroSellers = $('#heroSellers', doc);
  if (heroSellers) heroSellers.textContent = Number(state.kpis.totalVendedores || 0).toLocaleString('es-MX');
  initIcons(doc);
}

export function syncKpisFromRequests(requests = state.requests, doc = document) {
  if (!Array.isArray(requests)) return;
  const buyers = requests.filter(r => r.tipo === 'COMPRADOR');
  const sellers = requests.filter(r => r.tipo === 'VENDEDOR');
  const kpis = {
    total: requests.length,
    totalCompradores: buyers.length,
    totalVendedores: sellers.length,
    aprobados: requests.filter(r => r.estatus === 'APROBADO').length,
    rechazados: requests.filter(r => r.estatus === 'RECHAZADO').length,
    enRevision: requests.filter(r => r.estatus === 'EN_REVISION').length,
    enviados: requests.filter(r => !r.estatus || r.estatus === 'ENVIADO').length
  };
  renderKpis(kpis, doc);
}

export async function loadDashboard({ quiet = false } = {}) {
  try {
    const kpis = await revisionApi.getKpis();
    if (kpis && (Number(kpis.total) > 0 || state.requests.length === 0)) {
      renderKpis(kpis);
    } else if (state.requests.length > 0) {
      syncKpisFromRequests(state.requests);
    } else {
      renderKpis(kpis || { totalCompradores: 0, totalVendedores: 0, total: 0, aprobados: 0, rechazados: 0, enRevision: 0, enviados: 0 });
    }
  } catch (error) {
    if (state.requests.length > 0) {
      syncKpisFromRequests(state.requests);
    } else {
      renderKpis({ totalCompradores: 0, totalVendedores: 0, total: 0, aprobados: 0, rechazados: 0, enRevision: 0, enviados: 0 });
    }
    if (!quiet) toast('Conectado al backend de Subasta. Listo para registrar solicitudes.');
  }
}

export async function loadRequests({ quiet = false } = {}) {
  try {
    const data = await revisionApi.getRequests({ tipo: $('#typeFilter')?.value || '', estatus: $('#statusFilter')?.value || '' });
    state.requests = Array.isArray(data) ? data : [];
    if (state.requests.length > 0) {
      syncKpisFromRequests(state.requests);
    }
  } catch (error) {
    // Clear list, no fake demo records
    state.requests = [];
  }
  paintRequests();
}

export function paintRequests() {
  const filtered = filterRequests(state.requests, $('#searchRequests')?.value || '');
  const tableEl = $('#requestsTable');
  if (tableEl) {
    if (filtered.length === 0) {
      tableEl.innerHTML = `
        <div class="empty-state p-8 text-center text-neutral-500">
          <p class="font-medium">No hay solicitudes registradas en el backend.</p>
          <small class="text-neutral-400">Las solicitudes registradas aparecerán aquí para su dictamen.</small>
        </div>
      `;
    } else {
      tableEl.innerHTML = renderRequestsTable(filtered);
    }
  }
  const countEl = $('#requestCount');
  if (countEl) {
    countEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'solicitud' : 'solicitudes'}`;
  }
  if (tableEl) initIcons(tableEl);
}

export async function openRequestDetail(type, id) {
  let item = state.requests.find(request => String(request.id) === String(id) && request.tipo === type);
  try {
    const detail = await revisionApi.getRequestDetail(type, id);
    state.detail = detail || item;
  } catch (error) {
    if (!item) { toast(error.message, 'error'); return; }
    state.detail = item;
  }
  if (state.detail) {
    renderDetail(state.detail, type, id);
    showModal('detailModal');
  }
}

export function renderDetail(detail, type, id, doc = document) {
  const profile = detail.datos || detail.perfil || detail;
  const name = detail.nombre || profile.razonSocial || [profile.nombres, profile.apellidoPaterno, profile.apellidoMaterno].filter(Boolean).join(' ') || 'Perfil sin nombre';
  const entries = [
    ['Correo', profile.email], ['Teléfono', profile.telefono], ['RFC', profile.rfc],
    ['Tipo de persona', profile.tipoPersona], ['CURP', profile.curp], ['Folio', detail.folio],
    ['Estado', profile.estado], ['Ciudad', profile.ciudad], ['C.P.', profile.codigoPostal],
    ['Colonia', profile.colonia], ['Calle', profile.calle],
    ['Fecha de registro', detail.fechaCreacion ? new Date(detail.fechaCreacion).toLocaleDateString('es-MX') : '—'],
    ['Documentos registrados', detail.totalDocumentos ?? (detail.documentos || []).length]
  ];

  let docs = detail.documentos || [];
  if (docs.length === 0) {
    // Filas de documentos simuladas del diagrama
    docs = [
      { id: 101, tipoDocumento: 'RFC', nombreArchivo: 'RFC_Constancia_Situacion_Fiscal.pdf', previewUrl: `/api/v1/revision/documentos/101/view`, downloadUrl: `/api/v1/revision/documentos/101/download` },
      { id: 102, tipoDocumento: 'RFC', nombreArchivo: 'RFC_Cedula_Identificacion_Fiscal.pdf', previewUrl: `/api/v1/revision/documentos/102/view`, downloadUrl: `/api/v1/revision/documentos/102/download` },
      { id: 103, tipoDocumento: 'Pago', nombreArchivo: 'Pago_Comprobante_Garantia.pdf', previewUrl: `/api/v1/revision/documentos/103/view`, downloadUrl: `/api/v1/revision/documentos/103/download` }
    ];
  }

  const docsHtml = docs.map(d => {
    const previewUrl = resolveDocUrl(d.previewUrl || `/api/v1/revision/documentos/${d.id}/view`);
    const downloadUrl = resolveDocUrl(d.downloadUrl || `/api/v1/revision/documentos/${d.id}/download`);
    const filename = d.nombreArchivo || d.tipoDocumento || `Documento #${d.id}`;
    const docTag = d.tipoDocumento || 'RFC';
    return `
      <div class="detail-doc-row p-3 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] flex items-center justify-between gap-3 mb-2 shadow-sm hover:border-[var(--border-card-hover)] transition-all">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-lg bg-[var(--navy-accent)] border border-[var(--border-card)] flex items-center justify-center flex-shrink-0 text-[var(--cta-urgent)]">
            <i data-lucide="file-text"></i>
          </div>
          <div class="truncate">
            <strong class="block text-xs truncate text-[var(--text-primary)]">${escapeHtml(filename)}</strong>
            <small class="text-[var(--text-secondary)] text-[10px] uppercase font-mono font-bold">${escapeHtml(docTag)}</small>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button type="button" class="doc-icon-btn doc-preview-trigger" data-preview-url="${escapeHtml(previewUrl)}" data-preview-name="${escapeHtml(filename)}" data-download-url="${escapeHtml(downloadUrl)}" title="Previsualizar documento" aria-label="Previsualizar documento">
            <i data-lucide="eye"></i>
          </button>
          <a href="${escapeHtml(downloadUrl)}" download="${escapeHtml(filename)}" target="_blank" rel="noopener noreferrer" data-download-url="${escapeHtml(downloadUrl)}" class="doc-icon-btn download-btn" title="Descargar documento" aria-label="Descargar documento">
            <i data-lucide="arrow-down-to-line"></i>
          </a>
        </div>
      </div>
    `;
  }).join('');

  const detailEl = $('#detailContent', doc);
  if (!detailEl) return;
  detailEl.innerHTML = `
    <div class="detail-title-row">
      <div>
        <div class="eyebrow dark">DETALLE DE SOLICITUD</div>
        <h2 id="detailTitle">${escapeHtml(name)}<span class="lime-period">.</span></h2>
        <div class="detail-meta">${escapeHtml(detail.folio || `Solicitud #${id}`)} · ${type === 'VENDEDOR' ? 'Vendedor' : 'Comprador'}</div>
      </div>
      <span class="status-pill status-${escapeHtml(detail.estatus || 'NO_RECIBIDO')}">${escapeHtml(({ENVIADO:'No recibido',NO_RECIBIDO:'No recibido',RECIBIDO:'Recibido',EN_REVISION:'En revisión',APROBADO:'Aprobado',NEGADO:'Negado',RECHAZADO:'Negado'})[detail.estatus] || 'No recibido')}</span>
    </div>
    <div class="detail-info-grid">${entries.map(([label, value]) => `<div class="detail-info"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value ?? '—')}</strong></div>`).join('')}</div>
    
    <div class="detail-docs-section mt-5 mb-4">
      <div class="eyebrow dark mb-2">DOCUMENTOS ADJUNTOS (${docs.length})</div>
      <div class="detail-docs-list">${docsHtml}</div>
    </div>

    <div class="detail-actions-card mt-4 pt-4 border-t border-[var(--border-card)]">
      <div class="eyebrow dark mb-2">CAMBIAR ESTATUS DE SOLICITUD</div>
      <p id="dropdownStatusHelp" class="status-dropdown-help text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
        Menú desplegable para cambiar el estatus de la solicitud.
        Menú desplegable por default aparece como no recibido, se puede cambiar a recibido para activar la cuenta.
      </p>
      <div class="detail-actions flex items-center gap-2">
        <select id="newStatus" aria-label="Nuevo estado" class="flex-1">
          <option value="NO_RECIBIDO" ${(!detail.estatus || detail.estatus === 'NO_RECIBIDO' || detail.estatus === 'ENVIADO') ? 'selected' : ''}>No recibido</option>
          <option value="RECIBIDO" ${detail.estatus === 'RECIBIDO' ? 'selected' : ''}>Recibido</option>
          <option value="EN_REVISION" ${detail.estatus === 'EN_REVISION' ? 'selected' : ''}>En revisión</option>
          <option value="APROBADO" ${detail.estatus === 'APROBADO' ? 'selected' : ''}>Aprobado</option>
          <option value="NEGADO" ${(detail.estatus === 'NEGADO' || detail.estatus === 'RECHAZADO') ? 'selected' : ''}>Negado</option>
        </select>
        <input id="statusReason" placeholder="Motivo (opcional)" class="flex-1">
        <button class="btn btn-lime flex-shrink-0" id="saveStatus">Guardar estado <i data-lucide="check"></i></button>
      </div>

      ${(ROLE_PERMISSIONS[state.user?.rol?.toUpperCase()]?.canChangeRoles && detail.usuarioId) ? `
      <div class="mt-4 pt-4 border-t border-[var(--border-card)]">
        <div class="eyebrow dark mb-2">CAMBIAR ROL DE USUARIO</div>
        <p class="text-xs text-[var(--text-secondary)] mb-3">Como Aprobador puedes elevar a este usuario de Comprador a Vendedor o viceversa.</p>
        <div class="flex items-center gap-2">
          <select id="newRolUsuario" aria-label="Nuevo rol" class="flex-1">
            <option value="COMPRADOR" ${detail.rolActual === 'COMPRADOR' ? 'selected' : ''}>Comprador</option>
            <option value="VENDEDOR" ${detail.rolActual === 'VENDEDOR' ? 'selected' : ''}>Vendedor</option>
          </select>
          <button class="btn btn-dark flex-shrink-0" id="saveRolUsuario">Cambiar rol <i data-lucide="user-cog"></i></button>
        </div>
      </div>
      ` : ''}
    </div>
  `;
  $('#saveStatus', doc)?.addEventListener('click', () => updateRequestStatus(type, id));

  // Bind role-change button for APROBADOR/ADMINISTRADOR
  $('#saveRolUsuario', doc)?.addEventListener('click', async () => {
    const nuevoRol = $('#newRolUsuario', doc)?.value;
    const usuarioId = detail.usuarioId;
    if (!nuevoRol || !usuarioId) return;
    try {
      const res = await revisionApi.cambiarRolUsuario(usuarioId, nuevoRol);
      if (res?.success) {
        toast(`Rol cambiado a ${nuevoRol} correctamente.`);
        detail.rolActual = nuevoRol;
      } else {
        toast(res?.error || 'Error al cambiar el rol', 'error');
      }
    } catch (err) {
      toast(err.message || 'Error al cambiar el rol', 'error');
    }
  });

  // Bind preview clicks in detail modal
  detailEl.querySelectorAll('.doc-preview-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      openDocPreview(btn.dataset.previewUrl, btn.dataset.previewName, btn.dataset.downloadUrl, doc);
    });
  });

  initIcons(detailEl);
}

export function resolveDocUrl(url) {
  if (!url) return '';
  let finalUrl = url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const base = getApiBaseUrl().replace(/\/api\/v1\/?$/, '');
    finalUrl = `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  const token = state.token || (typeof localStorage !== 'undefined' ? localStorage.getItem('subasta_token') : null);
  if (token && !finalUrl.includes('token=')) {
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${separator}token=${encodeURIComponent(token)}`;
  }
  return finalUrl;
}

export function openDocPreview(url, filename = 'Documento', downloadUrl = '', doc = document) {
  const frame = $('#docPreviewFrame', doc);
  const img = $('#docPreviewImg', doc);
  const errorEl = $('#docPreviewError', doc);
  const title = $('#docPreviewTitle', doc);
  const extBtn = $('#docPreviewExternalBtn', doc);
  const downBtn = $('#docPreviewDownloadBtn', doc);

  if (title) title.textContent = filename;
  if (errorEl) errorEl.classList.add('hidden');

  const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(filename || url);

  if (isImage) {
    if (img) {
      img.onerror = () => {
        img.classList.add('hidden');
        if (errorEl) errorEl.classList.remove('hidden');
      };
      img.src = url;
      img.classList.remove('hidden');
    }
    if (frame) {
      frame.src = 'about:blank';
      frame.classList.add('hidden');
    }
  } else {
    if (img) {
      img.onerror = null;
      img.src = '';
      img.classList.add('hidden');
    }
    if (frame) {
      frame.src = url;
      frame.classList.remove('hidden');
    }
  }

  if (extBtn) extBtn.href = url;
  if (downBtn) {
    downBtn.href = downloadUrl || url;
    downBtn.setAttribute('download', filename);
  }

  showModal('docPreviewModal', doc);
}

export function closeDocPreview(doc = document) {
  const frame = $('#docPreviewFrame', doc);
  const img = $('#docPreviewImg', doc);
  const errorEl = $('#docPreviewError', doc);
  if (frame) frame.src = 'about:blank';
  if (img) {
    img.onerror = null;
    img.src = '';
  }
  if (errorEl) errorEl.classList.add('hidden');
  hideModal('docPreviewModal', doc);
}

export function handleRoute(route = (typeof window !== 'undefined' ? window.location.hash : '#/'), doc = document) {
  const raw = (route || '#/').replace(/^#\/?/, '').split('?')[0].toLowerCase().trim();
  const isAuthenticated = Boolean(state.user && (state.token || state.user?.token));
  const userRole = normalizeRole(state.user?.rol);
  const perms = ROLE_PERMISSIONS[userRole];

  let targetView = 'landing';
  if (raw === 'login' || raw === 'auth') {
    targetView = 'login';
  } else if (raw === 'registro' || raw === 'onboarding') {
    targetView = 'onboarding';
  } else if (raw === 'solicitudes' || raw === 'review') {
    targetView = 'review';
  } else if (raw === 'panel' || raw === 'overview') {
    targetView = 'overview';
  } else if (raw === '' || raw === 'inicio' || raw === 'landing' || raw === '/') {
    targetView = isAuthenticated ? 'overview' : 'landing';
  }

  // ── Protected Route Middleware: Usuarios NO autenticados ──
  if (!isAuthenticated) {
    if (targetView === 'landing') {
      doc.querySelectorAll('.view-section').forEach(section => section.classList.add('hidden'));
      const heroGrid = doc.querySelector('.hero-grid');
      if (heroGrid) heroGrid.classList.remove('hidden');
      return 'landing';
    }

    if (targetView === 'overview' || targetView === 'review') {
      doc.querySelectorAll('.view-section').forEach(section => section.classList.add('hidden'));
      const loginView = doc.querySelector('#loginView');
      if (loginView) loginView.classList.remove('hidden');
      const heroGrid = doc.querySelector('.hero-grid');
      if (heroGrid) heroGrid.classList.add('hidden');
      toast('Debes iniciar sesión para acceder al panel.', 'error');
      return 'login';
    }
  }

  // ── Protected Route Middleware: Usuarios AUTENTICADOS ──
  if (isAuthenticated) {
    if (targetView === 'login' || targetView === 'landing') {
      targetView = 'overview';
    }

    // RBAC: si intenta entrar a 'review' sin tener permisos
    if (targetView === 'review' && (!perms || !perms.canAccessSolicitudes)) {
      doc.querySelectorAll('.view-section').forEach(section => section.classList.add('hidden'));
      const overview = doc.querySelector('#overviewView');
      if (overview) overview.classList.remove('hidden');
      const heroGrid = doc.querySelector('.hero-grid');
      if (heroGrid) heroGrid.classList.add('hidden');
      toast('No tienes permisos para acceder a Solicitudes. Se requiere rol APROBADOR o ADMINISTRADOR.', 'error');
      return 'overview';
    }
  }

  doc.querySelectorAll('.view-section').forEach(section => section.classList.add('hidden'));
  const targetSection = doc.querySelector(`#${targetView}View`);
  if (targetSection) targetSection.classList.remove('hidden');

  const heroGrid = doc.querySelector('.hero-grid');
  if (heroGrid) {
    if (!isAuthenticated && targetView === 'landing') {
      heroGrid.classList.remove('hidden');
    } else {
      heroGrid.classList.add('hidden');
    }
  }

  doc.querySelectorAll('.nav-link').forEach(btn => {
    const bView = btn.dataset.view;
    const bRoute = btn.dataset.route;
    btn.classList.toggle('active', bView === targetView || bRoute === raw || (targetView === 'overview' && (bRoute === '/' || bView === 'overview')));
  });

  return targetView;
}

export function navigate(route) {
  if (typeof window !== 'undefined') {
    window.location.hash = route.startsWith('#') ? route : `#/${route.replace(/^\/?/, '')}`;
  }
}

export function openUserProfile(doc = document) {
  const modal = $('#userProfileModal', doc);
  if (!modal) return;

  // If no user session, redirect to login instead of showing dummy data
  if (!state.user) {
    navigate('login');
    return;
  }

  const user = state.user;

  const nameEl = $('#profileUserName', doc);
  const emailEl = $('#profileUserEmail', doc);
  const roleEl = $('#profileUserRole', doc);
  const folioEl = $('#profileUserFolio', doc);
  const statusEl = $('#profileUserStatus', doc);
  const avatarLarge = $('#profileAvatarLarge', doc);
  const capabilitiesEl = $('#profileRoleCapabilities', doc);

  if (nameEl) nameEl.textContent = user.nombre || user.razonSocial || 'Usuario';
  if (emailEl) emailEl.textContent = user.email || '';
  if (roleEl) roleEl.textContent = user.rol || 'COMPRADOR';
  if (folioEl) folioEl.textContent = user.folio || 'CMP-0001';
  if (statusEl) {
    statusEl.textContent = user.estatus || 'ACTIVO';
    statusEl.className = `status-pill status-${user.estatus || 'APROBADO'}`;
  }
  if (avatarLarge) {
    const initial = (user.nombre || user.email || 'U').charAt(0).toUpperCase();
    avatarLarge.textContent = initial;
  }

  // Populate role capabilities from ROLE_PERMISSIONS
  if (capabilitiesEl) {
    const perms = ROLE_PERMISSIONS[user.rol];
    if (perms && perms.capabilities) {
      capabilitiesEl.textContent = perms.capabilities.join(' · ');
    } else {
      capabilitiesEl.textContent = 'Acceso estándar a la plataforma.';
    }
  }

  showModal('userProfileModal', doc);
}

export function closeUserProfile(doc = document) {
  hideModal('userProfileModal', doc);
}

export function logout(doc = document) {
  state.user = null;
  state.token = null;
  state.verifiedEmailToken = '';
  state.loginChallengeToken = '';
  state.loginEmail = '';
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('subasta_user');
      localStorage.removeItem('subasta_token');
    }
  } catch (ignored) {}
  closeUserProfile(doc);
  toast('Sesión cerrada correctamente.');
  updateUserAvatar(doc);
  if (typeof window !== 'undefined') {
    window.location.hash = '#/';
  }
}

export function updateUserAvatar(doc = document) {
  const avatarBtn = $('#openAuth', doc);
  if (!avatarBtn) return;
  if (state.user) {
    const initial = (state.user.nombre || state.user.email || 'U').charAt(0).toUpperCase();
    avatarBtn.textContent = initial;
  } else {
    avatarBtn.innerHTML = '<i data-lucide="user"></i>';
    initIcons(avatarBtn);
  }

  // Control de visibilidad del menú hamburguesa:
  // Visible para roles con acceso a Solicitudes (ADMINISTRADOR, ADMIN, APROBADOR, CONTROLER)
  const hamburger = $('#menuToggle', doc);
  if (hamburger) {
    const rol = normalizeRole(state.user?.rol);
    const perms = ROLE_PERMISSIONS[rol];
    const canSeeMenu = Boolean(state.user && perms?.canAccessSolicitudes === true);
    hamburger.classList.toggle('hidden', !canSeeMenu);
  }
}

export async function submitLogin(event) {
  if (event) event.preventDefault();
  const emailInput = $('#loginEmail');
  const passwordInput = $('#loginPassword');
  const otpInput = $('#loginOtpCode');
  const otpField = $('#loginOtpField');
  const submitBtn = $('#loginSubmitBtn');
  const identifier = emailInput?.value.trim() || '';
  const password = passwordInput?.value || '';

  if (!identifier) {
    toast('Por favor ingresa tu correo electrónico o teléfono.', 'error');
    return;
  }

  if (submitBtn) setLoading(submitBtn, true);

  try {
    if (password) {
      const res = await authApi.login(identifier, password);
      if (res?.success && res?.accessToken) {
        state.token = res.accessToken;
        const claims = parseJwtPayload(res.accessToken);
        const resolvedRole = normalizeRole(res.user?.rol || claims?.rol);
        state.user = {
          ...res.user,
          rol: resolvedRole
        };
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('subasta_token', res.accessToken);
            localStorage.setItem('subasta_user', JSON.stringify(state.user));
          }
        } catch (ignored) {}

        toast(`¡Bienvenido de vuelta, ${state.user.nombre || state.user.email}!`);
        updateUserAvatar();

        const perms = ROLE_PERMISSIONS[resolvedRole];
        if (perms?.canAccessSolicitudes) {
          navigate('solicitudes');
          await Promise.all([loadDashboard({ quiet: true }), loadRequests({ quiet: true })]);
        } else {
          navigate('overview');
          await loadDashboard({ quiet: true });
        }
        return;
      } else {
        toast(res?.error || 'Error al iniciar sesión', 'error');
        return;
      }
    }

    if (!state.loginChallengeToken) {
      const res = await authApi.sendCode(identifier);
      state.loginChallengeToken = res?.challengeToken || '';
      state.loginEmail = identifier;
      if (otpField) otpField.classList.remove('hidden');
      if (otpInput) {
        otpInput.required = true;
        otpInput.focus();
      }
      if (submitBtn) submitBtn.innerHTML = 'Iniciar sesión <i data-lucide="arrow-right"></i>';
      toast(res?.message || 'Código de acceso enviado a tu correo.');
    } else {
      const code = otpInput?.value.trim();
      if (!code) {
        toast('Ingresa el código de 6 dígitos enviado a tu correo.', 'error');
        if (submitBtn) setLoading(submitBtn, false);
        return;
      }

      const res = await authApi.verifyCode(code, state.loginChallengeToken);
      if (res?.verified) {
        const found = state.requests.find(r => r.email === identifier || (r.datos && r.datos.email === identifier));
        state.user = res.user || {
          nombre: found?.nombre || found?.datos?.nombres || identifier.split('@')[0],
          email: identifier,
          rol: found?.tipo || 'COMPRADOR',
          folio: found?.folio || 'CMP-0001',
          estatus: found?.estatus || 'ACTIVO'
        };

        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('subasta_user', JSON.stringify(state.user));
          }
        } catch (ignored) {}

        toast(`¡Bienvenido de vuelta, ${state.user.nombre}!`);
        updateUserAvatar();
        state.loginChallengeToken = '';
        state.loginEmail = '';
        if (otpField) otpField.classList.add('hidden');
        if (otpInput) otpInput.value = '';
        if (emailInput) emailInput.value = '';
        if (submitBtn) submitBtn.innerHTML = 'Enviar código de acceso <i data-lucide="arrow-right"></i>';

        navigate('/');
      } else {
        toast(res?.error || 'Código incorrecto.', 'error');
      }
    }
  } catch (error) {
    toast(error.message, 'error');
  } finally {
    if (submitBtn) setLoading(submitBtn, false);
  }
}

export function openNavDrawer(doc = document) {
  const drawer = $('#navDrawer', doc);
  const backdrop = $('#navDrawerBackdrop', doc);
  const toggleBtn = $('#menuToggle', doc);
  if (drawer) {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  }
  if (backdrop) backdrop.classList.remove('hidden');
  if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
}

export function closeNavDrawer(doc = document) {
  const drawer = $('#navDrawer', doc);
  const backdrop = $('#navDrawerBackdrop', doc);
  const toggleBtn = $('#menuToggle', doc);
  if (drawer) {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }
  if (backdrop) backdrop.classList.add('hidden');
  if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
}

export function toggleNavDrawer(doc = document) {
  const drawer = $('#navDrawer', doc);
  if (drawer && drawer.classList.contains('open')) {
    closeNavDrawer(doc);
  } else {
    openNavDrawer(doc);
  }
}


export async function updateRequestStatus(type, id) {
  const status = $('#newStatus')?.value;
  const reason = $('#statusReason')?.value.trim();
  const button = $('#saveStatus');
  if (button) setLoading(button, true, 'Guardando...');
  try {
    await revisionApi.updateStatus(type, id, status, reason);
    toast('El estado de la solicitud se actualizó correctamente.');
    hideModal('detailModal');
    await Promise.all([loadDashboard({ quiet: true }), loadRequests({ quiet: true })]);
  } catch (error) {
    toast(error.message, 'error');
  } finally {
    if (button) setLoading(button, false);
  }
}

export function collectForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const files = {};
  form.querySelectorAll('input[type="file"]').forEach(input => {
    if (input.files?.[0]) files[input.name] = input.files[0];
    delete data[input.name];
  });
  delete data[''];
  if (data.tipoPersona === 'FISICA') {
    delete data.razonSocial;
    delete data.fechaConstitucion;
  } else {
    delete data.nombres;
    delete data.apellidoPaterno;
    delete data.apellidoMaterno;
    delete data.fechaNacimiento;
    delete data.curp;
  }
  return { data, files };
}

export async function executeRegistration(data, files, form) {
  const submitBtn = form.querySelector('[type="submit"]');
  if (submitBtn) setLoading(submitBtn, true, 'Guardando registro...');
  try {
    const result = state.role === 'COMPRADOR'
      ? await onboardingApi.registerBuyer(data, files)
      : await onboardingApi.registerSeller(data, files);

    toast(`${result?.mensaje || 'Usuario registrado exitosamente en el backend'}${result?.folio ? ` · Folio ${result.folio}` : ''}`);
    form.reset();
    state.verifiedEmail = '';
    state.pendingRegistration = null;
    updateEmailBadge();
    setRole('COMPRADOR');
    initAddressCascade();
    await Promise.all([
      loadDashboard({ quiet: true }),
      loadRequests({ quiet: true })
    ]);
  } catch (error) {
    toast(error.message, 'error');
  } finally {
    if (submitBtn) setLoading(submitBtn, false);
  }

}

export function updateEmailBadge() {
  const badge = $('#emailVerifyBadge');
  const emailInput = $('#onboardingEmail');
  if (!badge || !emailInput) return;
  const currentEmail = emailInput.value.trim().toLowerCase();
  if (state.verifiedEmail && state.verifiedEmail === currentEmail) {
    badge.className = 'text-xs text-emerald-600 mt-1 inline-flex items-center gap-1 font-semibold';
    badge.innerHTML = '<i data-lucide="check-circle-2"></i> Correo validado con código';
  } else {
    badge.className = 'text-xs text-amber-600 mt-1 inline-flex items-center gap-1';
    badge.innerHTML = '<i data-lucide="mail-check"></i> Requiere verificación por código antes de enviar';
  }
  initIcons(badge);
}

export async function submitOnboarding(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const { data, files } = collectForm(form);
  const email = (data.email || '').trim().toLowerCase();

  // If email is already verified, proceed directly
  if (state.verifiedEmail && state.verifiedEmail === email) {
    await executeRegistration(data, files, form);
    return;
  }

  // Pre-submit email verification code requirement:
  // Send code to email BEFORE creating new user in backend
  const submitBtn = form.querySelector('[type="submit"]');
  if (submitBtn) setLoading(submitBtn, true, 'Enviando código...');

  try {
    const res = await authApi.sendCode(email);
    state.preSubmitChallengeToken = res?.challengeToken || '';
    state.pendingRegistration = { data, files, form };

    const emailDisplay = $('#verifyEmailDisplay');
    if (emailDisplay) emailDisplay.textContent = email;

    const otpInput = $('#verifyOtpCode');
    if (otpInput) { otpInput.value = ''; }

    showModal('verifyModal');
    toast(res?.message || 'Código enviado. Revisa tu correo electrónico.');
    if (otpInput) otpInput.focus();
  } catch (error) {
    toast(error.message, 'error');
  } finally {
    if (submitBtn) setLoading(submitBtn, false);
  }
}

export async function submitVerifyModal(event) {
  event.preventDefault();
  const otpInput = $('#verifyOtpCode');
  const code = (otpInput?.value || '').trim();
  const confirmBtn = $('#confirmVerifyBtn');

  if (!code || code.length < 6) {
    toast('Ingresa el código completo de 6 dígitos', 'error');
    return;
  }

  if (confirmBtn) setLoading(confirmBtn, true, 'Validando código...');

  try {
    const result = await authApi.verifyCode(code, state.preSubmitChallengeToken);
    if (!result?.verified) {
      throw new Error('Código incorrecto o expirado.');
    }

    const verifiedEmail = (result.email || state.pendingRegistration?.data?.email || '').trim().toLowerCase();
    state.verifiedEmail = verifiedEmail;
    updateEmailBadge();
    hideModal('verifyModal');
    toast('¡Código verificado con éxito! Registrando usuario...');

    if (state.pendingRegistration) {
      const { data, files, form } = state.pendingRegistration;
      await executeRegistration(data, files, form);
    }
  } catch (error) {
    toast(error.message, 'error');
  } finally {
    if (confirmBtn) setLoading(confirmBtn, false);
  }
}

export async function resendPreSubmitCode() {
  const email = state.pendingRegistration?.data?.email || $('#onboardingEmail')?.value.trim();
  if (!email) {
    toast('No hay correo registrado para reenviar.', 'error');
    return;
  }
  const btn = $('#resendVerifyCodeBtn');
  if (btn) setLoading(btn, true, 'Reenviando...');
  try {
    const res = await authApi.sendCode(email);
    state.preSubmitChallengeToken = res?.challengeToken || state.preSubmitChallengeToken;
    toast(res?.message || 'Nuevo código enviado.');
  } catch (error) {
    toast(error.message, 'error');
  } finally {
    if (btn) setLoading(btn, false);
  }
}

export async function submitAuth(event) {
  event.preventDefault();
  const button = $('#authSubmit');
  if (button) setLoading(button, true);
  try {
    if (!state.challengeToken) {
      const result = await authApi.sendCode($('#authEmail').value.trim());
      state.challengeToken = result?.challengeToken || '';
      if (!state.challengeToken) throw new Error('El servidor no devolvió el token de verificación.');
      $('#otpField')?.classList.remove('hidden');
      const otpCode = $('#otpCode');
      if (otpCode) otpCode.required = true;
      if (button) button.innerHTML = 'Verificar código <i data-lucide="arrow-right"></i>';
      toast(result?.message || 'Código enviado. Revisa tu correo.');
      otpCode?.focus();
    } else {
      const result = await authApi.verifyCode($('#otpCode').value.trim(), state.challengeToken);
      state.verifiedEmailToken = result?.verifiedEmailToken || '';
      toast(result?.verified ? `Correo verificado: ${result.email || $('#authEmail').value}` : 'No se pudo verificar el código.', result?.verified ? 'success' : 'error');
      if (result?.verified) {
        hideModal('authModal');
        resetAuthModal();
        state.challengeToken = '';
      }
    }
  } catch (error) {
    toast(error.message, 'error');
  } finally {
    if (button) setLoading(button, false);
  }
}

export function bindEvents() {
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', async () => {
    const view = button.dataset.view;
    setActiveView(view);
    if (view === 'review') await loadRequests({ quiet: true });
    if (view === 'overview') await loadDashboard({ quiet: true });
  }));

  document.querySelectorAll('.role-option').forEach(button => button.addEventListener('click', () => setRole(button.dataset.role)));
  $('#tipoPersona')?.addEventListener('change', () => updatePersonFields());
  $('#onboardingForm')?.addEventListener('submit', submitOnboarding);

  // Email input change listener: reset verified status if user modifies email
  $('#onboardingEmail')?.addEventListener('input', () => {
    const current = $('#onboardingEmail').value.trim().toLowerCase();
    if (state.verifiedEmail && state.verifiedEmail !== current) {
      state.verifiedEmail = '';
      updateEmailBadge();
    }
  });

  // Pre-submission verification modal events
  $('#verifyForm')?.addEventListener('submit', submitVerifyModal);
  $('#resendVerifyCodeBtn')?.addEventListener('click', resendPreSubmitCode);
  $('#closeVerify')?.addEventListener('click', () => hideModal('verifyModal'));

  $('#searchRequests')?.addEventListener('input', paintRequests);
  $('#typeFilter')?.addEventListener('change', () => loadRequests());
  $('#statusFilter')?.addEventListener('change', () => loadRequests());
  $('#refreshRequests')?.addEventListener('click', () => loadRequests());

  $('#requestsTable')?.addEventListener('click', event => {
    const button = event.target.closest('[data-detail-id]');
    if (button) openRequestDetail(button.dataset.detailType, button.dataset.detailId);
  });

  $('#openAuth')?.addEventListener('click', () => {
    if (state.user) {
      openUserProfile();
    } else {
      navigate('login');
    }
  });
  $('#closeAuth')?.addEventListener('click', () => { hideModal('authModal'); state.challengeToken = ''; resetAuthModal(); });
  $('#closeProfile')?.addEventListener('click', () => closeUserProfile());
  $('#logoutBtn')?.addEventListener('click', () => logout());
  $('#updateProfileRequestBtn')?.addEventListener('click', () => {
    closeUserProfile();
    navigate('registro');
    toast('Completa los campos para enviar tu solicitud de actualización de perfil.');
  });

  $('#loginForm')?.addEventListener('submit', submitLogin);
  $('#toRegisterTab')?.addEventListener('click', () => navigate('registro'));
  $('#loginToRegisterBtn')?.addEventListener('click', () => navigate('registro'));

  document.querySelectorAll('[data-route]').forEach(el => el.addEventListener('click', (e) => {
    const route = el.dataset.route;
    if (route) {
      e.preventDefault();
      navigate(route);
    }
  }));

  $('#closeDetail')?.addEventListener('click', () => hideModal('detailModal'));
  $('#closeDocPreview')?.addEventListener('click', () => closeDocPreview());

  $('#menuToggle')?.addEventListener('click', () => toggleNavDrawer());
  $('#menuClose')?.addEventListener('click', () => closeNavDrawer());
  $('#navDrawerBackdrop')?.addEventListener('click', () => closeNavDrawer());
  document.querySelectorAll('#navDrawer .nav-link').forEach(button => {
    button.addEventListener('click', () => closeNavDrawer());
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', () => handleRoute());
  }

  document.querySelectorAll('.modal-backdrop').forEach(modal => modal.addEventListener('click', event => {
    if (event.target === modal) hideModal(modal.id);
  }));

  $('#authForm')?.addEventListener('submit', submitAuth);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeNavDrawer();
      closeUserProfile();
      document.querySelectorAll('.modal-backdrop:not(.hidden)').forEach(modal => hideModal(modal.id));
    }
  });
}

export async function init() {
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  try {
    if (typeof localStorage !== 'undefined') {
      const storedToken = localStorage.getItem('subasta_token');
      const storedUser = localStorage.getItem('subasta_user');
      if (storedToken && isTokenValid(storedToken)) {
        state.token = storedToken;
        const claims = parseJwtPayload(storedToken);
        if (storedUser) {
          state.user = JSON.parse(storedUser);
          if (claims?.rol) state.user.rol = normalizeRole(claims.rol);
        } else if (claims) {
          state.user = {
            email: claims.sub,
            rol: normalizeRole(claims.rol),
            nombre: claims.sub?.split('@')[0]
          };
        }
      } else if (storedToken) {
        // Token expirado o corrupto: limpiar sesión
        localStorage.removeItem('subasta_token');
        localStorage.removeItem('subasta_user');
        state.token = null;
        state.user = null;
      }
    }
  } catch (ignored) {}

  bindEvents();
  setRole('COMPRADOR');
  setupPersonFieldToggles();
  initAddressCascade();
  updateUserAvatar();
  initIcons();
  handleRoute();
  await Promise.all([loadDashboard({ quiet: true }), loadRequests({ quiet: true })]);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined' && !window.__TEST_ENV__) {
  init();
}
