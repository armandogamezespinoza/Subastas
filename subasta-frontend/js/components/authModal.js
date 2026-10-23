export function resetAuthModal() {
  const form = document.querySelector('#authForm');
  form?.reset();
  document.querySelector('#otpField')?.classList.add('hidden');
  const submit = document.querySelector('#authSubmit');
  if (submit) submit.innerHTML = 'Enviar código <i data-lucide="arrow-right"></i>';
  if (window.lucide) window.lucide.createIcons();
}
