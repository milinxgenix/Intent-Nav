// Mock Site A Logic
// Phase 27: Explicit Application State representation (instrumented witness channel)
window.IntentNavMockState = {
  tracking_enabled: true,
  export_download_initiated: false,
  marketing_emails_enabled: true,
  two_factor_enabled: true,
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

const feedback = document.getElementById('live-feedback');

const trackingBtn = document.getElementById('btn-toggle-tracking');
if (trackingBtn) {
  trackingBtn.addEventListener('click', () => {
    const isChecked = trackingBtn.getAttribute('aria-checked') === 'true';
    trackingBtn.setAttribute('aria-checked', String(!isChecked));
    trackingBtn.textContent = !isChecked ? 'Disable Tracking' : 'Enable Tracking';
    dispatchMockStateChange('tracking_enabled', !isChecked);
    if (feedback) feedback.textContent = `Tracking state: ${!isChecked ? 'ENABLED' : 'DISABLED'}`;
  });
}

const marketingBtn = document.getElementById('btn-disable-marketing');
if (marketingBtn) {
  marketingBtn.addEventListener('click', () => {
    const isChecked = marketingBtn.getAttribute('aria-checked') === 'true';
    marketingBtn.setAttribute('aria-checked', String(!isChecked));
    marketingBtn.textContent = !isChecked ? 'Disable Marketing Emails' : 'Enable Marketing Emails';
    dispatchMockStateChange('marketing_emails_enabled', !isChecked);
    if (feedback) feedback.textContent = `Marketing emails state: ${!isChecked ? 'ENABLED' : 'DISABLED'}`;
  });
}

const exportBtn = document.getElementById('btn-export-data');
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    dispatchMockStateChange('export_download_initiated', true);
    if (feedback) feedback.textContent = 'Personal data archive export initiated. Download preparing...';
  });
}

const twoFaBtn = document.getElementById('btn-disable-2fa');
if (twoFaBtn) {
  twoFaBtn.addEventListener('click', () => {
    dispatchMockStateChange('two_factor_enabled', false);
    if (feedback) feedback.textContent = 'Two-Factor Authentication disabled.';
  });
}

const deactBtn = document.getElementById('btn-deactivate-account');
if (deactBtn) {
  deactBtn.addEventListener('click', () => {
    dispatchMockStateChange('account_deactivated', true);
    if (feedback) feedback.textContent = 'Account deactivation executed.';
  });
}
