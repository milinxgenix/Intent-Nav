// Mock Site B Logic
const feedback = document.getElementById('feedback-b');

const promoBtn = document.getElementById('btn-promotions-switch');
if (promoBtn) {
  promoBtn.addEventListener('click', () => {
    const isChecked = promoBtn.getAttribute('aria-checked') === 'true';
    promoBtn.setAttribute('aria-checked', String(!isChecked));
    promoBtn.textContent = !isChecked ? 'Stop Promotional Bulletins' : 'Enable Promotional Bulletins';
    feedback.textContent = `Promotional bulletins state: ${!isChecked ? 'ENABLED' : 'MUTED'}`;
  });
}

const recordsBtn = document.getElementById('btn-download-records');
if (recordsBtn) {
  recordsBtn.addEventListener('click', () => {
    feedback.textContent = 'Data archive download initiated.';
  });
}

const mfaBtn = document.getElementById('btn-mfa-protection');
if (mfaBtn) {
  mfaBtn.addEventListener('click', () => {
    feedback.textContent = 'Multi-factor authentication turned off.';
  });
}

const pauseBtn = document.getElementById('btn-pause-profile');
if (pauseBtn) {
  pauseBtn.addEventListener('click', () => {
    feedback.textContent = 'Account placed on temporary pause.';
  });
}
