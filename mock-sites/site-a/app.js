// Mock Site A Logic
const feedback = document.getElementById('live-feedback');

const marketingBtn = document.getElementById('btn-disable-marketing');
if (marketingBtn) {
  marketingBtn.addEventListener('click', () => {
    const isChecked = marketingBtn.getAttribute('aria-checked') === 'true';
    marketingBtn.setAttribute('aria-checked', String(!isChecked));
    marketingBtn.textContent = !isChecked ? 'Disable Marketing Emails' : 'Enable Marketing Emails';
    feedback.textContent = `Marketing emails state: ${!isChecked ? 'ENABLED' : 'DISABLED'}`;
  });
}

const exportBtn = document.getElementById('btn-export-data');
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    feedback.textContent = 'Personal data archive export initiated. Download preparing...';
  });
}

const twoFaBtn = document.getElementById('btn-disable-2fa');
if (twoFaBtn) {
  twoFaBtn.addEventListener('click', () => {
    feedback.textContent = 'Two-Factor Authentication disabled.';
  });
}

const deactBtn = document.getElementById('btn-deactivate-account');
if (deactBtn) {
  deactBtn.addEventListener('click', () => {
    feedback.textContent = 'Account deactivation executed.';
  });
}
