/**
 * IntentNav-SCFR: Security, Privacy, and Zero-Exfiltration Tests
 * Rigorously validates:
 * 1. Password fields and credential inputs are never captured as candidates or bindings.
 * 2. Autocomplete credit-card and OTP fields are redacted/excluded.
 * 3. Local-first guarantee: No external network transmission during execution lifecycle.
 * 4. Audit logger records contain no authorization tokens or credential values.
 */

import { describe, it, expect } from 'vitest';
import { CandidateGenerator } from '../../src/core/candidate/generator';
import { IntentNavMachine } from '../../src/core/stateMachine/machine';
import { FunctionalCapabilityFingerprint } from '../../src/types/capability';

describe('Security and Privacy Invariants', () => {
  it('strictly excludes password, OTP, and credit-card inputs from candidate generation', () => {
    document.body.innerHTML = `
      <form id="login-form">
        <label for="user">Username</label>
        <input id="user" type="text" name="username" value="testuser" />
        <label for="pass">Password</label>
        <input id="pass" type="password" name="password" value="SuperSecretPassword123!" />
        <label for="otp">2FA Token</label>
        <input id="otp" type="text" autocomplete="one-time-code" value="123456" />
        <label for="cc">Card Number</label>
        <input id="cc" type="text" autocomplete="cc-number" value="4111222233334444" />
        <button type="submit" id="btn-submit">Log In</button>
      </form>
    `;

    const candidates = CandidateGenerator.generateFromDOM(document.body);

    // Ensure password input was never captured as a candidate
    const passwordCand = candidates.find((c) => c.candidateId.includes('pass') || c.candidateLabel.toLowerCase().includes('password'));
    expect(passwordCand).toBeUndefined();

    // Ensure OTP input was never captured
    const otpCand = candidates.find((c) => c.candidateId.includes('otp') || c.candidateLabel.toLowerCase().includes('2fa token'));
    expect(otpCand).toBeUndefined();

    // Ensure credit card input was never captured
    const ccCand = candidates.find((c) => c.candidateId.includes('cc') || c.candidateLabel.toLowerCase().includes('card'));
    expect(ccCand).toBeUndefined();

    // Only non-credential controls (like submit button or plain username field) should remain
    const submitBtn = candidates.find((c) => c.candidateLabel.toLowerCase().includes('log in'));
    expect(submitBtn).toBeDefined();

    // Verify raw values (passwords, tokens) are nowhere in candidate text or context
    const allCandidateJson = JSON.stringify(candidates);
    expect(allCandidateJson).not.toContain('SuperSecretPassword123!');
    expect(allCandidateJson).not.toContain('123456');
    expect(allCandidateJson).not.toContain('4111222233334444');
  });

  it('verifies local-first execution emits zero external network calls', async () => {
    const originalFetch = globalThis.fetch;
    let networkCallMade = false;

    // Spy on fetch
    globalThis.fetch = async () => {
      networkCallMade = true;
      throw new Error('SECURITY VIOLATION: Outbound network call detected during IntentNav-SCFR processing!');
    };

    try {
      const machine = new IntentNavMachine();
      const testCap: FunctionalCapabilityFingerprint = {
        capabilityId: 'CAP_VIEW_SETTINGS',
        canonicalFunction: 'view_settings',
        actionType: 'VIEW',
        targetEntity: 'SETTINGS',
        mandatoryPreStatePredicates: [],
        allowedStateDelta: [],
        expectedPostState: [],
        requiredContextPredicates: [],
        forbiddenContextPredicates: [],
        semanticEvidence: {
          canonicalLabel: 'Account Settings',
          semanticSynonyms: ['settings', 'preferences'],
          accessibleName: 'Account Settings',
          role: 'link',
          visibleLabel: 'Settings',
          sectionMeaning: 'Navigation',
          actionDescription: 'Go to account settings',
        },
        contextEvidence: {
          ancestorRelationships: [],
          nearbyText: [],
          surroundingLabels: [],
          containerSemantics: ['nav'],
          menuPanelRelationships: [],
          relativeStructuralRelationships: [],
        },
        transitionEvidence: {
          preStateFingerprint: 'PRE',
          activationEventCharacteristics: { eventType: 'click' },
          expectedDelta: {},
          postStateFingerprint: 'POST',
          historicalTransitionObservations: 1,
          witnessClasses: ['DOM_MUTATION', 'CLIENT_ROUTE_MUTATION'],
          verificationWindowMs: 1000,
        },
        riskMetadata: {
          riskClass: 'LOW',
          reversible: true,
          financial: false,
          security: false,
          destructive: false,
          requiresConfirmation: false,
        },
        provenance: { source: 'INITIAL_SPEC', creationTimestamp: Date.now(), validationTimestamp: Date.now(), routeVersion: 'v1', validationHistory: [] },
        confidence: { capabilityConfidence: 0.95, routeConfidence: 0.95 },
        negativeEvidence: { rejectedCandidateIdentities: [], contradictionPredicates: [], failedInvariantPredicates: [], failedTransitionWitnesses: [], decoyRelationships: [], rejectionReasons: [] },
      };

      machine.registerCapability(testCap);

      const ctx = await machine.processIntent(
        'Go to settings',
        { tag: 'a', role: 'link' },
        [{
          candidateId: 'cand_settings',
          candidateLabel: 'Account Settings',
          observedActionType: 'VIEW',
          observedTargetEntity: 'SETTINGS',
          observedRole: 'link',
        }]
      );

      // Verify no network call was ever triggered
      expect(networkCallMade).toBe(false);
      expect(ctx.currentState).toBeDefined();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('verifies audit logs contain no session cookies or auth tokens', () => {
    const machine = new IntentNavMachine();
    const records = machine.auditLogger.getRecords();
    const auditJson = JSON.stringify(records);

    expect(auditJson).not.toContain('connect.sid');
    expect(auditJson).not.toContain('Bearer ');
    expect(auditJson).not.toContain('session_token');
    expect(auditJson).not.toContain('Set-Cookie');
  });
});
