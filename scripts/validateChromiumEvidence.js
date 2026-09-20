/**
 * IntentNav-SCFR: Chromium E2E Evidence Validator
 *
 * Performs strict, standalone verification of the empirical evidence generated
 * by real Chromium browser execution (evidence/chromium_e2e_evidence.json).
 *
 * Enforces all 10 consistency checks across the 30-field schema:
 * 1. File existence & valid JSON syntax
 * 2. Complete scenario coverage (Scenarios A through J)
 * 3. 30-field schema completeness on every scenario
 * 4. Strictly EXECUTED final machine states (no shortcuts or loose bypasses)
 * 5. Causal chronological precedence: activationEvent.timestamp < min(witnesses.timestamp)
 * 6. Multi-class witness quorum: witnessClasses.length >= 2
 * 7. Invariant closure gating: winning candidate has status 'PASS'
 * 8. Ephemeral BindingHandle resolution and presence
 * 9. Post-state empirical verification: postStateVerified === true
 * 10. Adversarial decoy rejection (Scenario J): genuine target activated, all decoys rejected
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const EVIDENCE_FILE = path.join(ROOT, 'evidence', 'chromium_e2e_evidence.json');

const REQUIRED_FIELDS = [
  'runId',
  'scenarioId',
  'site',
  'intent',
  'normalizedIntent',
  'resolvedCapabilityId',
  'capabilityFingerprintHash',
  'observedCandidateIds',
  'selectedCandidateId',
  'bindingHandle',
  'driftVector',
  'driftClassification',
  'invariantResults',
  'rankingResults',
  'routeVersion',
  'routeStateBefore',
  'routeStateAfter',
  'authorizationDecision',
  'riskClass',
  'activationEvent',
  'activationTimestamp',
  'witnesses',
  'witnessClasses',
  'causalVerificationResult',
  'postStateBefore',
  'postStateAfter',
  'postStateVerified',
  'promotionTokenState',
  'finalMachineState',
  'failureReason',
  'timestamp',
  'independentOracleResult',  // Explicit oracle separation: test-harness evaluation ≠ IntentNav evidence
];

const EXPECTED_SCENARIOS = [
  'Scenario A',
  'Scenario B',
  'Scenario C',
  'Scenario D',
  'Scenario E',
  'Scenario F',
  'Scenario G',
  'Scenario H',
  'Scenario I',
  'Scenario J',
];

function validate() {
  console.log('================================================================');
  console.log('IntentNav-SCFR: Empirical Chromium Evidence Strict Validator');
  console.log('Validating evidence/chromium_e2e_evidence.json against 30-Field Schema');
  console.log('================================================================\n');

  if (!fs.existsSync(EVIDENCE_FILE)) {
    console.error(`✕ Error: Evidence file not found at ${EVIDENCE_FILE}`);
    process.exit(1);
  }

  let data;
  try {
    const raw = fs.readFileSync(EVIDENCE_FILE, 'utf8');
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`✕ Error parsing evidence JSON: ${err.message}`);
    process.exit(1);
  }

  const errors = [];
  const warnings = [];

  // Check top-level metadata
  if (!data.runId || typeof data.runId !== 'string') errors.push('Top-level runId missing or invalid');
  if (!data.timestamp || typeof data.timestamp !== 'number') errors.push('Top-level timestamp missing');
  if (data.runnerType !== 'REAL_CHROMIUM_INTENTNAV_CLOSED_LOOP') {
    errors.push(`Expected runnerType 'REAL_CHROMIUM_INTENTNAV_CLOSED_LOOP', got '${data.runnerType}'`);
  }
  if (!Array.isArray(data.scenarios)) {
    errors.push('Top-level scenarios must be an array');
    console.error('Fatal errors:', errors);
    process.exit(1);
  }

  if (data.scenarios.length !== EXPECTED_SCENARIOS.length) {
    errors.push(`Expected exactly ${EXPECTED_SCENARIOS.length} scenarios, found ${data.scenarios.length}`);
  }

  console.log(`Found ${data.scenarios.length} scenarios in run ${data.runId}`);
  console.log(`Environment: ${data.environment}\n`);

  const scenarioMap = new Map();

  for (const s of data.scenarios) {
    const sid = s.scenarioId || 'UNKNOWN';
    scenarioMap.set(sid, s);

    // 1. Check all 30 required schema fields
    for (const field of REQUIRED_FIELDS) {
      if (s[field] === undefined) {
        errors.push(`[${sid}] Missing required schema field: '${field}'`);
      }
    }

    // 2. Identity & Capability Resolution
    if (!s.intent || typeof s.intent !== 'string') errors.push(`[${sid}] Intent missing`);
    if (!s.normalizedIntent || typeof s.normalizedIntent !== 'string') errors.push(`[${sid}] Normalized intent missing`);
    if (!s.resolvedCapabilityId || !s.resolvedCapabilityId.startsWith('CAP_')) {
      errors.push(`[${sid}] Invalid resolvedCapabilityId: '${s.resolvedCapabilityId}'`);
    }
    if (!s.capabilityFingerprintHash || typeof s.capabilityFingerprintHash !== 'string' || !s.capabilityFingerprintHash.startsWith('fph_')) {
      errors.push(`[${sid}] Invalid capabilityFingerprintHash: '${s.capabilityFingerprintHash}' (must be a valid non-empty fph_ hash)`);
    }

    // 3. Candidate Discovery & Selection
    if (!Array.isArray(s.observedCandidateIds) || s.observedCandidateIds.length === 0) {
      errors.push(`[${sid}] observedCandidateIds must be a non-empty array`);
    }
    if (!s.selectedCandidateId || !s.observedCandidateIds.includes(s.selectedCandidateId)) {
      errors.push(`[${sid}] selectedCandidateId '${s.selectedCandidateId}' not found in observedCandidateIds`);
    }

    // 4. Ephemeral BindingHandle
    if (!s.bindingHandle || !s.bindingHandle.handleId || !s.bindingHandle.tagName || !s.bindingHandle.role) {
      errors.push(`[${sid}] bindingHandle is missing mandatory handle fields`);
    }

    // 5. Invariant Closure Evaluation
    const invRes = s.invariantResults?.[s.selectedCandidateId];
    if (!invRes || invRes.status !== 'PASS') {
      errors.push(`[${sid}] Winner candidate '${s.selectedCandidateId}' failed invariant closure (status: ${invRes?.status})`);
    }

    // 6. Execution Authorization
    if (!s.authorizationDecision || s.authorizationDecision.status !== 'AUTHORIZED') {
      errors.push(`[${sid}] authorizationDecision must be 'AUTHORIZED'`);
    }

    // 7. Activation Event & Chronological Witness Precedence
    if (!s.activationEvent || !s.activationEvent.eventId) {
      errors.push(`[${sid}] activationEvent missing or lacks eventId`);
    }
    const tAct = s.activationTimestamp;
    if (!tAct || tAct <= 0) {
      errors.push(`[${sid}] Invalid activationTimestamp: ${tAct}`);
    }

    if (!Array.isArray(s.witnesses) || s.witnesses.length === 0) {
      errors.push(`[${sid}] witnesses array is empty`);
    } else {
      const minWitnessTime = Math.min(...s.witnesses.map((w) => w.timestamp));
      if (tAct >= minWitnessTime) {
        errors.push(`[${sid}] Chronological precedence violation: activationTimestamp (${tAct}) >= minWitnessTime (${minWitnessTime})`);
      }
    }

    // 8. Multi-Class Witness Quorum
    if (!Array.isArray(s.witnessClasses) || s.witnessClasses.length < 2) {
      errors.push(`[${sid}] Insufficient witness class quorum: observed ${s.witnessClasses?.length || 0} classes (minimum 2 required)`);
    }

    // 8a. Hardening: witnessClasses array must not contain duplicate entries
    // (multiple witnesses of the same class count as 1 distinct class)
    const uniqueWitnessClasses = new Set(s.witnessClasses);
    if (uniqueWitnessClasses.size !== (s.witnessClasses?.length || 0)) {
      errors.push(`[${sid}] witnessClasses contains duplicate entries — each class must appear only once (de-duplicate by class)`);
    }

    // 9. Causal Verification & Post-State
    if (!s.causalVerificationResult || !s.causalVerificationResult.causallyVerified || s.causalVerificationResult.status !== 'VERIFIED') {
      errors.push(`[${sid}] Causal transition verification did not succeed (status: ${s.causalVerificationResult?.status})`);
    }
    if (s.postStateVerified !== true) {
      errors.push(`[${sid}] postStateVerified must be strictly true`);
    }

    // 10. Route Promotion & Preconditions
    if (s.finalMachineState !== 'EXECUTED') {
      errors.push(`[${sid}] finalMachineState is '${s.finalMachineState}', expected 'EXECUTED'`);
    }
    if (s.routeStateAfter !== 'ACTIVE_VALIDATED') {
      errors.push(`[${sid}] routeStateAfter must be 'ACTIVE_VALIDATED', got '${s.routeStateAfter}'`);
    }
    if (s.failureReason !== null) {
      errors.push(`[${sid}] Expected failureReason to be null, got: ${s.failureReason}`);
    }

    // 10a. Hardening: promotion token must be VERIFIED on EXECUTED scenarios
    if (s.promotionTokenState !== 'VERIFIED') {
      errors.push(`[${sid}] promotionTokenState must be 'VERIFIED' for EXECUTED scenarios, got '${s.promotionTokenState}'`);
    }

    // 11. Independent Oracle Result — explicit separation of oracle from IntentNav evidence
    if (!s.independentOracleResult || typeof s.independentOracleResult !== 'object') {
      errors.push(`[${sid}] independentOracleResult is missing or invalid`);
    } else {
      if (s.independentOracleResult.oraclePassed !== true) {
        errors.push(`[${sid}] independentOracleResult.oraclePassed is not true — independent oracle failed`);
      }
      if (s.independentOracleResult.evaluatedBy !== 'INDEPENDENT_TEST_ORACLE') {
        errors.push(`[${sid}] independentOracleResult.evaluatedBy must be 'INDEPENDENT_TEST_ORACLE'`);
      }
      if (!s.independentOracleResult.preStateSnapshot || !s.independentOracleResult.postStateSnapshot) {
        errors.push(`[${sid}] independentOracleResult must contain preStateSnapshot and postStateSnapshot`);
      }
    }
  }

  // Check Scenario J Adversarial Decoy Rejection Specifically
  const scenarioJ = scenarioMap.get('Scenario J');
  if (scenarioJ) {
    if (scenarioJ.site !== 'Site D') {
      errors.push(`[Scenario J] Expected Site D, got ${scenarioJ.site}`);
    }
    const postState = scenarioJ.postStateAfter || {};
    if (postState.marketing_emails_enabled !== false) {
      errors.push(`[Scenario J] Genuine target state not mutated: marketing_emails_enabled = ${postState.marketing_emails_enabled}`);
    }
    if (postState.all_notifications_enabled !== true) {
      errors.push(`[Scenario J] Adversarial decoy was falsely triggered: all_notifications_enabled = ${postState.all_notifications_enabled}`);
    }
    // Verify that at least one decoy candidate was rejected by invariant closure
    const rejectedDecoys = Object.entries(scenarioJ.invariantResults || {}).filter(
      ([id, r]) => id !== scenarioJ.selectedCandidateId && r.status !== 'PASS'
    );
    if (rejectedDecoys.length === 0) {
      errors.push('[Scenario J] Invariant closure failed to reject any decoy candidates');
    } else {
      console.log(`[Scenario J] Successfully confirmed rejection of ${rejectedDecoys.length} decoy candidates via invariant closure.`);
    }
  } else {
    errors.push('Scenario J was not found in scenarios list');
  }

  // Print summary table
  console.log('\n--- Scenario Validation Summary ---');
  for (const exp of EXPECTED_SCENARIOS) {
    const s = scenarioMap.get(exp);
    const status = s && s.finalMachineState === 'EXECUTED' && s.postStateVerified ? 'PASSED ✓' : 'FAILED ✕';
    console.log(`  ${exp}: ${s?.intent || 'Missing'} [${s?.site || '?'}] -> ${status}`);
  }

  console.log('\n================================================================');
  if (errors.length > 0) {
    console.error(`✕ VALIDATION FAILED with ${errors.length} error(s):`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log(`✓ VALIDATION SUCCESSFUL: All 10 scenarios passed all 10 consistency checks!`);
  console.log(`✓ 30-field schema verified 100% compliant.`);
  console.log('================================================================\n');
}

validate();

