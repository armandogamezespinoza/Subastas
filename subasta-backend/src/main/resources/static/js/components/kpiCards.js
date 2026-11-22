const cards = [
  { key: 'total', label: 'Solicitudes totales', foot: 'Todos los perfiles', icon: 'layers-3', accent: true },
  { key: 'totalCompradores', label: 'Compradores', foot: 'Perfiles de compra', icon: 'shopping-bag' },
  { key: 'totalVendedores', label: 'Vendedores', foot: 'Perfiles de venta', icon: 'store' },
  { key: 'enRevision', label: 'En revisión', foot: 'Pendientes de resolución', icon: 'scan-search' }
];

export function renderKpiCards(data = {}) {
  return cards.map(card => `
    <article class="kpi-card ${card.accent ? 'accent' : ''}">
      <div class="kpi-top"><span>${card.label}</span><span class="kpi-icon"><i data-lucide="${card.icon}"></i></span></div>
      <div class="kpi-value">${formatNumber(data[card.key])}</div>
      <div class="kpi-foot">${card.foot}</div>
    </article>`).join('');
}

export function renderStatusProgress(data = {}) {
  const total = Number(data.total || 0);
  const rows = [
    ['Aprobadas', Number(data.aprobados || 0), 'APROBADO'],
    ['En revisión', Number(data.enRevision || 0), 'EN_REVISION'],
    ['Rechazadas', Number(data.rechazados || 0), 'RECHAZADO'],
    ['Enviadas', Number(data.enviados || 0), 'ENVIADO']
  ];
  return rows.map(([label, value]) => {
    const width = total > 0 ? Math.min(100, value / total * 100) : 0;
    return `<div class="progress-item"><span class="progress-label">${label}</span><div class="progress-track"><div class="progress-fill" style="width:${width}%"></div></div><strong class="progress-count">${value}</strong></div>`;
  }).join('');
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('es-MX');
}
