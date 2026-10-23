export function toast(message, type = 'success') {
  const region = document.querySelector('#toastRegion');
  const item = document.createElement('div');
  item.className = `toast ${type === 'error' ? 'error' : ''}`;
  const icon = type === 'error' ? 'circle-alert' : 'circle-check';
  item.innerHTML = `<i data-lucide="${icon}"></i><span></span>`;
  item.querySelector('span').textContent = message;
  region.append(item);
  if (window.lucide) window.lucide.createIcons({ nodes: [item] });
  window.setTimeout(() => item.remove(), 4500);
}

export function setLoading(button, loading, label = 'Procesando...') {
  if (!button) return;
  if (loading) {
    button.dataset.originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner"></span>${label}`;
  } else {
    button.disabled = false;
    if (button.dataset.originalHtml) button.innerHTML = button.dataset.originalHtml;
    delete button.dataset.originalHtml;
    if (window.lucide) window.lucide.createIcons({ nodes: [button] });
  }
}

export function setActiveView(view) {
  document.querySelectorAll('.view-section').forEach(section => section.classList.add('hidden'));
  document.querySelector(`#${view}View`)?.classList.remove('hidden');
  document.querySelectorAll('.nav-link').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  if (view !== 'overview') document.querySelector(`#${view}View`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
