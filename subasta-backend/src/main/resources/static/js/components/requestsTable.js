const statusLabels = {
  NO_RECIBIDO: 'No recibido',
  RECIBIDO: 'Recibido',
  ENVIADO: 'Enviado',
  EN_REVISION: 'En revisión',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  NEGADO: 'Negado'
};

export function paginateRequests(requests = [], page = 1, pageSize = 10) {
  const safeList = Array.isArray(requests) ? requests : [];
  const totalItems = safeList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: safeList.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    totalItems,
    pageSize
  };
}

function formatProfileType(item) {
  const roleLabel = item.tipo === 'VENDEDOR' ? 'Vendedor' : 'Comprador';
  if (item.tipoPersona === 'MORAL') return `${roleLabel} · Persona Moral`;
  if (item.tipoPersona === 'FISICA') return `${roleLabel} · Persona Física`;
  return roleLabel;
}

export function renderRequestsTable(requests = [], pagination = null) {
  if (!requests.length) return `<div class="table-empty"><i data-lucide="inbox"></i>No hay solicitudes que coincidan con los filtros.</div>`;

  const paginationHtml = (pagination && pagination.totalPages > 1) ? `
    <div class="table-pagination flex items-center justify-between gap-2 px-4 py-3 border-t border-[var(--border-card)] text-xs">
      <span class="text-[var(--text-secondary)]">Página ${pagination.page} de ${pagination.totalPages} (${pagination.totalItems} registros)</span>
      <div class="flex items-center gap-1">
        <button type="button" class="btn btn-ghost" data-page="${pagination.page - 1}" ${pagination.page <= 1 ? 'disabled' : ''}>Anterior</button>
        ${Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p =>
          `<button type="button" class="btn ${p === pagination.page ? 'btn-lime' : 'btn-ghost'}" data-page="${p}">${p}</button>`
        ).join('')}
        <button type="button" class="btn btn-ghost" data-page="${pagination.page + 1}" ${pagination.page >= pagination.totalPages ? 'disabled' : ''}>Siguiente</button>
      </div>
    </div>
  ` : '';

  return `<div class="requests-wrap"><table class="requests-table">
    <thead><tr><th>PERFIL</th><th>FOLIO</th><th>TIPO DE PERFIL</th><th>ESTADO</th><th>DOCUMENTOS</th><th></th></tr></thead>
    <tbody>${requests.map(item => `
      <tr>
        <td><div class="person-cell"><span class="person-avatar">${escapeHtml(initials(item.nombre))}</span><div><div class="person-name">${escapeHtml(item.nombre || 'Sin nombre')}</div><div class="person-meta">${escapeHtml(item.email || 'Sin correo')}</div></div></div></td>
        <td><strong>${escapeHtml(item.folio || `#${item.id}`)}</strong></td>
        <td><span class="type-pill">${escapeHtml(formatProfileType(item))}</span></td>
        <td><span class="status-pill status-${safeStatus(item.estatus)}">${statusLabels[item.estatus] || 'Sin estado'}</span></td>
        <td>${Number(item.totalDocumentos || 0)} archivos</td>
        <td><button class="table-action" data-detail-id="${escapeHtml(item.id)}" data-detail-type="${escapeHtml(item.tipo)}">Revisar <span aria-hidden="true">↗</span></button></td>
      </tr>`).join('')}</tbody></table>${paginationHtml}</div>`;
}

export function filterRequests(requests, search = '') {
  const term = search.trim().toLocaleLowerCase('es-MX');
  if (!term) return requests;
  return requests.filter(item => [item.nombre, item.folio, item.rfc, item.email, item.telefono]
    .some(value => String(value || '').toLocaleLowerCase('es-MX').includes(term)));
}

function initials(name = '') {
  return String(name).trim().split(/\s+/).slice(0, 2).map(word => word[0] || '').join('').toUpperCase() || 'S';
}
function safeStatus(status = '') { return /^[A-Z_]+$/.test(status) ? status : 'ENVIADO'; }
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
