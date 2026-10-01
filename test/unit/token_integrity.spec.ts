/**
 * IntentNav-SCFR: Patent Hardening Step 1 — Cryptographic Promotion-Token Integrity Tests
 *
 * Verifies:
 * - TEST 1: Valid HMAC-SHA-256 token minted by CausalTransitionVerifier promotes provisional route to ACTIVE_VALIDATED
 * - TEST 2: Tampered routeId fails even if all other fields look valid
 * - TEST 3: Tampered capabilityId fails
 * - TEST 4: Tampered activationEventId fails
 * - TEST 5: Tampered verifiedWitnessClasses / witnessDigest fails
 * - TEST 6: Tampered transitionSignature / transitionBinding fails
 * - TEST 7: Tampered issuedTimestamp fails
 * - TEST 8: Forged signatureHash with valid routeId, capabilityId, activationEventId, witness quorum,
 *           transitionBinding, and witnessDigest fails solely on HMAC-SHA-256 verification
 * - TEST 9: Replay across route versions, capabilities, and re-promotion attempts fails
 * - Canonical serialization determinism (key-order independence) and secret-key isolation
 */

import { describe, it, expect } from 'vitest';
import { CapabilityGraphEngine } from '../../src/core/graph/capabilityGraph';
import { RouteManager } from '../../src/core/graph/routeManager';
import { QuarantineController } from '../../src/core/quarantine/controller';
import { RoutePromotionController } from '../../src/core/quarantine/promotion';
import {
  PromotionTokenAuthenticator,
  canonicalize,
} from '../../src/core/quarantine/tokenAuthenticator';
import { NegativeEvidenceStore } from '../../src/core/contradiction/store';
import { CausalTransitionVerifier } from '../../src/core/causal/verifier';
import { IntentNavMachine, ExecutionDispatcher } from '../../src/core/stateMachine/machine';
import {
  ActivationEventRecord,
  TransitionSignature,
  TransitionWitness,
  TransitionVerificationToken,
} from '../../src/types/transition';
import { FunctionalCapabilityFingerprint } from '../../src/types/capability';

describe('Patent Hardening Step 1: Cryptographic Promotion-Token Integrity (HMAC-SHA-256)', () => {
  const sampleSignature: TransitionSignature = {
    preStateFingerprint: 'STATE_SETTINGS_PRE_V1',
    activationEventExpected: {
      eventType: 'click',
    },
    expectedStateDelta: {
      marketingEmailsEnabled: false,
      ariaChecked: 'false',
    },
    verificationWindowMs: 2000,
    postStateFingerprint: 'STATE_SETTINGS_POST_V1',
  };

  const createSampleActivationAndWitnesses = (
    capabilityId = 'CAP_DISABLE_MARKETING',
    eventId = 'act_evt_1001',
    t0 = 1700000000000
  ): { activationEvent: ActivationEventRecord; witnesses: TransitionWitness[] } => {
    const activationEvent: ActivationEventRecord = {
      eventId,
      sequenceNumber: 1,
      timestamp: t0,
      targetCandidateId: 'cand_mkt_switch',
      eventType: 'click',
      initiatingCapabilityId: capabilityId,
    };

    const witnesses: TransitionWitness[] = [
      {
        witnessId: 'wit_dom_1',
        witnessClass: 'DOM_MUTATION',
        sequenceNumber: 2,
        timestamp: t0 + 45,
        observedDelta: { marketingEmailsEnabled: false },
        correlatedActivationEventId: eventId,
        temporalDeltaMs: 45,
        isCausallyCorrelated: true,
        correlationExplanation: 'DOM switch state updated',
      },
      {
        witnessId: 'wit_a11y_1',
        witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
        sequenceNumber: 3,
        timestamp: t0 + 60,
        observedDelta: { ariaChecked: 'false' },
        correlatedActivationEventId: eventId,
        temporalDeltaMs: 60,
        isCausallyCorrelated: true,
        correlationExplanation: 'aria-checked transitioned to false',
      },
    ];

    return { activationEvent, witnesses };
  };

  it('TEST 1 — Valid HMAC-SHA-256 token minted by CausalTransitionVerifier promotes provisional route to ACTIVE_VALIDATED', async () => {
    const authenticator = new PromotionTokenAuthenticator();
    const graph = new CapabilityGraphEngine();
    const routeManager = new RouteManager(graph, authenticator);
    const verifier = new CausalTransitionVerifier({ tokenAuthenticator: authenticator });

    const provisional = routeManager.createProvisionalRoute('CAP_DISABLE_MARKETING', [], 0.94);
    expect(provisional.status).toBe('PROVISIONAL');

    const { activationEvent, witnesses } = createSampleActivationAndWitnesses();
    const verificationResult = verifier.verifyTransition(
      sampleSignature,
      activationEvent,
      witnesses,
      'STATE_SETTINGS_POST_V1',
      provisional.routeId
    );

    expect(verificationResult.causallyVerified).toBe(true);
    expect(verificationResult.status).toBe('VERIFIED');
    expect(verificationResult.verificationToken).toBeDefined();
    expect(verificationResult.verificationToken?.algorithm).toBe('HMAC-SHA-256');
    expect(verificationResult.verificationToken?.signatureHash).toMatch(/^hmac_sha256_[0-9a-f]{64}$/);
    expect(verificationResult.verificationToken?.transitionBinding).toMatch(/^tb_sha256_[0-9a-f]{64}$/);
    expect(verificationResult.verificationToken?.witnessDigest).toMatch(/^wd_sha256_[0-9a-f]{64}$/);

    const promoted = routeManager.promoteToActive(
      'CAP_DISABLE_MARKETING',
      provisional.routeId,
      verificationResult.verificationToken!
    );

    expect(promoted.status).toBe('ACTIVE_VALIDATED');
    expect(graph.getActiveRoute('CAP_DISABLE_MARKETING')?.routeId).toBe(provisional.routeId);
  });

  it('TEST 2 — Tampered routeId fails even if all other fields look valid', () => {
    const authenticator = new PromotionTokenAuthenticator();
    const graph = new CapabilityGraphEngine();
    const routeManager = new RouteManager(graph, authenticator);
    const verifier = new CausalTransitionVerifier({ tokenAuthenticator: authenticator });

    const routeA = routeManager.createProvisionalRoute('CAP_DISABLE_MARKETING', [], 0.92);
    const routeB = routeManager.createProvisionalRoute('CAP_DISABLE_MARKETING', [], 0.91);

    const { activationEvent, witnesses } = createSampleActivationAndWitnesses();
    const resA = verifier.verifyTransition(
      sampleSignature,
      activationEvent,
      witnesses,
      'STATE_SETTINGS_POST_V1',
      routeA.routeId
    );
    const tokenA = resA.verificationToken!;

    // Case 2a: Present unmodified tokenA to promote routeB
    expect(() => {
      routeManager.promoteToActive('CAP_DISABLE_MARKETING', routeB.routeId, tokenA);
    }).toThrow(/INVARIANT VIOLATION: Token routeId '.*' does not match target routeId/);
    expect(graph.getCapability('CAP_DISABLE_MARKETING')?.routeVersions[routeB.routeId]?.status).toBe(
      'PROVISIONAL'
    );

    // Case 2b: Mutate tokenA.routeId = routeB.routeId without re-signing so structural routeId check passes,
    // proving HMAC-SHA-256 rejects the tampered routeId
    const mutatedRouteToken: TransitionVerificationToken = {
      ...tokenA,
      routeId: routeB.routeId,
    };
    const authCheck = authenticator.verifyToken(mutatedRouteToken, {
      expectedRouteId: routeB.routeId,
      expectedCapabilityId: 'CAP_DISABLE_MARKETING',
    });
    expect(authCheck.valid).toBe(false);
    expect(authCheck.failedCheck).toBe('HMAC_SIGNATURE_INVALID');

    expect(() => {
      routeManager.promoteToActive('CAP_DISABLE_MARKETING', routeB.routeId, mutatedRouteToken);
    }).toThrow(/INVARIANT VIOLATION: Token signature hash is invalid or forged/);
    expect(graph.getCapability('CAP_DISABLE_MARKETING')?.routeVersions[routeB.routeId]?.status).toBe(
      'PROVISIONAL'
    );
    expect(graph.getActiveRoute('CAP_DISABLE_MARKETING')).toBeNull();
  });

  it('TEST 3 — Tampered capabilityId fails', () => {
    const authenticator = new PromotionTokenAuthenticator();
    const graph = new CapabilityGraphEngine();
    const routeManager = new RouteManager(graph, authenticator);
    const verifier = new CausalTransitionVerifier({ tokenAuthenticator: authenticator });

    const routeCapA = routeManager.createProvisionalRoute('CAP_A', [], 0.93);
    const routeCapB = routeManager.createProvisionalRoute('CAP_B', [], 0.93);

    const { activationEvent, witnesses } = createSampleActivationAndWitnesses('CAP_A');
    const resA = verifier.verifyTransition(
      sampleSignature,
      activationEvent,
      witnesses,
      'STATE_SETTINGS_POST_V1',
      routeCapB.routeId
    );
    const tokenA = resA.verificationToken!;

    // Mutate capabilityId to 'CAP_B' without re-signing
    const tamperedCapToken: TransitionVerificationToken = {
      ...tokenA,
      capabilityId: 'CAP_B',
    };

    const authCheck = authenticator.verifyToken(tamperedCapToken, {
      expectedRouteId: routeCapB.routeId,
      expectedCapabilityId: 'CAP_B',
    });
    expect(authCheck.valid).toBe(false);
    expect(authCheck.failedCheck).toBe('HMAC_SIGNATURE_INVALID');

    expect(() => {
      routeManager.promoteToActive('CAP_B', routeCapB.routeId, tamperedCapToken);
    }).toThrow(/INVARIANT VIOLATION: Token signature hash is invalid or forged/);
    expect(graph.getCapability('CAP_B')?.routeVersions[routeCapB.routeId]?.status).toBe('PROVISIONAL');
    expect(graph.getCapability('CAP_A')?.routeVersions[routeCapA.routeId]?.status).toBe('PROVISIONAL');
  });

  it('TEST 4 — Tampered activationEventId fails', () => {
    const authenticator = new PromotionTokenAuthenticator();
    const graph = new CapabilityGraphEngine();
    const routeManager = new RouteManager(graph, authenticator);
    const verifier = new CausalTransitionVerifier({ tokenAuthenticator: authenticator });

    const route = routeManager.createProvisionalRoute('CAP_DISABLE_MARKETING', [], 0.92);
    const { activationEvent, witnesses } = createSampleActivationAndWitnesses(
      'CAP_DISABLE_MARKETING',
      'act_1'
    );
    const res = verifier.verifyTransition(
      sampleSignature,
      activationEvent,
      witnesses,
      'STATE_SETTINGS_POST_V1',
      route.routeId
    );

    // Mutate activationEventId from 'act_1' to 'act_2' without re-signing
    const tamperedActToken: TransitionVerificationToken = {
      ...res.verificationToken!,
      activationEventId: 'act_2',
    };

    expect(() => {
      routeManager.promoteToActive('CAP_DISABLE_MARKETING', route.routeId, tamperedActToken);
    }).toThrow(/INVARIANT VIOLATION/);

    // Even if attacker also recomputes unkeyed witnessDigest for 'act_2', HMAC-SHA-256 still rejects it
    const recomputedWd = authenticator.computeWitnessDigest(
      tamperedActToken.verifiedWitnessClasses,
      'act_2',
      tamperedActToken.witnessEvidenceHash
    );
    const tamperedActWithRecomputedDigest: TransitionVerificationToken = {
      ...tamperedActToken,
      witnessDigest: recomputedWd,
    };

    const authCheck = authenticator.verifyToken(tamperedActWithRecomputedDigest, {
      expectedRouteId: route.routeId,
      expectedCapabilityId: 'CAP_DISABLE_MARKETING',
    });
    expect(authCheck.valid).toBe(false);
    expect(authCheck.failedCheck).toBe('HMAC_SIGNATURE_INVALID');

    expect(() => {
      routeManager.promoteToActive(
        'CAP_DISABLE_MARKETING',
        route.routeId,
        tamperedActWithRecomputedDigest
      );
    }).toThrow(/INVARIANT VIOLATION: Token signature hash is invalid or forged/);
    expect(graph.getCapability('CAP_DISABLE_MARKETING')?.routeVersions[route.routeId]?.status).toBe(
      'PROVISIONAL'
    );
  });

  it('TEST 5 — Tampered verifiedWitnessClasses fails', () => {
    const authenticator = new PromotionTokenAuthenticator();
    const graph = new CapabilityGraphEngine();
    const routeManager = new RouteManager(graph, authenticator);
    const verifier = new CausalTransitionVerifier({ tokenAuthenticator: authenticator });

    const route = routeManager.createProvisionalRoute('CAP_DISABLE_MARKETING', [], 0.92);
    const { activationEvent, witnesses } = createSampleActivationAndWitnesses();
    const res = verifier.verifyTransition(
      sampleSignature,
      activationEvent,
      witnesses,
      'STATE_SETTINGS_POST_V1',
      route.routeId
    );

    // Mutate verifiedWitnessClasses after signing (keeping >=2 classes so quorum check passes)
    const tamperedClassesToken: TransitionVerificationToken = {
      ...res.verificationToken!,
      verifiedWitnessClasses: ['DOM_MUTATION', 'HISTORY_STATE_MUTATION'],
    };

    expect(() => {
      routeManager.promoteToActive('CAP_DISABLE_MARKETING', route.routeId, tamperedClassesToken);
    }).toThrow(/INVARIANT VIOLATION/);

    // Even if attacker recomputes witnessDigest for the mutated classes, HMAC-SHA-256 rejects it
    const recomputedWd = authenticator.computeWitnessDigest(
      ['DOM_MUTATION', 'HISTORY_STATE_MUTATION'],
      tamperedClassesToken.activationEventId,
      tamperedClassesToken.witnessEvidenceHash
    );
    const tamperedClassesWithDigest: TransitionVerificationToken = {
      ...tamperedClassesToken,
      witnessDigest: recomputedWd,
    };

    const authCheck = authenticator.verifyToken(tamperedClassesWithDigest, {
      expectedRouteId: route.routeId,
      expectedCapabilityId: 'CAP_DISABLE_MARKETING',
    });
    expect(authCheck.valid).toBe(false);
    expect(authCheck.failedCheck).toBe('HMAC_SIGNATURE_INVALID');

    expect(() => {
      routeManager.promoteToActive('CAP_DISABLE_MARKETING', route.routeId, tamperedClassesWithDigest);
    }).toThrow(/INVARIANT VIOLATION: Token signature hash is invalid or forged/);
    expect(graph.getCapability('CAP_DISABLE_MARKETING')?.routeVersions[route.routeId]?.status).toBe(
      'PROVISIONAL'
    );
  });

  it('TEST 6 — Tampered transitionSignature / transitionBinding fails', () => {
    const authenticator = new PromotionTokenAuthenticator();
    const graph = new CapabilityGraphEngine();
    const routeManager = new RouteManager(graph, authenticator);
    const verifier = new CausalTransitionVerifier({ tokenAuthenticator: authenticator });

    const route = routeManager.createProvisionalRoute('CAP_DISABLE_MARKETING', [], 0.92);
    const { activationEvent, witnesses } = createSampleActivationAndWitnesses();
    const res = verifier.verifyTransition(
      sampleSignature,
      activationEvent,
      witnesses,
      'STATE_SETTINGS_POST_V1',
      route.routeId
    );

    // Case 6a: Mutate transitionSignature after signing
    const mutatedSig: TransitionSignature = {
      ...sampleSignature,
      postStateFingerprint: 'TAMPERED_POST_STATE_FINGERPRINT',
    };
    const tamperedSigToken: TransitionVerificationToken = {
      ...res.verificationToken!,
      transitionSignature: mutatedSig,
    };

    expect(() => {
      routeManager.promoteToActive('CAP_DISABLE_MARKETING', route.routeId, tamperedSigToken);
    }).toThrow(/INVARIANT VIOLATION: Token transitionBinding does not match/);

    // Case 6b: Mutate both transitionSignature and transitionBinding (recomputing SHA-256 of mutatedSig)
    // without possessing the secret HMAC key -> rejected by HMAC-SHA-256 verification
    const recomputedTb = authenticator.computeTransitionBinding(mutatedSig);
    const tamperedBindingToken: TransitionVerificationToken = {
      ...tamperedSigToken,
      transitionBinding: recomputedTb,
    };

    const authCheck = authenticator.verifyToken(tamperedBindingToken, {
      expectedRouteId: route.routeId,
      expectedCapabilityId: 'CAP_DISABLE_MARKETING',
    });
    expect(authCheck.valid).toBe(false);
    expect(authCheck.failedCheck).toBe('HMAC_SIGNATURE_INVALID');

    expect(() => {
      routeManager.promoteToActive('CAP_DISABLE_MARKETING', route.routeId, tamperedBindingToken);
    }).toThrow(/INVARIANT VIOLATION: Token signature hash is invalid or forged/);
    expect(graph.getCapability('CAP_DISABLE_MARKETING')?.routeVersions[route.routeId]?.status).toBe(
      'PROVISIONAL'
    );
  });

  it('TEST 7 — Tampered issuedTimestamp fails', () => {
    const authenticator = new PromotionTokenAuthenticator();
    const graph = new CapabilityGraphEngine();
    const routeManager = new RouteManager(graph, authenticator);
    const verifier = new CausalTransitionVerifier({ tokenAuthenticator: authenticator });

    const route = routeManager.createProvisionalRoute('CAP_DISABLE_MARKETING', [], 0.92);
    const { activationEvent, witnesses } = createSampleActivationAndWitnesses();
    const res = verifier.verifyTransition(
      sampleSignature,
      activationEvent,
      witnesses,
      'STATE_SETTINGS_POST_V1',
      route.routeId
    );

    const tamperedTimestampToken: TransitionVerificationToken = {
      ...res.verificationToken!,
      issuedTimestamp: res.verificationToken!.issuedTimestamp + 1000,
    };

    const authCheck = authenticator.verifyToken(tamperedTimestampToken, {
      expectedRouteId: route.routeId,
      expectedCapabilityId: 'CAP_DISABLE_MARKETING',
    });
    expect(authCheck.valid).toBe(false);
    expect(authCheck.failedCheck).toBe('HMAC_SIGNATURE_INVALID');

    expect(() => {
      routeManager.promoteToActive('CAP_DISABLE_MARKETING', route.routeId, tamperedTimestampToken);
    }).toThrow(/INVARIANT VIOLATION: Token signature hash is invalid or forged/);
    expect(graph.getCapability('CAP_DISABLE_MARKETING')?.routeVersions[route.routeId]?.status).toBe(
      'PROVISIONAL'
    );
  });

  it('TEST 8 — Forged signatureHash with VALID routeId and VALID capabilityId fails solely on cryptographic verification', async () => {
    const authenticator = new PromotionTokenAuthenticator();
    const graph = new CapabilityGraphEngine();
    const routeManager = new RouteManager(graph, authenticator);
    const negStore = new NegativeEvidenceStore();
    const quarantine = new QuarantineController(routeManager, negStore);
    const promotion = new RoutePromotionController(routeManager, quarantine);
    const verifier = new CausalTransitionVerifier({ tokenAuthenticator: authenticator });

    const route = routeManager.createProvisionalRoute('CAP_DISABLE_MARKETING', [], 0.95);
    const { activationEvent, witnesses } = createSampleActivationAndWitnesses();
    const res = verifier.verifyTransition(
      sampleSignature,
      activationEvent,
      witnesses,
      'STATE_SETTINGS_POST_V1',
      route.routeId
    );
    const validToken = res.verificationToken!;

    // Flip a single hex character in the valid 64-char HMAC-SHA-256 signature while keeping
    // routeId, capabilityId, activationEventId, verifiedWitnessClasses (>=2), verifiedStatus='VERIFIED',
    // transitionBinding, witnessDigest, and issuedTimestamp 100% valid!
    const validHex = validToken.signatureHash.slice('hmac_sha256_'.length);
    const flippedFirstChar = validHex[0] === 'a' ? 'b' : 'a';
    const forgedHmacHash = `hmac_sha256_${flippedFirstChar}${validHex.slice(1)}`;

    const forgedTokenWithAllValidFields: TransitionVerificationToken = {
      ...validToken,
      signatureHash: forgedHmacHash,
    };

    // Confirm all structural fields match the target route and capability
    expect(forgedTokenWithAllValidFields.routeId).toBe(route.routeId);
    expect(forgedTokenWithAllValidFields.capabilityId).toBe('CAP_DISABLE_MARKETING');
    expect(forgedTokenWithAllValidFields.activationEventId).toBe(activationEvent.eventId);
    expect(forgedTokenWithAllValidFields.verifiedWitnessClasses.length).toBeGreaterThanOrEqual(2);
    expect(forgedTokenWithAllValidFields.verifiedStatus).toBe('VERIFIED');

    // Verify authenticator specifically flags HMAC_SIGNATURE_INVALID
    const authOutcome = authenticator.verifyToken(forgedTokenWithAllValidFields, {
      expectedRouteId: route.routeId,
      expectedCapabilityId: 'CAP_DISABLE_MARKETING',
      expectedActivationEventId: activationEvent.eventId,
      expectedTransitionSignature: sampleSignature,
    });
    expect(authOutcome.valid).toBe(false);
    expect(authOutcome.failedCheck).toBe('HMAC_SIGNATURE_INVALID');

    // Direct RouteManager.promoteToActive must throw
    expect(() => {
      routeManager.promoteToActive(
        'CAP_DISABLE_MARKETING',
        route.routeId,
        forgedTokenWithAllValidFields
      );
    }).toThrow(/INVARIANT VIOLATION: Token signature hash is invalid or forged/);

    // Also test a token signed by an attacker's separate PromotionTokenAuthenticator instance (wrong secret key)
    const attackerAuthenticator = new PromotionTokenAuthenticator();
    const wrongKeyToken = attackerAuthenticator.issueToken({
      routeId: route.routeId,
      capabilityId: 'CAP_DISABLE_MARKETING',
      activationEventId: activationEvent.eventId,
      verifiedWitnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
      transitionSignature: sampleSignature,
      observedWitnesses: witnesses,
    });
    expect(() => {
      routeManager.promoteToActive('CAP_DISABLE_MARKETING', route.routeId, wrongKeyToken);
    }).toThrow(/INVARIANT VIOLATION: Token signature hash is invalid or forged/);

    // RoutePromotionController must reject and quarantine the route
    const promoDecision = promotion.evaluateAndPromote('CAP_DISABLE_MARKETING', route.routeId, {
      ...res,
      verificationToken: forgedTokenWithAllValidFields,
    });
    expect(promoDecision.promoted).toBe(false);
    expect(promoDecision.failureReason).toBe('invalid_promotion_token');
    expect(promoDecision.route.status).toBe('QUARANTINED');
    expect(graph.getActiveRoute('CAP_DISABLE_MARKETING')).toBeNull();

    // Also verify IntentNavMachine with { corruptPromotionToken: true } keeps routeId valid and fails on forged HMAC
    const machine = new IntentNavMachine();
    const capFp: FunctionalCapabilityFingerprint = {
      capabilityId: 'CAP_DISABLE_MARKETING',
      canonicalFunction: 'disable_marketing_communications',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'MARKETING_NOTIFICATIONS',
      mandatoryPreStatePredicates: [],
      allowedStateDelta: [{ property: 'checked', expectedChange: 'ENABLED_TO_DISABLED' }],
      expectedPostState: [{ property: 'marketing_emails_enabled', expectedValue: false }],
      requiredContextPredicates: [],
      forbiddenContextPredicates: [],
      semanticEvidence: {
        canonicalLabel: 'Disable marketing emails',
        semanticSynonyms: ['turn off promotional emails', 'stop marketing notifications'],
        accessibleName: 'Marketing email toggle',
        role: 'switch',
        visibleLabel: 'Marketing',
        sectionMeaning: 'Notifications',
        actionDescription: 'Disable marketing emails',
      },
      contextEvidence: {
        ancestorRelationships: ['section[notifications]'],
        nearbyText: ['promotional bulletins'],
        surroundingLabels: ['Marketing Communications'],
        containerSemantics: ['notifications'],
        menuPanelRelationships: ['notifications'],
        relativeStructuralRelationships: ['main > section:nth-of-type(1) > button'],
        urlSemantics: '/settings/notifications',
      },
      transitionEvidence: {
        preStateFingerprint: 'PRE_MKT',
        activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
        expectedDelta: { marketing_emails_enabled: false },
        postStateFingerprint: 'POST_MKT',
        historicalTransitionObservations: 10,
        witnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
        verificationWindowMs: 2000,
      },
      riskMetadata: {
        riskClass: 'REVERSIBLE',
        reversible: true,
        financial: false,
        security: false,
        destructive: false,
        requiresConfirmation: false,
      },
      provenance: {
        source: 'INITIAL_SPEC',
        creationTimestamp: Date.now(),
        validationTimestamp: Date.now(),
        routeVersion: 'v1.0.0',
        validationHistory: [],
      },
      confidence: {
        capabilityConfidence: 0.95,
        routeConfidence: 0.90,
      },
      negativeEvidence: {
        rejectedCandidateIdentities: [],
        contradictionPredicates: [],
        failedInvariantPredicates: [],
        failedTransitionWitnesses: [],
        decoyRelationships: [],
        rejectionReasons: [],
      },
    };
    machine.registerCapability(capFp);

    let lastActId = '';
    const dispatcher: ExecutionDispatcher = {
      async dispatchActivation(actId, cand, capId) {
        lastActId = actId;
        return {
          success: true,
          elementFound: true,
          eventDispatched: true,
          stateChanged: true,
          activationEvent: {
            eventId: actId,
            sequenceNumber: 1,
            timestamp: 1700000000000,
            targetCandidateId: cand.candidateId,
            eventType: 'click',
            initiatingCapabilityId: capId,
          },
        };
      },
      async collectWitnesses() {
        return [
          {
            witnessId: 'w1',
            witnessClass: 'DOM_MUTATION',
            sequenceNumber: 2,
            timestamp: 1700000000040,
            observedDelta: { marketing_emails_enabled: false },
            correlatedActivationEventId: lastActId,
            temporalDeltaMs: 40,
            isCausallyCorrelated: true,
            correlationExplanation: 'DOM delta',
          },
          {
            witnessId: 'w2',
            witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
            sequenceNumber: 3,
            timestamp: 1700000000055,
            observedDelta: { marketing_emails_enabled: false, ariaChecked: 'false' },
            correlatedActivationEventId: lastActId,
            temporalDeltaMs: 55,
            isCausallyCorrelated: true,
            correlationExplanation: 'A11y delta',
          },
        ];
      },
    };

    const ctx = await machine.processIntent(
      'Turn off promotional emails',
      {
        tag: 'button',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      },
      [
        {
          candidateId: 'cand_switch_v2',
          candidateLabel: 'Stop Commercial Bulletins',
          observedActionType: 'MODIFY_PREFERENCE',
          observedTargetEntity: 'MARKETING_NOTIFICATIONS',
          observedRole: 'switch',
          containerSemantics: ['notifications'],
        },
      ],
      false,
      dispatcher,
      { corruptPromotionToken: true }
    );

    expect(ctx.currentState).toBe('QUARANTINED');
    expect(ctx.promotionTokenValid).toBe(false);
    // Confirm corruptPromotionToken preserved the valid routeId and failed specifically on signatureHash
    expect(ctx.verificationResult?.verificationToken?.routeId).toBe(ctx.provisionalRoute?.routeId);
    expect(ctx.promotionFailureReason).toMatch(/Token signature hash is invalid or forged/);
  });

  it('TEST 9 — Replay across route versions, capabilities, and re-promotion attempts fails', () => {
    const authenticator = new PromotionTokenAuthenticator();
    const graph = new CapabilityGraphEngine();
    const routeManager = new RouteManager(graph, authenticator);
    const verifier = new CausalTransitionVerifier({ tokenAuthenticator: authenticator });

    const routeV1 = routeManager.createProvisionalRoute('CAP_DISABLE_MARKETING', [], 0.91);
    const routeV2 = routeManager.createProvisionalRoute('CAP_DISABLE_MARKETING', [], 0.95);

    const { activationEvent, witnesses } = createSampleActivationAndWitnesses();
    const resV1 = verifier.verifyTransition(
      sampleSignature,
      activationEvent,
      witnesses,
      'STATE_SETTINGS_POST_V1',
      routeV1.routeId
    );
    const tokenV1 = resV1.verificationToken!;

    // Replay attempt 1: Try to use routeV1's token on routeV2 before promoting routeV1
    expect(() => {
      routeManager.promoteToActive('CAP_DISABLE_MARKETING', routeV2.routeId, tokenV1);
    }).toThrow(/INVARIANT VIOLATION: Token routeId '.*' does not match target routeId/);
    expect(graph.getCapability('CAP_DISABLE_MARKETING')?.routeVersions[routeV2.routeId]?.status).toBe(
      'PROVISIONAL'
    );

    // Legitimately promote routeV1 using tokenV1 (consumes tokenV1)
    const promotedV1 = routeManager.promoteToActive(
      'CAP_DISABLE_MARKETING',
      routeV1.routeId,
      tokenV1
    );
    expect(promotedV1.status).toBe('ACTIVE_VALIDATED');

    // Replay attempt 2: Even if routeV1 is reset or demoted, replaying the consumed tokenV1 is rejected
    routeManager.demoteActiveRoute('CAP_DISABLE_MARKETING', routeV1.routeId, 'Runtime regression');
    expect(() => {
      routeManager.promoteToActive('CAP_DISABLE_MARKETING', routeV1.routeId, tokenV1);
    }).toThrow(/INVARIANT VIOLATION: Replay detected/);
  });

  it('Canonical serialization is strictly deterministic and independent of object key insertion order', async () => {
    const objA = {
      zField: [1, 2, { b: 'two', a: 'one' }],
      aField: { delta: false, alpha: 'first', beta: 42 },
    };
    const objB = {
      aField: { beta: 42, alpha: 'first', delta: false },
      zField: [1, 2, { a: 'one', b: 'two' }],
    };

    expect(canonicalize(objA)).toBe(canonicalize(objB));

    // Verify sync (Node crypto) and async (WebCrypto-compatible) token issuance produce identical HMAC tags
    const fixedKey = new Uint8Array(32).fill(0x5a);
    const auth = new PromotionTokenAuthenticator(fixedKey);
    const params = {
      tokenId: 'tok_det_1',
      routeId: 'route_det_1',
      capabilityId: 'CAP_DISABLE_MARKETING',
      activationEventId: 'act_det_1',
      verifiedWitnessClasses: [
        'ACCESSIBILITY_STATE_MUTATION',
        'DOM_MUTATION',
      ] as ('DOM_MUTATION' | 'ACCESSIBILITY_STATE_MUTATION')[],
      transitionSignature: sampleSignature,
      issuedTimestamp: 1700000000123,
    };

    const syncToken = auth.issueToken(params);
    const asyncToken = await auth.issueTokenAsync({
      ...params,
      // Reversed witness class order must produce the exact same canonical payload & HMAC
      verifiedWitnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
    });

    expect(syncToken.transitionBinding).toBe(asyncToken.transitionBinding);
    expect(syncToken.witnessDigest).toBe(asyncToken.witnessDigest);
    expect(syncToken.signatureHash).toBe(asyncToken.signatureHash);

    const asyncVerify = await auth.verifyTokenAsync(asyncToken, {
      expectedRouteId: 'route_det_1',
      expectedCapabilityId: 'CAP_DISABLE_MARKETING',
      expectedActivationEventId: 'act_det_1',
      expectedTransitionSignature: sampleSignature,
    });
    expect(asyncVerify.valid).toBe(true);
  });
});
