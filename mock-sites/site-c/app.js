// Mock Site C Logic
// Phase 27: Explicit Application State representation (instrumented witness channel)
window.IntentNavMockState = {
  marketing_emails_enabled: true,
  export_download_initiated: false,
  two_factor_enabled: true,
  modal_open: false,
};

function dispatchMockStateChange(property, value) {
  window.IntentNavMockState[property] = value;
  window.dispatchEvent(
    new CustomEvent('intentnav:mock-state-change', {
      detail: {
        property,
        value,
        fullState: { ...window.IntentNavMockState },
        timestamp: Date.now(),
      },
    })
  );
}

const feedback = document.getElementById('feedback-c');
const modal = document.getElementById('modal-confirm-dialog');

const marketingBtn = document.getElementById(':r3:');
if (marketingBtn) {
  marketingBtn.addEventListener('click', () => {
    const isChecked = marketingBtn.getAttribute('aria-checked') === 'true';
    marketingBtn.setAttribute('aria-checked', String(!isChecked));
    marketingBtn.textContent = !isChecked ? 'Turn Off Marketing Notifications' : 'Turn On Marketing Notifications';
    dispatchMockStateChange('marketing_emails_enabled', !isChecked);
    if (feedback) feedback.textContent = `Marketing state: ${!isChecked ? 'ACTIVE' : 'DISABLED'}`;
  });
}

const exportBtn = document.getElementById('ember992');
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    dispatchMockStateChange('export_download_initiated', true);
    if (feedback) feedback.textContent = 'GDPR archive export generated.';
  });
}

const openModalBtn = document.getElementById('btn-open-2fa-modal');
if (openModalBtn) {
  openModalBtn.addEventListener('click', () => {
    modal.classList.add('open');
    dispatchMockStateChange('modal_open', true);
  });
}

const confirmModalBtn = document.getElementById('btn-modal-confirm');
if (confirmModalBtn) {
  confirmModalBtn.addEventListener('click', () => {
    modal.classList.remove('open');
    dispatchMockStateChange('two_factor_enabled', false);
    dispatchMockStateChange('modal_open', false);
    if (feedback) feedback.textContent = '2FA removed after modal confirmation.';
  });
}

const cancelModalBtn = document.getElementById('btn-modal-cancel');
if (cancelModalBtn) {
  cancelModalBtn.addEventListener('click', () => {
    modal.classList.remove('open');
    dispatchMockStateChange('modal_open', false);
    if (feedback) feedback.textContent = '2FA removal cancelled.';
  });
}
