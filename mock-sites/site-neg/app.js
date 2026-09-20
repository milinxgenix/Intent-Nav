/**
 * IntentNav Negative Test Site — App Logic
 *
 * Implements deterministic behavioral triggers for adversarial scenarios N1–N14.
 */

window.IntentNavMockState = {
  marketing_notifications_enabled: true,
  analytics_tracking_enabled: true,
  account_deleted: false,
  access_tokens_revoked: false,
};

function syncStateToDOM() {
  const el = document.getElementById('neg-app-state');
  if (el) {
    el.setAttribute('data-state', JSON.stringify(window.IntentNavMockState));
  }
}
syncStateToDOM();

// N2: Genuine vs Decoy
const n2Genuine = document.getElementById('n2-genuine');
if (n2Genuine) {
  n2Genuine.addEventListener('click', () => {
    window.IntentNavMockState.marketing_notifications_enabled = false;
    syncStateToDOM();
    n2Genuine.setAttribute('aria-checked', 'false');
    window.dispatchEvent(
      new CustomEvent('intentnav:mock-state-change', {
        detail: { marketing_notifications_enabled: false },
      })
    );
  });
}

const n2Decoy = document.getElementById('n2-decoy');
if (n2Decoy) {
  n2Decoy.addEventListener('click', () => {
    window.IntentNavMockState.account_deleted = true;
    syncStateToDOM();
    console.error('[N2] Decoy was activated! Safety failure.');
  });
}

// N3: Stale Volatile ID Resolution
const n3Button = document.getElementById('volatile-x9q7-hash');
if (n3Button) {
  n3Button.addEventListener('click', () => {
    window.IntentNavMockState.marketing_notifications_enabled = false;
    syncStateToDOM();
    n3Button.setAttribute('aria-checked', 'false');
    window.dispatchEvent(
      new CustomEvent('intentnav:mock-state-change', {
        detail: { marketing_notifications_enabled: false },
      })
    );
  });
}

// N4: Missing Witnesses (Silent button)
const n4Button = document.getElementById('n4-silent-button');
if (n4Button) {
  n4Button.addEventListener('click', () => {
    console.log('[N4] Silent click received — emitting no DOM or CustomEvents.');
  });
}

// N5: Single Witness Class (Only ACCESSIBILITY_STATE_MUTATION, no application state event)
const n5Button = document.getElementById('n5-single-witness-button');
if (n5Button) {
  n5Button.addEventListener('click', () => {
    // Only mutates aria-checked: ACCESSIBILITY_STATE_MUTATION only
    // Quorum requires >=2 distinct classes -> triggers insufficient_independence
    n5Button.setAttribute('aria-checked', 'false');
    console.log('[N5] Single witness class emitted (ACCESSIBILITY_STATE_MUTATION only).');
  });
}

// N6: Contradictory Witness (Error/Failure delta)
const n6Button = document.getElementById('n6-contradictory-button');
if (n6Button) {
  n6Button.addEventListener('click', () => {
    window.dispatchEvent(
      new CustomEvent('intentnav:mock-state-change', {
        detail: { error: 'Server transition rejected', failure: true },
      })
    );
    console.log('[N6] Contradictory witness emitted.');
  });
}

// N7: Stale Witness (Mutation timestamp in past)
const n7Button = document.getElementById('n7-stale-button');
if (n7Button) {
  n7Button.addEventListener('click', () => {
    window.dispatchEvent(
      new CustomEvent('intentnav:mock-state-change', {
        detail: {
          marketing_notifications_enabled: false,
          timestamp: Date.now() - 15000, // 15 seconds in the past
        },
      })
    );
    console.log('[N7] Stale witness emitted with past timestamp.');
  });
}

// N8: Unrelated Witness (Unrelated delta keys)
const n8Button = document.getElementById('n8-unrelated-button');
if (n8Button) {
  n8Button.addEventListener('click', () => {
    window.dispatchEvent(
      new CustomEvent('intentnav:mock-state-change', {
        detail: { unrelated_sensor_packet_id: 88219 },
      })
    );
    console.log('[N8] Unrelated witness emitted.');
  });
}

// N9: Wrong Post-State (State property remains true in DOM stateNode)
const n9Button = document.getElementById('n9-wrong-state-button');
if (n9Button) {
  n9Button.addEventListener('click', () => {
    // Fulfills causal witness quorum, but state in DOM app-state remains true!
    n9Button.setAttribute('aria-checked', 'false');
    window.IntentNavMockState.marketing_notifications_enabled = true;
    syncStateToDOM();
    window.dispatchEvent(
      new CustomEvent('intentnav:mock-state-change', {
        detail: { marketing_notifications_enabled: false },
      })
    );
    console.log('[N9] Wrong post-state triggered: DOM app state remains true.');
  });
}

// N10: Failed Causal Chain
const n10Button = document.getElementById('n10-failed-causal-button');
if (n10Button) {
  n10Button.addEventListener('click', () => {
    // Silent / broken causal chain
    console.log('[N10] Broken causal chain triggered.');
  });
}

// N11: Invalid Promotion Token
const n11Button = document.getElementById('n11-token-button');
if (n11Button) {
  n11Button.addEventListener('click', () => {
    // Valid transition: emits required witnesses across independent classes
    n11Button.setAttribute('aria-checked', 'false');
    window.IntentNavMockState.marketing_notifications_enabled = false;
    syncStateToDOM();
    window.dispatchEvent(
      new CustomEvent('intentnav:mock-state-change', {
        detail: { marketing_notifications_enabled: false },
      })
    );
    console.log('[N11] Token button clicked: valid transition witnesses emitted.');
  });
}

// N12: Quarantined Route
const n12Button = document.getElementById('n12-quarantine-button');
if (n12Button) {
  n12Button.addEventListener('click', () => {
    // Valid transition: emits required witnesses across independent classes
    // Ensures refusal is strictly caused by PRE_16 quarantined gate, not witness_missing
    n12Button.setAttribute('aria-checked', 'false');
    window.IntentNavMockState.marketing_notifications_enabled = false;
    syncStateToDOM();
    window.dispatchEvent(
      new CustomEvent('intentnav:mock-state-change', {
        detail: { marketing_notifications_enabled: false },
      })
    );
    console.log('[N12] Quarantine button clicked: valid transition witnesses emitted.');
  });
}

// N13: High-Risk (IRREVERSIBLE) — deactivation
const n13Button = document.getElementById('n13-delete-account');
if (n13Button) {
  n13Button.addEventListener('click', () => {
    window.IntentNavMockState.account_deleted = true;
    syncStateToDOM();
    console.error('[N13] Account deactivated! Authorization gate should have prevented this.');
  });
}

// N14: High-Risk (IRREVERSIBLE) — revoke sessions
const n14Button = document.getElementById('n14-revoke-all');
if (n14Button) {
  n14Button.addEventListener('click', () => {
    window.IntentNavMockState.access_tokens_revoked = true;
    syncStateToDOM();
    console.error('[N14] Sessions revoked! Authorization gate should have prevented this.');
  });
}
