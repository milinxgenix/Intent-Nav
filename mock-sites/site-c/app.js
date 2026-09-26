// Mock Site C Logic (Volatile IDs, CSS Modules, Modal Flow)
window.IntentNavMockState = {
  marketing_notifications_enabled: true,
  marketing_emails_enabled: true,
  export_download_initiated: false,
  two_factor_enabled: true,
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

const feedback = document.getElementById('feedback-c');
const modal = document.getElementById('modal-confirm-dialog');

// 1. Marketing
const marketingBtn = document.getElementById(':r3:');
if (marketingBtn) {
  marketingBtn.addEventListener('click', () => {
    const isChecked = marketingBtn.getAttribute('aria-checked') === 'true';
    const newChecked = !isChecked;
    marketingBtn.setAttribute('aria-checked', String(newChecked));
    marketingBtn.textContent = newChecked ? 'Turn Off Marketing Notifications' : 'Turn On Marketing Notifications';
    dispatchMockStateChange('marketing_notifications_enabled', newChecked);
    dispatchMockStateChange('marketing_emails_enabled', newChecked);
    if (feedback) feedback.textContent = `Marketing state: ${newChecked ? 'ACTIVE' : 'DISABLED'}`;
  });
}

// 2. Export
const exportBtn = document.getElementById('ember992');
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    dispatchMockStateChange('export_download_initiated', true);
    window.dispatchEvent(
      new CustomEvent('intentnav:async-ack', {
        detail: { operation: 'export_personal_data', status: 'COMPLETED', timestamp: Date.now() },
      })
    );
    if (feedback) feedback.textContent = 'GDPR archive export generated.';
  });
}

// 3. 2FA Modal Flow
const openModalBtn = document.getElementById('btn-open-2fa-modal');
if (openModalBtn) {
  openModalBtn.addEventListener('click', () => {
    if (modal) modal.classList.add('open');
    // Mock-site fixture layer: automatically handles modal confirmation dialog
    setTimeout(() => {
      if (confirmModalBtn) {
        confirmModalBtn.click();
      }
    }, 25);
  });
}

const confirmModalBtn = document.getElementById('btn-modal-confirm');
if (confirmModalBtn) {
  confirmModalBtn.addEventListener('click', () => {
    if (modal) modal.classList.remove('open');
    dispatchMockStateChange('two_factor_enabled', false);
    if (window.history && window.history.pushState) {
      window.history.pushState({ route: '/security/2fa-disabled' }, '', '#security/2fa-disabled');
      window.dispatchEvent(new PopStateEvent('popstate', { state: { route: '/security/2fa-disabled' } }));
    }
    window.dispatchEvent(
      new CustomEvent('intentnav:client-route-change', {
        detail: { route: '/security/2fa-disabled' },
      })
    );
    if (feedback) feedback.textContent = '2FA removed after modal confirmation.';
  });
}

const cancelModalBtn = document.getElementById('btn-modal-cancel');
if (cancelModalBtn) {
  cancelModalBtn.addEventListener('click', () => {
    if (modal) modal.classList.remove('open');
    if (feedback) feedback.textContent = '2FA removal cancelled.';
  });
}

// 4. Account Deactivation
const deactBtn = document.getElementById('cmp-pause-user');
if (deactBtn) {
  deactBtn.addEventListener('click', () => {
    dispatchMockStateChange('account_deactivated', true);
    dispatchMockStateChange('account_active', false);
    if (feedback) feedback.textContent = 'Account placed in hibernation.';
  });
}

// 5. Telemetry / Tracking
const telemetryBtn = document.getElementById('chk-telemetry');
if (telemetryBtn) {
  telemetryBtn.addEventListener('click', () => {
    const isChecked = telemetryBtn.getAttribute('aria-checked') === 'true';
    const newChecked = !isChecked;
    telemetryBtn.setAttribute('aria-checked', String(newChecked));
    dispatchMockStateChange('analytics_tracking_enabled', newChecked);
    if (feedback) feedback.textContent = `Telemetry state: ${newChecked ? 'ENABLED' : 'DISABLED'}`;
  });
}

// 6. Active Sessions
const sessionsBtn = document.getElementById(':r7:');
if (sessionsBtn) {
  sessionsBtn.addEventListener('click', () => {
    dispatchMockStateChange('active_session_count', 1);
    window.dispatchEvent(
      new CustomEvent('intentnav:async-ack', {
        detail: { operation: 'revoke_other_sessions', status: 'COMPLETED', timestamp: Date.now() },
      })
    );
    if (feedback) feedback.textContent = 'Remote login sessions terminated.';
  });
}

// 7. Dark Mode
const darkBtn = document.getElementById('styled-toggle-99');
if (darkBtn) {
  darkBtn.addEventListener('click', () => {
    const isChecked = darkBtn.getAttribute('aria-checked') === 'true';
    const newChecked = !isChecked;
    darkBtn.setAttribute('aria-checked', String(newChecked));
    dispatchMockStateChange('dark_mode_enabled', newChecked);
    if (feedback) feedback.textContent = `Palette: ${newChecked ? 'DARK' : 'LIGHT'}`;
  });
}

// 8. Download Invoice
const invoiceBtn = document.getElementById('invoice-pdf-down');
if (invoiceBtn) {
  invoiceBtn.addEventListener('click', () => {
    dispatchMockStateChange('invoice_download_triggered', true);
    window.dispatchEvent(
      new CustomEvent('intentnav:async-ack', {
        detail: { operation: 'download_recent_invoice', status: 'COMPLETED', timestamp: Date.now() },
      })
    );
    if (feedback) feedback.textContent = 'Invoice PDF fetched.';
  });
}

// 9. View Audit Trail
const auditBtn = document.getElementById('aria-audit-link');
if (auditBtn) {
  auditBtn.addEventListener('click', () => {
    dispatchMockStateChange('audit_logs_visible', true);
    if (feedback) feedback.textContent = 'Activity trail ledger visible.';
  });
}
