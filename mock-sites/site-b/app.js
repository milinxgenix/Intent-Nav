// Mock Site B Logic
// Phase 27: Explicit Application State representation (instrumented witness channel)
window.IntentNavMockState = {
  marketing_emails_enabled: true,
  two_factor_enabled: true,
  export_download_initiated: false,
  account_deactivated: false,
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

const feedback = document.getElementById('feedback-b');

const mfaBtn = document.getElementById('btn-mfa-protection');
if (mfaBtn) {
  mfaBtn.addEventListener('click', () => {
    dispatchMockStateChange('two_factor_enabled', false);
    if (feedback) feedback.textContent = 'MFA disabled successfully.';
  });
}

const promoBtn = document.getElementById('btn-promotions-switch');
if (promoBtn) {
  promoBtn.addEventListener('click', () => {
    const isChecked = promoBtn.getAttribute('aria-checked') === 'true';
    promoBtn.setAttribute('aria-checked', String(!isChecked));
    promoBtn.textContent = !isChecked ? 'Stop Promotional Bulletins' : 'Resume Promotional Bulletins';
    dispatchMockStateChange('marketing_emails_enabled', !isChecked);
    if (feedback) feedback.textContent = `Promotional bulletins: ${!isChecked ? 'PAUSED' : 'ACTIVE'}`;
  });
}

const dlBtn = document.getElementById('btn-download-records');
if (dlBtn) {
  dlBtn.addEventListener('click', () => {
    dispatchMockStateChange('export_download_initiated', true);
    if (feedback) feedback.textContent = 'Personal records download generated.';
  });
}

const pauseBtn = document.getElementById('btn-pause-profile');
if (pauseBtn) {
  pauseBtn.addEventListener('click', () => {
    dispatchMockStateChange('account_deactivated', true);
    if (feedback) feedback.textContent = 'Account placed on temporary hold.';
  });
}
