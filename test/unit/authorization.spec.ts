/**
 * IntentNav-SCFR: Execution Authorization & Risk Gating Tests
 * ARCHITECTURAL RULE:
 * Capability Confidence != Execution Authorization
 * High capability confidence can NEVER automatically authorize high-risk actions.
 */

import { describe, it, expect } from 'vitest';
import { ExecutionAuthorizationController } from '../../src/core/authorization/controller';
import { FunctionalCapabilityFingerprint } from '../../src/types/capability';
import { InvariantClosureResult } from '../../src/types/invariant';
import { CausalVerificationResult } from '../../src/types/transition';

describe('ExecutionAuthorizationController', () => {
  const highRiskSecurityFingerprint: FunctionalCapabilityFingerprint = {
    capabilityId: 'CAP_DISABLE_2FA',
    canonicalFunction: 'disable_two_factor_auth',
    actionType: 'REVOKE_ACCESS',
    targetEntity: 'TWO_FACTOR_AUTH',
    mandatoryPreStatePredicates: [],
    allowedStateDelta: [],
    expectedPostState: [],
    requiredContextPredicates: [],
    forbiddenContextPredicates: [],
    semanticEvidence: {
      canonicalLabel: 'Disable 2FA',
      semanticSynonyms: [],
      accessibleName: 'Disable two-factor authentication',
      role: 'button',
      visibleLabel: 'Turn Off 2FA',
      sectionMeaning: 'Security',
      actionDescription: 'Disable multi-factor authentication',
    },
    contextEvidence: {} as any,
    transitionEvidence: {} as any,
    riskMetadata: {
      riskClass: 'SECURITY_SENSITIVE',
      reversible: false,
      financial: false,
      security: true,
      destructive: true,
      requiresConfirmation: true,
    },
    provenance: {} as any,
    confidence: { capabilityConfidence: 0.98, routeConfidence: 0.95 },
    negativeEvidence: {} as any,
  };

  const validInvariantResult: InvariantClosureResult = {
    candidateId: 'btn_2fa',
    status: 'PASS',
    isEligibleForRanking: true,
    passedPredicates: [{ predicateId: '1', predicateName: 'Target', isNegativePredicate: false, passed: true, explanation: 'OK' }],
    failedPredicates: [],
    evaluatedTimestamp: Date.now(),
  };

  const validTransitionResult: CausalVerificationResult = {
    signature: {} as any,
    activationEvent: {} as any,
    observedWitnesses: [{} as any, {} as any],
    verifiedWitnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
    status: 'VERIFIED',
    causallyVerified: true,
    durationMs: 90,
    explanation: 'Verified',
  };

  it('strictly REQUIRES confirmation for high-risk actions even when capability confidence is 0.99', () => {
    // High capability confidence = 0.99, but user confirmation NOT yet granted
    const decision = ExecutionAuthorizationController.authorize({
      fingerprint: highRiskSecurityFingerprint,
      capabilityConfidence: 0.99,
      routeConfidence: 0.95,
      invariantResult: validInvariantResult,
      transitionResult: validTransitionResult,
      userConfirmationGranted: false, // NOT granted!
    });

    expect(decision.status).toBe('CONFIRMATION_REQUIRED');
    expect(decision.requiresUserConfirmation).toBe(true);
    expect(decision.policyReason).toContain('explicit user confirmation is mandatory');
    // PROVED: Capability confidence = 0.99 did NOT authorize execution!
  });

  it('authorizes high-risk execution only after explicit user confirmation AND evidence quorum', () => {
    const decision = ExecutionAuthorizationController.authorize({
      fingerprint: highRiskSecurityFingerprint,
      capabilityConfidence: 0.99,
      routeConfidence: 0.95,
      invariantResult: validInvariantResult,
      transitionResult: validTransitionResult,
      userConfirmationGranted: true, // User clicked confirm!
    });

    expect(decision.status).toBe('AUTHORIZED');
    expect(decision.evidenceQuorum.quorumSatisfied).toBe(true);
  });

  it('denies high-risk execution if evidence quorum is incomplete, even with user confirmation', () => {
    // Missing transition verification
    const decision = ExecutionAuthorizationController.authorize({
      fingerprint: highRiskSecurityFingerprint,
      capabilityConfidence: 0.99,
      routeConfidence: 0.95,
      invariantResult: validInvariantResult,
      transitionResult: null, // Quorum incomplete!
      userConfirmationGranted: true,
    });

    expect(decision.status).toBe('DENIED_INSUFFICIENT_QUORUM');
    expect(decision.policyReason).toContain('Evidence quorum incomplete');
  });

  it('authorizes low-risk read-only navigation automatically when confidence is sufficient', () => {
    const lowRiskNavFingerprint = {
      ...highRiskSecurityFingerprint,
      actionType: 'NAVIGATE' as const,
      targetEntity: 'PRIVACY_SETTINGS',
      riskMetadata: {
        riskClass: 'READ_ONLY' as const,
        reversible: true,
        financial: false,
        security: false,
        destructive: false,
        requiresConfirmation: false,
      },
    };

    const decision = ExecutionAuthorizationController.authorize({
      fingerprint: lowRiskNavFingerprint,
      capabilityConfidence: 0.85,
      routeConfidence: 0.85,
      invariantResult: validInvariantResult,
      transitionResult: null,
      userConfirmationGranted: false,
    });

    expect(decision.status).toBe('AUTHORIZED');
  });
});
