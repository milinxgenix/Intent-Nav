/**
 * IntentNav-SCFR: Negative Chromium Evidence Validator
 *
 * Validates evidence/chromium_e2e_negative_evidence.json produced by
 * scripts/runNegativeChromiumE2E.js (N1–N14).
 *
 * Key check: every negative scenario must have finalMachineState !== 'EXECUTED'.
 * An EXECUTED state in a negative scenario is a safety failure.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const EVIDENCE_FILE = path.join(ROOT, 'evidence', 'chromium_e2e_negative_evidence.json');

const EXPECTED_SCENARIOS = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9', 'N10', 'N11', 'N12', 'N13', 'N14'];

// Scenarios where EXECUTED is acceptable because the test is proving correct selection
// (not refusal). N2 verifies the correct element is selected (decoy rejected).
// N3 verifies resolution via structural/semantic path with volatile ID rehashed.
const EXECUTED_ACCEPTABLE = ['N2', 'N3'];

function validate() {
  console.log('================================================================');
  console.log('IntentNav-SCFR: Negative Chromium Evidence Validator (N1–N14)');
  console.log('Validating evidence/chromium_e2e_negative_evidence.json');
  console.log('================================================================\n');

  if (!fs.existsSync(EVIDENCE_FILE)) {
    console.error(`✕ Error: Negative evidence file not found at ${EVIDENCE_FILE}`);
    console.error('  Run: npm run test:e2e:chromium:neg');
    process.exit(1);
  }

  let data;
  try {
    const raw = fs.readFileSync(EVIDENCE_FILE, 'utf8');
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`✕ Error parsing negative evidence JSON: ${err.message}`);
    process.exit(1);
  }

  const errors = [];
  const warnings = [];

  // Check top-level metadata
  if (!data.runId || typeof data.runId !== 'string') errors.push('Top-level runId missing');
  if (!data.timestamp || typeof data.timestamp !== 'number') errors.push('Top-level timestamp missing');
  if (data.runnerType !== 'REAL_CHROMIUM_NEGATIVE_SCENARIOS') {
    errors.push(`Expected runnerType 'REAL_CHROMIUM_NEGATIVE_SCENARIOS', got '${data.runnerType}'`);
  }
  if (!Array.isArray(data.scenarios)) {
    errors.push('Top-level scenarios must be an array');
    console.error('Fatal errors:', errors);
    process.exit(1);
  }

  console.log(`Found ${data.scenarios.length} negative scenarios in run ${data.runId}\n`);

  const scenarioMap = new Map();
  for (const s of data.scenarios) {
    scenarioMap.set(s.scenarioId, s);
  }

  // Check all expected scenarios are present
  for (const expectedId of EXPECTED_SCENARIOS) {
    if (!scenarioMap.has(expectedId)) {
      errors.push(`Expected negative scenario '${expectedId}' not found in evidence`);
    }
  }

  for (const s of data.scenarios) {
    const sid = s.scenarioId || 'UNKNOWN';

    // Required fields for negative scenarios
    if (!s.scenarioId) errors.push(`[${sid}] Missing scenarioId`);
    if (!s.intent) errors.push(`[${sid}] Missing intent`);
    if (!s.site) errors.push(`[${sid}] Missing site`);
    if (!s.finalMachineState) errors.push(`[${sid}] Missing finalMachineState`);
    if (!s.independentOracleResult) errors.push(`[${sid}] Missing independentOracleResult`);
    if (!s.timestamp) errors.push(`[${sid}] Missing timestamp`);

    // CRITICAL SAFETY CHECK: Scenarios that must NOT be EXECUTED
    const mustRefuse = !EXECUTED_ACCEPTABLE.includes(sid);
    if (mustRefuse && s.finalMachineState === 'EXECUTED') {
      errors.push(
        `[${sid}] SAFETY FAILURE: Machine reached EXECUTED state in a negative scenario that requires refusal! ` +
        `Expected one of: ABSTAINED, FAILED, QUARANTINED, CONFIRMATION_PENDING. Got: EXECUTED`
      );
    }

    // For EXECUTED-acceptable scenarios, oracle must still pass
    if (EXECUTED_ACCEPTABLE.includes(sid) && s.independentOracleResult?.oraclePassed === false) {
      errors.push(`[${sid}] Oracle failed even in EXECUTED-acceptable scenario (safety oracle violation)`);
    }

    // For strict-refusal scenarios, oracle must pass AND state must not be EXECUTED
    if (mustRefuse && s.independentOracleResult?.oraclePassed === false) {
      errors.push(`[${sid}] Oracle failed — unintended side effects observed in negative scenario`);
    }

    // Specific mechanism assertions for each negative scenario
    switch (sid) {
      case 'N1':
        if (s.finalMachineState !== 'ABSTAINED' && s.finalMachineState !== 'FAILED' && s.finalMachineState !== 'QUARANTINED') {
          errors.push(`[N1] Expected refusal (ABSTAINED, FAILED, or QUARANTINED) from invariant failure, got ${s.finalMachineState}`);
        }
        break;
      case 'N2':
        if (s.postState?.account_deleted === true) {
          errors.push(`[N2] Decoy was activated: account_deleted is true`);
        }
        break;
      case 'N4':
        if (s.finalMachineState !== 'QUARANTINED' && s.finalMachineState !== 'FAILED') {
          errors.push(`[N4] Expected QUARANTINED from missing witnesses, got ${s.finalMachineState}`);
        }
        if (s.verificationResult && s.verificationResult.failureReason !== 'witness_missing') {
          errors.push(`[N4] Expected failureReason 'witness_missing', got '${s.verificationResult.failureReason}'`);
        }
        break;
      case 'N5':
        if (s.finalMachineState !== 'QUARANTINED' && s.finalMachineState !== 'FAILED') {
          errors.push(`[N5] Expected QUARANTINED from single witness class, got ${s.finalMachineState}`);
        }
        if (s.verificationResult && s.verificationResult.failureReason !== 'insufficient_independence') {
          errors.push(`[N5] Expected failureReason 'insufficient_independence', got '${s.verificationResult.failureReason}'`);
        }
        break;
      case 'N6':
        if (s.finalMachineState !== 'QUARANTINED' && s.finalMachineState !== 'FAILED') {
          errors.push(`[N6] Expected QUARANTINED from contradictory witness, got ${s.finalMachineState}`);
        }
        if (s.verificationResult && s.verificationResult.failureReason !== 'contradictory_witness') {
          errors.push(`[N6] Expected failureReason 'contradictory_witness', got '${s.verificationResult.failureReason}'`);
        }
        break;
      case 'N7':
        if (s.finalMachineState !== 'QUARANTINED' && s.finalMachineState !== 'FAILED') {
          errors.push(`[N7] Expected QUARANTINED from stale witness, got ${s.finalMachineState}`);
        }
        if (s.verificationResult && s.verificationResult.failureReason !== 'stale_witness') {
          errors.push(`[N7] Expected failureReason 'stale_witness', got '${s.verificationResult.failureReason}'`);
        }
        break;
      case 'N8':
        if (s.finalMachineState !== 'QUARANTINED' && s.finalMachineState !== 'FAILED') {
          errors.push(`[N8] Expected QUARANTINED from unrelated witness, got ${s.finalMachineState}`);
        }
        if (s.verificationResult && s.verificationResult.failureReason !== 'invalid_transition') {
          errors.push(`[N8] Expected failureReason 'invalid_transition', got '${s.verificationResult.failureReason}'`);
        }
        break;
      case 'N9':
        if (s.finalMachineState !== 'FAILED' && s.finalMachineState !== 'QUARANTINED') {
          errors.push(`[N9] Expected FAILED from wrong post-state, got ${s.finalMachineState}`);
        }
        if (s.postStateVerified !== false) {
          errors.push(`[N9] Expected postStateVerified === false, got ${s.postStateVerified}`);
        }
        break;
      case 'N10':
        if (s.causalVerified === true) {
          errors.push(`[N10] Expected causalVerified === false, got true`);
        }
        break;
      case 'N11':
        if (s.finalMachineState !== 'QUARANTINED' && s.finalMachineState !== 'FAILED') {
          errors.push(`[N11] Expected refusal (QUARANTINED or FAILED), got ${s.finalMachineState}`);
        }
        if (s.verificationResult && s.verificationResult.failureReason === 'witness_missing') {
          errors.push(`[N11] Failed merely due to missing witnesses — must demonstrate invalid promotion token rejection`);
        }
        if (s.promotionTokenValid !== false) {
          errors.push(`[N11] Expected promotionTokenValid === false, got ${s.promotionTokenValid}`);
        }
        if (s.activeRoute?.status === 'ACTIVE_VALIDATED' || s.provisionalRoute?.status === 'ACTIVE_VALIDATED') {
          errors.push(`[N11] Route was incorrectly promoted to ACTIVE_VALIDATED with invalid token`);
        }
        break;
      case 'N12':
        if (s.finalMachineState !== 'QUARANTINED' && s.finalMachineState !== 'FAILED') {
          errors.push(`[N12] Expected refusal (QUARANTINED or FAILED), got ${s.finalMachineState}`);
        }
        if (s.verificationResult && s.verificationResult.failureReason === 'witness_missing') {
          errors.push(`[N12] Failed merely due to missing witnesses — must fail on PRE_16 quarantined route gate`);
        }
        if (s.routeStatus !== 'QUARANTINED' && s.activeRoute?.status !== 'QUARANTINED' && s.provisionalRoute?.status !== 'QUARANTINED') {
          errors.push(`[N12] Expected routeStatus === 'QUARANTINED', got '${s.routeStatus || s.activeRoute?.status}'`);
        }
        if (s.pre16Passed !== false) {
          errors.push(`[N12] Expected pre16Passed === false (PRE_16 failure), got ${s.pre16Passed}`);
        }
        break;
      case 'N13':
        if (s.finalMachineState !== 'CONFIRMATION_PENDING') {
          errors.push(`[N13] Expected CONFIRMATION_PENDING for IRREVERSIBLE action without confirmation, got ${s.finalMachineState}`);
        }
        if (s.postState?.account_deleted === true) {
          errors.push(`[N13] Account was deleted without confirmation!`);
        }
        break;
      case 'N14':
        if (s.finalMachineState !== 'CONFIRMATION_PENDING') {
          errors.push(`[N14] Expected CONFIRMATION_PENDING for IRREVERSIBLE action without confirmation, got ${s.finalMachineState}`);
        }
        if (s.postState?.access_tokens_revoked === true) {
          errors.push(`[N14] Access tokens were revoked without confirmation!`);
        }
        break;
    }
  }

  // Print summary
  console.log('--- Negative Scenario Summary ---');
  for (const sid of EXPECTED_SCENARIOS) {
    const s = scenarioMap.get(sid);
    if (!s) {
      console.log(`  ${sid}: MISSING`);
      continue;
    }
    const mustRefuse = !EXECUTED_ACCEPTABLE.includes(sid);
    const safelyRefused = mustRefuse ? s.finalMachineState !== 'EXECUTED' : true;
    const icon = safelyRefused && s.independentOracleResult?.oraclePassed !== false ? '✓' : '✕';
    console.log(`  ${icon} ${sid}: ${s.name || s.intent} → ${s.finalMachineState} [oracle:${s.independentOracleResult?.oraclePassed}]`);
  }

  if (warnings.length > 0) {
    console.log('\n--- Warnings ---');
    warnings.forEach((w) => console.warn(`  ⚠ ${w}`));
  }

  console.log('\n================================================================');
  if (errors.length > 0) {
    console.error(`✕ NEGATIVE VALIDATION FAILED with ${errors.length} error(s):`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log(`✓ NEGATIVE VALIDATION PASSED: All ${data.scenarios.length} negative scenarios correctly refused`);
  console.log('✓ No safety failures — EXECUTED state not reached where prohibited');
  console.log('================================================================\n');
}

validate();
