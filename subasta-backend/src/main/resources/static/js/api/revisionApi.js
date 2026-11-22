import { request } from './client.js';

export const revisionApi = {
  getKpis() {
    return request('/revision/kpis');
  },
  getRequests({ tipo = '', estatus = '' } = {}) {
    const params = new URLSearchParams();
    if (tipo) params.set('tipo', tipo);
    if (estatus) params.set('estatus', estatus);
    const query = params.toString();
    return request(`/revision/solicitudes${query ? `?${query}` : ''}`);
  },
  getRequestDetail(tipo, id) {
    return request(`/revision/solicitudes/${encodeURIComponent(tipo)}/${encodeURIComponent(id)}`);
  },
  updateStatus(tipo, id, estatus, motivo = '') {
    return request(`/revision/solicitudes/${encodeURIComponent(tipo)}/${encodeURIComponent(id)}/estatus`, {
      method: 'PUT', body: JSON.stringify({ estatus, motivo })
    });
  },
  /**
   * Cambia el rol de un usuario entre COMPRADOR y VENDEDOR.
   * Solo permitido para APROBADOR y ADMINISTRADOR.
   */
  cambiarRolUsuario(usuarioId, rol) {
    return request(`/revision/usuarios/${encodeURIComponent(usuarioId)}/rol`, {
      method: 'PUT', body: JSON.stringify({ rol })
    });
  }
};
