// Mock Site B Logic
window.IntentNavMockState = {
  marketing_notifications_enabled: true,
  marketing_emails_enabled: true,
  two_factor_enabled: true,
  export_download_initiated: false,
  account_deactivated: false,
  account_active: true,
  analytics_tracking_enabled: true,
  active_session_count: 2,
  dark_mode_enabled: false,
  invoice_available: true,
  invoice_download_triggered: false,
  audit_logs_available: true,
  audit_logs_visible: false,
};

function syncStateToDOM() {
  if (typeof document === 'undefined') return;
  let el = document.getElementById('app-state');
  if (!el && document.body) {
    el = document.createElement('div');
    el.id = 'app-state';
    el.style.display = 'none';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  if (el) {
    el.setAttribute('data-state', JSON.stringify(window.IntentNavMockState));
  }
}
syncStateToDOM();

function dispatchMockStateChange(property, value) {
  window.IntentNavMockState[property] = value;
  syncStateToDOM();
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

// 1. MFA Protection
const mfaBtn = document.getElementById('btn-mfa-protection');
if (mfaBtn) {
  mfaBtn.addEventListener('click', () => {
    dispatchMockStateChange('two_factor_enabled', false);
    mfaBtn.setAttribute('disabled', 'true');
    if (window.history && window.history.pushState) {
      window.history.pushState({ route: '/security/mfa-disabled' }, '', '#security/mfa-disabled');
      window.dispatchEvent(new PopStateEvent('popstate', { state: { route: '/security/mfa-disabled' } }));
    }
    window.dispatchEvent(
      new CustomEvent('intentnav:client-route-change', {
        detail: { route: '/security/mfa-disabled' },
      })
    );
    if (feedback) feedback.textContent = 'MFA disabled successfully.';
  });
}

// 2. Promotional Bulletins
const promoBtn = document.getElementById('btn-promotions-switch');
if (promoBtn) {
  promoBtn.addEventListener('click', () => {
    const isChecked = promoBtn.getAttribute('aria-checked') === 'true';
    const newChecked = !isChecked;
    promoBtn.setAttribute('aria-checked', String(newChecked));
    promoBtn.textContent = newChecked ? 'Stop Promotional Bulletins' : 'Resume Promotional Bulletins';
    dispatchMockStateChange('marketing_notifications_enabled', newChecked);
    dispatchMockStateChange('marketing_emails_enabled', newChecked);
    if (feedback) feedback.textContent = `Promotional bulletins: ${newChecked ? 'ACTIVE' : 'PAUSED'}`;
  });
}

// 3. Download Records
const dlBtn = document.getElementById('btn-download-records');
if (dlBtn) {
  dlBtn.addEventListener('click', () => {
    dispatchMockStateChange('export_download_initiated', true);
    window.dispatchEvent(
      new CustomEvent('intentnav:async-ack', {
        detail: { operation: 'export_personal_data', status: 'COMPLETED', timestamp: Date.now() },
      })
    );
    if (feedback) feedback.textContent = 'Personal records download generated.';
  });
}

// 4. Pause Profile / Deactivate
const pauseBtn = document.getElementById('btn-pause-profile');
if (pauseBtn) {
  pauseBtn.addEventListener('click', () => {
    dispatchMockStateChange('account_deactivated', true);
    dispatchMockStateChange('account_active', false);
    if (feedback) feedback.textContent = 'Account placed on temporary hold.';
  });
}

// 5. Tracking / Cookies
const privacyBtn = document.getElementById('btn-privacy-cookies');
if (privacyBtn) {
  privacyBtn.addEventListener('click', () => {
    const isChecked = privacyBtn.getAttribute('aria-checked') === 'true';
    const newChecked = !isChecked;
    privacyBtn.setAttribute('aria-checked', String(newChecked));
    dispatchMockStateChange('analytics_tracking_enabled', newChecked);
    if (feedback) feedback.textContent = `Tracking preferences updated: ${newChecked ? 'ALLOWED' : 'OPTED_OUT'}`;
  });
}

// 6. Disconnect Devices / Revoke Sessions
const disconnectBtn = document.getElementById('btn-disconnect-devices');
if (disconnectBtn) {
  disconnectBtn.addEventListener('click', () => {
    dispatchMockStateChange('active_session_count', 1);
    window.dispatchEvent(
      new CustomEvent('intentnav:async-ack', {
        detail: { operation: 'revoke_other_sessions', status: 'COMPLETED', timestamp: Date.now() },
      })
    );
    if (feedback) feedback.textContent = 'Other devices signed out.';
  });
}

// 7. Night Mode / Dark Mode
const nightBtn = document.getElementById('btn-night-mode');
if (nightBtn) {
  nightBtn.addEventListener('click', () => {
    const isChecked = nightBtn.getAttribute('aria-checked') === 'true';
    const newChecked = !isChecked;
    nightBtn.setAttribute('aria-checked', String(newChecked));
    dispatchMockStateChange('dark_mode_enabled', newChecked);
    if (feedback) feedback.textContent = `Theme set to: ${newChecked ? 'NIGHT' : 'DEFAULT'}`;
  });
}

// 8. Payment Receipt / Invoice
const receiptBtn = document.getElementById('btn-get-receipt');
if (receiptBtn) {
  receiptBtn.addEventListener('click', () => {
    dispatchMockStateChange('invoice_download_triggered', true);
    window.dispatchEvent(
      new CustomEvent('intentnav:async-ack', {
        detail: { operation: 'download_recent_invoice', status: 'COMPLETED', timestamp: Date.now() },
      })
    );
    if (feedback) feedback.textContent = 'Receipt downloaded.';
  });
}

// 9. Activity Records / Audit Log
const activityBtn = document.getElementById('btn-activity-records');
if (activityBtn) {
  activityBtn.addEventListener('click', () => {
    dispatchMockStateChange('audit_logs_visible', true);
    if (feedback) feedback.textContent = 'Sign-in activity log open.';
  });
}
