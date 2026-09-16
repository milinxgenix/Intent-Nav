// Mock Site C Logic
const feedback = document.getElementById('feedback-c');
const modal = document.getElementById('modal-confirm-dialog');

const marketingBtn = document.getElementById(':r3:');
if (marketingBtn) {
  marketingBtn.addEventListener('click', () => {
    const isChecked = marketingBtn.getAttribute('aria-checked') === 'true';
    marketingBtn.setAttribute('aria-checked', String(!isChecked));
    marketingBtn.textContent = !isChecked ? 'Turn Off Marketing Notifications' : 'Turn On Marketing Notifications';
    feedback.textContent = `Marketing state: ${!isChecked ? 'ACTIVE' : 'DISABLED'}`;
  });
}

const exportBtn = document.getElementById('ember992');
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    feedback.textContent = 'GDPR archive export generated.';
  });
}

const openModalBtn = document.getElementById('btn-open-2fa-modal');
if (openModalBtn) {
  openModalBtn.addEventListener('click', () => {
    modal.classList.add('open');
  });
}

const confirmModalBtn = document.getElementById('btn-modal-confirm');
if (confirmModalBtn) {
  confirmModalBtn.addEventListener('click', () => {
    modal.classList.remove('open');
    feedback.textContent = '2FA removed after modal confirmation.';
  });
}

const cancelModalBtn = document.getElementById('btn-modal-cancel');
if (cancelModalBtn) {
  cancelModalBtn.addEventListener('click', () => {
    modal.classList.remove('open');
    feedback.textContent = '2FA removal cancelled.';
  });
}
