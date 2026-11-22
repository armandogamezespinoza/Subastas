const statusLabels = { ENVIADO: 'Enviado', EN_REVISION: 'En revisión', APROBADO: 'Aprobado', RECHAZADO: 'Rechazado' };

export function renderRequestsTable(requests = []) {
  if (!requests.length) return `<div class="table-empty"><i data-lucide="inbox"></i>No hay solicitudes que coincidan con los filtros.</div>`;
  return `<div class="requests-wrap"><table class="requests-table">
    <thead><tr><th>PERFIL</th><th>FOLIO</th><th>TIPO</th><th>ESTADO</th><th>DOCUMENTOS</th><th></th></tr></thead>
    <tbody>${requests.map(item => `
      <tr>
        <td><div class="person-cell"><span class="person-avatar">${escapeHtml(initials(item.nombre))}</span><div><div class="person-name">${escapeHtml(item.nombre || 'Sin nombre')}</div><div class="person-meta">${escapeHtml(item.email || 'Sin correo')}</div></div></div></td>
        <td><strong>${escapeHtml(item.folio || `#${item.id}`)}</strong></td>
        <td><span class="type-pill">${item.tipo === 'VENDEDOR' ? 'Vendedor' : 'Comprador'}</span></td>
        <td><span class="status-pill status-${safeStatus(item.estatus)}">${statusLabels[item.estatus] || 'Sin estado'}</span></td>
        <td>${Number(item.totalDocumentos || 0)} archivos</td>
        <td><button class="table-action" data-detail-id="${escapeHtml(item.id)}" data-detail-type="${escapeHtml(item.tipo)}">Revisar <span aria-hidden="true">↗</span></button></td>
      </tr>`).join('')}</tbody></table></div>`;
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
