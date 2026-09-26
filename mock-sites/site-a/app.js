// Mock Site A Logic
window.IntentNavMockState = {
  marketing_notifications_enabled: true,
  marketing_emails_enabled: true,
  two_factor_enabled: true,
  export_download_initiated: false,
  account_deactivated: false,
  account_active: true,
  analytics_tracking_enabled: true,
  active_session_count: 3,
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

const feedback = document.getElementById('live-feedback');

// 1. Marketing Notifications Toggle
const marketingBtn = document.getElementById('btn-disable-marketing');
if (marketingBtn) {
  const toggleMarketing = () => {
    const isChecked = marketingBtn.getAttribute('aria-checked') === 'true';
    const newChecked = !isChecked;
    marketingBtn.setAttribute('aria-checked', String(newChecked));
    marketingBtn.textContent = newChecked ? 'Disable Marketing Emails' : 'Enable Marketing Emails';
    dispatchMockStateChange('marketing_notifications_enabled', newChecked);
    dispatchMockStateChange('marketing_emails_enabled', newChecked);
    if (feedback) feedback.textContent = `Marketing emails state: ${newChecked ? 'ENABLED' : 'DISABLED'}`;
  };
  marketingBtn.addEventListener('click', toggleMarketing);
  marketingBtn.addEventListener('change', toggleMarketing);
  marketingBtn.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter' || e.code === 'Space' || e.code === 'Enter') {
      toggleMarketing();
    }
  });
}

// 2. Personal Data Export
const exportBtn = document.getElementById('btn-export-data');
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    dispatchMockStateChange('export_download_initiated', true);
    window.dispatchEvent(
      new CustomEvent('intentnav:async-ack', {
        detail: { operation: 'export_personal_data', status: 'COMPLETED', timestamp: Date.now() },
      })
    );
    if (feedback) feedback.textContent = 'Personal data archive export initiated. Download preparing...';
  });
}

// 3. Two-Factor Authentication Toggle
const twoFaBtn = document.getElementById('btn-disable-2fa');
if (twoFaBtn) {
  twoFaBtn.addEventListener('click', () => {
    dispatchMockStateChange('two_factor_enabled', false);
    if (window.history && window.history.pushState) {
      window.history.pushState({ route: '/settings/security/mfa-off' }, '', '#settings/security/mfa-off');
      window.dispatchEvent(new PopStateEvent('popstate', { state: { route: '/settings/security/mfa-off' } }));
    }
    window.dispatchEvent(
      new CustomEvent('intentnav:client-route-change', {
        detail: { route: '/settings/security/mfa-off' },
      })
    );
    if (feedback) feedback.textContent = 'Two-Factor Authentication disabled.';
  });
}

// 4. Account Deactivation
const deactBtn = document.getElementById('btn-deactivate-account');
if (deactBtn) {
  deactBtn.addEventListener('click', () => {
    dispatchMockStateChange('account_deactivated', true);
    dispatchMockStateChange('account_active', false);
    if (feedback) feedback.textContent = 'Account deactivation executed.';
  });
}

// 5. Tracking / Privacy Toggle
const trackingBtn = document.getElementById('btn-toggle-tracking');
if (trackingBtn) {
  trackingBtn.addEventListener('click', () => {
    const isChecked = trackingBtn.getAttribute('aria-checked') === 'true';
    const newChecked = !isChecked;
    trackingBtn.setAttribute('aria-checked', String(newChecked));
    trackingBtn.textContent = newChecked ? 'Disable Tracking' : 'Enable Tracking';
    dispatchMockStateChange('analytics_tracking_enabled', newChecked);
    if (feedback) feedback.textContent = `Tracking telemetry state: ${newChecked ? 'ENABLED' : 'DISABLED'}`;
  });
}

// 6. Revoke Sessions
const revokeBtn = document.getElementById('btn-revoke-sessions');
if (revokeBtn) {
  revokeBtn.addEventListener('click', () => {
    dispatchMockStateChange('active_session_count', 1);
    window.dispatchEvent(
      new CustomEvent('intentnav:async-ack', {
        detail: { operation: 'revoke_other_sessions', status: 'COMPLETED', timestamp: Date.now() },
      })
    );
    if (feedback) feedback.textContent = 'Other active sessions revoked.';
  });
}

// 7. Dark Mode Toggle
const darkModeBtn = document.getElementById('btn-toggle-dark-mode');
if (darkModeBtn) {
  const toggleDarkMode = () => {
    const isChecked = darkModeBtn.getAttribute('aria-checked') === 'true';
    const newChecked = !isChecked;
    darkModeBtn.setAttribute('aria-checked', String(newChecked));
    dispatchMockStateChange('dark_mode_enabled', newChecked);
    if (feedback) feedback.textContent = `Theme: ${newChecked ? 'DARK' : 'LIGHT'}`;
  };
  darkModeBtn.addEventListener('click', toggleDarkMode);
  darkModeBtn.addEventListener('change', toggleDarkMode);
  darkModeBtn.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter' || e.code === 'Space' || e.code === 'Enter') {
      toggleDarkMode();
    }
  });
}

// 8. Download Invoice
const invoiceBtn = document.getElementById('btn-download-invoice');
if (invoiceBtn) {
  invoiceBtn.addEventListener('click', () => {
    dispatchMockStateChange('invoice_download_triggered', true);
    window.dispatchEvent(
      new CustomEvent('intentnav:async-ack', {
        detail: { operation: 'download_recent_invoice', status: 'COMPLETED', timestamp: Date.now() },
      })
    );
    if (feedback) feedback.textContent = 'Invoice PDF download started.';
  });
}

// 9. View Audit Logs
const auditBtn = document.getElementById('btn-view-audit-logs');
if (auditBtn) {
  auditBtn.addEventListener('click', () => {
    dispatchMockStateChange('audit_logs_visible', true);
    if (feedback) feedback.textContent = 'Security audit log view displayed.';
  });
}
