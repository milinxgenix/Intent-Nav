# IntentNav-SCFR: Mock Site Capability Coverage Matrix

**Date of Audit:** September 16, 2026  
**Status:** Authoritative Specification & Verification Guide  
**Scope:** Complete functional mapping of the 9 benchmark capabilities across Mock Sites A, B, C, and D.

---

## 1. System Capability Catalog & Site Implementation Overview

IntentNav-SCFR defines **Persistent Functional Capability Identity** independently of volatile selectors, CSS class names, and ephemeral DOM positions. The table below specifies the functional contract for all 9 benchmark capabilities and indicates concrete element availability across the 4 test sites.

| # | Capability ID | Canonical Function | Action Type | Target Entity | Risk Class | Site A | Site B | Site C | Site D |
|---|---------------|--------------------|-------------|---------------|------------|:------:|:------:|:------:|:------:|
| 1 | `CAP_DISABLE_MARKETING` | `disable_marketing_notifications` | `MODIFY_PREFERENCE` | `MARKETING_NOTIFICATIONS` | `REVERSIBLE` | Direct | Semantic Drift | Volatile UI | Decoy Traps |
| 2 | `CAP_EXPORT_DATA` | `export_personal_data` | `EXPORT_DATA` | `PERSONAL_DATA_EXPORT` | `SENSITIVE` | Direct | Semantic Drift | Volatile UI | Decoy Traps |
| 3 | `CAP_DISABLE_2FA` | `disable_two_factor_auth` | `TOGGLE` | `TWO_FACTOR_AUTH` | `SECURITY_SENSITIVE` | Direct | Semantic Drift | Modal Flow | Decoy Traps |
| 4 | `CAP_DEACTIVATE_ACCOUNT` | `deactivate_user_account` | `DEACTIVATE_ACCOUNT` | `ACCOUNT_STATUS` | `DESTRUCTIVE` | Direct | Semantic Drift | — | Decoy Traps |
| 5 | `CAP_TOGGLE_TRACKING` | `toggle_analytics_tracking` | `MODIFY_PREFERENCE` | `PRIVACY_SETTINGS` | `REVERSIBLE` | Direct | Semantic Drift | — | Decoy Traps |
| 6 | `CAP_REVOKE_SESSIONS` | `revoke_other_sessions` | `REVOKE_ACCESS` | `SECURITY_SETTINGS` | `SECURITY_SENSITIVE` | Direct | Semantic Drift | — | — |
| 7 | `CAP_TOGGLE_DARK_MODE` | `toggle_dark_theme` | `TOGGLE` | `UI_THEME` | `REVERSIBLE` | Direct | Semantic Drift | — | — |
| 8 | `CAP_DOWNLOAD_INVOICE` | `download_recent_invoice` | `DOWNLOAD` | `BILLING_PREFERENCES` | `REVERSIBLE` | Direct | Semantic Drift | — | — |
| 9 | `CAP_VIEW_AUDIT_LOGS` | `view_security_audit_logs` | `VIEW` | `SECURITY_SETTINGS` | `READ_ONLY` | Direct | Semantic Drift | — | — |

---

## 2. Detailed Site Profiles & Environmental Drift Modes

### Mock Site A: Baseline Clean Portal (`mock-sites/site-a/`)
- **Structure:** Standard semantic HTML5 (`<main>`, `<section role="region">`, `<nav>`).
- **Identifiers:** Canonical labels and visible text matching initial specification.
- **State Channel:** `window.IntentNavMockState` initialized with default settings.
- **Witnesses:** Emits `DOM_MUTATION` (`aria-checked`), `ACCESSIBILITY_STATE_MUTATION`, `APPLICATION_STATE_MUTATION` (`intentnav:mock-state-change`), and `ASYNC_ACKNOWLEDGEMENT` (`intentnav:async-ack`).

### Mock Site B: Semantic & Structural Drift Portal (`mock-sites/site-b/`)
- **Structure:** Restructured hierarchy (`.hub-container`, `.section-card`, flex grid layout).
- **Navigation Order:** Reordered menus (Security first, then Communication Bulletins, then Data Rights).
- **Label Drift:** Synonymous label substitutions:
  - `"Marketing Communications"` $\to$ `"Promotional & Commercial Bulletins"`
  - `"Two-Factor Authentication"` $\to$ `"MFA Verification Shield"`
  - `"Export Personal Data"` $\to$ `"Download Personal Information"`
  - `"Deactivate Account"` $\to$ `"Take a Break From This Account"`
- **Verification:** Evaluates Typed Drift Detector on Contextual Drift ($D_{\text{context}} \ge 0.40$) and Structural Drift ($D_{\text{structure}} \ge 0.45$).

### Mock Site C: Volatile IDs & Framework Artifacts (`mock-sites/site-c/`)
- **Styling & Classes:** CSS-in-JS scrambled class tokens (`.css-19zpn93`, `.css-sc92h1`, `.sc-btn-primary`).
- **Identifiers:** React/Ember dynamic generated IDs (`:r1:`, `:r3:`, `dyn-id-829103`, `ember992`).
- **Interaction Flow:** Multi-step modal confirmation dialog for high-risk actions (2FA disable requires clicking trigger then confirming in modal backdrop).
- **Verification:** Evaluates Volatile Feature Suppressor, Binding Handle isolation, and Presentation Drift ($D_{\text{presentation}} \ge 0.85$, $D_{\text{capability}} = 0.00 \implies \text{MAINTAIN\_ACTIVE}$).

### Mock Site D: Adversarial Decoy Traps (`mock-sites/site-d/`)
- **Adversarial Setup:** Contains high-lexical-similarity semantic traps designed to fool naive keyword and semantic matching:
  - **Decoy 1 (Wrong Target Entity):** `"Disable All Account Notifications"` targets `ALL_NOTIFICATIONS` instead of `MARKETING_NOTIFICATIONS`. Rejected by `POS_PRED_TARGET_ENTITY` and `NEG_PRED_FORBIDDEN_TARGET`.
  - **Decoy 2 (Destructive Action):** `"Delete Marketing Notification History"` performs `DELETE` instead of `MODIFY_PREFERENCE`. Rejected by `POS_PRED_ACTION_TYPE` and `NEG_PRED_FORBIDDEN_ACTION`.
  - **Decoy 3 (Destructive Post-State):** `"Disable Marketing Emails and Erase Profile"` attempts to erase user profile. Rejected by `POS_PRED_ALLOWED_STATE_DELTA` and `NEG_PRED_DECOY_RELATIONSHIP`.
  - **Genuine Target:** `"Disable Marketing Emails"` matching exact invariant closure.
- **Verification:** Proves invariant closure hard gate executes *strictly before* semantic ranking, ensuring 0% execution of destructive traps.

---

## 3. Transition Signatures & Witness Quorum Verification

Every capability execution is verified by `CausalTransitionVerifier` requiring independent multi-source corroboration:

| Capability ID | Pre-State Invariant | Activation Event | Expected Delta | Post-State Invariant | Required Witness Quorum |
|---------------|---------------------|------------------|----------------|----------------------|-------------------------|
| `CAP_DISABLE_MARKETING` | `marketing_notifications_enabled == true` | `click` | `marketing_notifications_enabled: false` | `marketing_notifications_enabled == false` | $\ge 2$ classes (`DOM_MUTATION` + `ACCESSIBILITY_STATE_MUTATION` or `APPLICATION_STATE_MUTATION`) |
| `CAP_EXPORT_DATA` | `export_download_initiated == false` | `click` | `export_download_initiated: true` | `export_download_initiated == true` | $\ge 2$ classes (`DOM_MUTATION` + `ASYNC_ACKNOWLEDGEMENT`) |
| `CAP_DISABLE_2FA` | `two_factor_enabled == true` | `click` | `two_factor_enabled: false` | `two_factor_enabled == false` | $\ge 2$ classes (`DOM_MUTATION` + `APPLICATION_STATE_MUTATION`) |
| `CAP_DEACTIVATE_ACCOUNT` | `account_active == true` | `click` | `account_active: false` | `account_active == false` | $\ge 2$ classes (`DOM_MUTATION` + `APPLICATION_STATE_MUTATION`) |
| `CAP_TOGGLE_TRACKING` | `analytics_tracking_enabled == true` | `click` | `analytics_tracking_enabled: false` | `analytics_tracking_enabled == false` | $\ge 2$ classes (`DOM_MUTATION` + `ACCESSIBILITY_STATE_MUTATION`) |
| `CAP_REVOKE_SESSIONS` | `active_session_count > 1` | `click` | `active_session_count: 1` | `active_session_count == 1` | $\ge 2$ classes (`DOM_MUTATION` + `ASYNC_ACKNOWLEDGEMENT`) |
| `CAP_TOGGLE_DARK_MODE` | `dark_mode_enabled == false` | `click` | `dark_mode_enabled: true` | `dark_mode_enabled == true` | $\ge 2$ classes (`DOM_MUTATION` + `ACCESSIBILITY_STATE_MUTATION`) |
| `CAP_DOWNLOAD_INVOICE` | `invoice_available == true` | `click` | `invoice_download_triggered: true` | `invoice_download_triggered == true` | $\ge 2$ classes (`DOM_MUTATION` + `ASYNC_ACKNOWLEDGEMENT`) |
| `CAP_VIEW_AUDIT_LOGS` | `audit_logs_available == true` | `click` | `audit_logs_visible: true` | `audit_logs_visible == true` | 1 class (`DOM_MUTATION` or `ACCESSIBILITY_STATE_MUTATION`, `READ_ONLY`) |

