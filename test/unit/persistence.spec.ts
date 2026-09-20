/**
 * IntentNav-SCFR: Persistent Capability Store Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PersistentCapabilityStore } from '../../src/core/storage/persistentStore';
import { FunctionalCapabilityFingerprint, InvariantPredicate } from '../../src/types/capability';
import { RouteVersion } from '../../src/types/state';
import { ContradictionEvidence } from '../../src/types/negativeEvidence';
import { ValidationRecord } from '../../src/types/transition';
import { createDeclarativePredicate } from '../../src/core/invariant/predicates';

describe('PersistentCapabilityStore', () => {
  const storeKey = 'test_intentnav_store';

  beforeEach(() => {
    // Reset any mock localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(storeKey);
    }
  });

  it('persists and retrieves functional capability fingerprints across restarts', async () => {
    // Session 1: Service worker writes capability
    const session1 = new PersistentCapabilityStore(storeKey);
    await session1.init();

    const sampleCap: FunctionalCapabilityFingerprint = {
      capabilityId: 'CAP_TEST_PERSIST',
      canonicalFunction: 'test_function',
      actionType: 'TOGGLE',
      targetEntity: 'MARKETING_NOTIFICATIONS',
      mandatoryPreStatePredicates: [],
      allowedStateDelta: [],
      expectedPostState: [],
      requiredContextPredicates: [],
      forbiddenContextPredicates: [],
      semanticEvidence: {
        canonicalLabel: 'Test Toggle',
        semanticSynonyms: ['test switch'],
        accessibleName: 'Test Toggle Switch',
        role: 'switch',
        visibleLabel: 'Test',
        sectionMeaning: 'Settings',
        actionDescription: 'Test action',
      },
      contextEvidence: {
        ancestorRelationships: [],
        nearbyText: [],
        surroundingLabels: [],
        containerSemantics: ['settings'],
        menuPanelRelationships: [],
        relativeStructuralRelationships: [],
      },
      transitionEvidence: {
        preStateFingerprint: 'PRE',
        activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
        expectedDelta: {},
        postStateFingerprint: 'POST',
        historicalTransitionObservations: 1,
        witnessClasses: ['DOM_MUTATION'],
        verificationWindowMs: 1000,
      },
      riskMetadata: {
        riskClass: 'REVERSIBLE',
        reversible: true,
        financial: false,
        security: false,
        destructive: false,
        requiresConfirmation: false,
      },
      provenance: { source: 'INITIAL_SPEC', creationTimestamp: Date.now(), validationTimestamp: Date.now(), routeVersion: 'v1', validationHistory: [] },
      confidence: { capabilityConfidence: 0.95, routeConfidence: 0.90 },
      negativeEvidence: { rejectedCandidateIdentities: [], contradictionPredicates: [], failedInvariantPredicates: [], failedTransitionWitnesses: [], decoyRelationships: [], rejectionReasons: [] },
    };

    await session1.saveCapability(sampleCap);

    // Session 2: Service worker restarts (new instance of PersistentCapabilityStore)
    const session2 = new PersistentCapabilityStore(storeKey);
    await session2.init();

    const retrieved = await session2.getCapability('CAP_TEST_PERSIST');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.capabilityId).toBe('CAP_TEST_PERSIST');
    expect(retrieved?.canonicalFunction).toBe('test_function');
  });

  it('persists versioned route records and validation records across restarts', async () => {
    const session1 = new PersistentCapabilityStore(storeKey);
    await session1.init();

    const sampleRoute: RouteVersion = {
      routeId: 'route_test_v1',
      capabilityId: 'CAP_TEST_PERSIST',
      versionNumber: 1,
      status: 'ACTIVE_VALIDATED',
      steps: [
        {
          stepIndex: 1,
          fromStateId: 'STATE_A',
          toStateId: 'STATE_B',
          actionDescription: 'Click test control',
        },
      ],
      creationTimestamp: Date.now(),
      confidenceScore: 0.92,
      pathCost: 1.0,
    };

    await session1.saveRouteVersion(sampleRoute);

    const sampleValidationRecord: ValidationRecord = {
      recordId: 'val_rec_1',
      timestamp: Date.now(),
      candidateIdentity: 'btn_marketing',
      candidateFingerprint: {},
      capabilityId: 'CAP_TEST_PERSIST',
      interfaceStateId: 'STATE_A',
      typedDriftVector: { presentation: 0.1, context: 0.05, structure: 0.0, capability: 0.0, transition: 0.0 },
      invariantResults: null,
      contradictionResults: {},
      rankingComponents: null,
      routeVersion: sampleRoute,
      activationEvent: null,
      transitionSignature: null,
      transitionWitnesses: [],
      causalVerificationResult: null,
      promotionState: 'PROMOTED',
      riskDecision: 'REVERSIBLE',
      authorizationDecision: null,
      finalOutcome: 'EXECUTED',
    };

    await session1.saveValidationRecord(sampleValidationRecord);

    // Restart
    const session2 = new PersistentCapabilityStore(storeKey);
    await session2.init();

    const retrievedRoute = await session2.getRouteVersion('route_test_v1');
    expect(retrievedRoute).not.toBeNull();
    expect(retrievedRoute?.status).toBe('ACTIVE_VALIDATED');

    const records = await session2.getValidationRecords('CAP_TEST_PERSIST');
    expect(records.length).toBe(1);
    expect(records[0]?.recordId).toBe('val_rec_1');
    expect(records[0]?.finalOutcome).toBe('EXECUTED');
  });

  it('persists and filters negative evidence records', async () => {
    const store = new PersistentCapabilityStore(storeKey);
    await store.init();

    const negEvidence: ContradictionEvidence = {
      evidenceId: 'neg_1',
      capabilityId: 'CAP_TEST_PERSIST',
      candidateFingerprintHash: 'fph_decoy123',
      interfaceEvidenceHash: 'ieh_decoy123',
      failedInvariant: 'TARGET_ENTITY_MISMATCH',
      contradictionType: 'WRONG_TARGET_ENTITY',
      reason: 'Candidate targets all notifications instead of marketing notifications',
      timestamp: Date.now(),
      routeVersion: 'v1.0.0',
      interfaceState: 'STATE_A',
      previouslySelected: false,
      suppressionWeight: 0.95,
    };

    await store.saveNegativeEvidence(negEvidence);

    const store2 = new PersistentCapabilityStore(storeKey);
    await store2.init();

    const allNeg = await store2.getNegativeEvidence('CAP_TEST_PERSIST');
    expect(allNeg.length).toBe(1);
    expect(allNeg[0]?.contradictionType).toBe('WRONG_TARGET_ENTITY');
    expect(allNeg[0]?.candidateFingerprintHash).toBe('fph_decoy123');
  });

  it('supports schema migration across versions', async () => {
    const store = new PersistentCapabilityStore(storeKey);
    await store.init();

    await store.migrateSchema(1, 2);
    const dump = JSON.parse(await store.exportFullDump());
    expect(dump.schemaVersion).toBe(2);
  });

  it('proves that IntentNavMachine state and verified routes survive service-worker restart and reload', async () => {
    const { IntentNavMachine } = await import('../../src/core/stateMachine/machine');

    // Instance 1: Service Worker before restart
    const store1 = new PersistentCapabilityStore(storeKey);
    const machine1 = new IntentNavMachine(undefined, store1);
    await machine1.init();

    const testCap = {
      capabilityId: 'CAP_RESTART_TEST',
      canonicalFunction: 'test_service_worker_restart',
      actionType: 'MODIFY_PREFERENCE' as const,
      targetEntity: 'MARKETING_NOTIFICATIONS',
      mandatoryPreStatePredicates: [],
      allowedStateDelta: [],
      expectedPostState: [],
      requiredContextPredicates: [],
      forbiddenContextPredicates: [],
      semanticEvidence: {
        canonicalLabel: 'Test Restart',
        semanticSynonyms: [],
        accessibleName: 'Test Restart Switch',
        role: 'switch',
        visibleLabel: 'Restart Test',
        sectionMeaning: 'Settings',
        actionDescription: 'Test',
      },
      contextEvidence: {
        ancestorRelationships: [],
        nearbyText: [],
        surroundingLabels: [],
        containerSemantics: ['settings'],
        menuPanelRelationships: [],
        relativeStructuralRelationships: ['div > button'],
      },
      transitionEvidence: {
        preStateFingerprint: 'PRE',
        activationEventCharacteristics: { eventType: 'click' as const, bubbles: true, cancelable: true },
        expectedDelta: {},
        postStateFingerprint: 'POST',
        historicalTransitionObservations: 1,
        witnessClasses: ['DOM_MUTATION'],
        verificationWindowMs: 1000,
      },
      riskMetadata: {
        riskClass: 'REVERSIBLE' as const,
        reversible: true,
        financial: false,
        security: false,
        destructive: false,
        requiresConfirmation: false,
      },
      provenance: { source: 'INITIAL_SPEC' as const, creationTimestamp: Date.now(), validationTimestamp: Date.now(), routeVersion: 'v1', validationHistory: [] },
      confidence: { capabilityConfidence: 0.95, routeConfidence: 0.95 },
      negativeEvidence: { rejectedCandidateIdentities: [], contradictionPredicates: [], failedInvariantPredicates: [], failedTransitionWitnesses: [], decoyRelationships: [], rejectionReasons: [] },
    };

    machine1.registerCapability(testCap);

    // Create a provisional route and promote it to active
    const provisional = machine1.routeManager.createProvisionalRoute('CAP_RESTART_TEST', [
      { stepIndex: 1, fromStateId: 'STATE_A', toStateId: 'STATE_B', actionDescription: 'Click switch' },
    ], 0.95);

    const token: any = {
      tokenId: 'tok_restart_1',
      routeId: provisional.routeId,
      capabilityId: 'CAP_RESTART_TEST',
      activationEventId: 'act_restart_1',
      verifiedWitnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
      issuedTimestamp: Date.now(),
      verifiedStatus: 'VERIFIED',
      signatureHash: 'hash_restart',
    };

    machine1.routeManager.promoteToActive('CAP_RESTART_TEST', provisional.routeId, token);

    // Verify machine 1 has active route
    const activeRoute1 = machine1.graph.getActiveRoute('CAP_RESTART_TEST');
    expect(activeRoute1).not.toBeNull();
    expect(activeRoute1?.status).toBe('ACTIVE_VALIDATED');
    expect(activeRoute1?.routeId).toBe(provisional.routeId);

    // --- SERVICE WORKER TERMINATION / RESTART ---
    // machine1 and store1 are completely dereferenced and destroyed.
    // New service worker starts:
    const store2 = new PersistentCapabilityStore(storeKey);
    const machine2 = new IntentNavMachine(undefined, store2);
    await machine2.init();

    // Verify machine2 recovered capability and active route from storage!
    const recoveredCap = machine2.getRegisteredCapabilities().find((c) => c.capabilityId === 'CAP_RESTART_TEST');
    expect(recoveredCap).toBeDefined();
    expect(recoveredCap?.canonicalFunction).toBe('test_service_worker_restart');

    const activeRoute2 = machine2.graph.getActiveRoute('CAP_RESTART_TEST');
    expect(activeRoute2).not.toBeNull();
    expect(activeRoute2?.routeId).toBe(provisional.routeId);
    expect(activeRoute2?.status).toBe('ACTIVE_VALIDATED');
  });

  it('serializes declarative invariant predicates and rehydrates executable evaluators across storage destroy/reload', async () => {
    const store1 = new PersistentCapabilityStore(storeKey);
    await store1.init();

    const predEquals = createDeclarativePredicate({
      id: 'PRE_EQUAL_TEST',
      name: 'Test Equals Predicate',
      description: 'Checks equality',
      source: 'PRE_STATE',
      property: 'marketing_notifications_enabled',
      operator: 'EQUALS',
      expectedValue: true,
    });

    const predGreater = createDeclarativePredicate({
      id: 'PRE_GREATER_TEST',
      name: 'Test Greater Than Predicate',
      description: 'Checks active session count',
      source: 'PRE_STATE',
      property: 'active_session_count',
      operator: 'GREATER_THAN',
      expectedValue: 1,
    });

    const predIn = createDeclarativePredicate({
      id: 'PRE_IN_TEST',
      name: 'Test In Array Predicate',
      description: 'Checks allowed roles',
      source: 'CONTEXT',
      property: 'user_role',
      operator: 'IN',
      expectedValues: ['ADMIN', 'MANAGER'],
    });

    const declCap: FunctionalCapabilityFingerprint = {
      capabilityId: 'CAP_DECLARATIVE_TEST',
      canonicalFunction: 'test_declarative_serialization',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'MARKETING_NOTIFICATIONS',
      mandatoryPreStatePredicates: [predEquals, predGreater, predIn],
      allowedStateDelta: [],
      expectedPostState: [],
      requiredContextPredicates: [],
      forbiddenContextPredicates: [],
      semanticEvidence: {
        canonicalLabel: 'Declarative Predicate Test',
        semanticSynonyms: ['declarative test'],
        accessibleName: 'Declarative Test',
        role: 'button',
        visibleLabel: 'Test',
        sectionMeaning: 'Test',
        actionDescription: 'Test',
      },
      contextEvidence: {
        ancestorRelationships: [],
        nearbyText: [],
        surroundingLabels: [],
        containerSemantics: ['test'],
        menuPanelRelationships: [],
        relativeStructuralRelationships: [],
      },
      transitionEvidence: {
        preStateFingerprint: 'PRE_DECL',
        activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
        expectedDelta: {},
        postStateFingerprint: 'POST_DECL',
        historicalTransitionObservations: 1,
        witnessClasses: ['DOM_MUTATION'],
        verificationWindowMs: 1000,
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
      confidence: { capabilityConfidence: 0.95, routeConfidence: 0.95 },
      negativeEvidence: {
        rejectedCandidateIdentities: [],
        contradictionPredicates: [],
        failedInvariantPredicates: [],
        failedTransitionWitnesses: [],
        decoyRelationships: [],
        rejectionReasons: [],
      },
    };

    // Verify initial evaluators work
    expect(predEquals.evaluate({ marketing_notifications_enabled: true })).toBe(true);
    expect(predEquals.evaluate({ marketing_notifications_enabled: false })).toBe(false);
    expect(predGreater.evaluate({ active_session_count: 2 })).toBe(true);
    expect(predGreater.evaluate({ active_session_count: 1 })).toBe(false);
    expect(predIn.evaluate({ user_role: 'ADMIN' })).toBe(true);
    expect(predIn.evaluate({ user_role: 'GUEST' })).toBe(false);

    // Save to persistent storage
    await store1.saveCapability(declCap);

    // Completely destroy instance and simulate restart
    const store2 = new PersistentCapabilityStore(storeKey);
    await store2.init();

    const loadedCap = await store2.getCapability('CAP_DECLARATIVE_TEST');
    expect(loadedCap).not.toBeNull();
    const predicates = loadedCap!.mandatoryPreStatePredicates;
    expect(predicates).toHaveLength(3);
    const loadedEquals = predicates[0]!;
    const loadedGreater = predicates[1]!;
    const loadedIn = predicates[2]!;

    // Verify declarative data preserved
    expect(loadedEquals.declarative?.operator).toBe('EQUALS');
    expect(loadedEquals.declarative?.expectedValue).toBe(true);
    expect(loadedGreater.declarative?.operator).toBe('GREATER_THAN');
    expect(loadedGreater.declarative?.expectedValue).toBe(1);
    expect(loadedIn.declarative?.operator).toBe('IN');
    expect(loadedIn.declarative?.expectedValues).toEqual(['ADMIN', 'MANAGER']);

    // Verify rehydrated executable evaluators produce identical results
    expect(typeof loadedEquals.evaluate).toBe('function');
    expect(loadedEquals.evaluate({ marketing_notifications_enabled: true })).toBe(true);
    expect(loadedEquals.evaluate({ marketing_notifications_enabled: false })).toBe(false);

    expect(typeof loadedGreater.evaluate).toBe('function');
    expect(loadedGreater.evaluate({ active_session_count: 3 })).toBe(true);
    expect(loadedGreater.evaluate({ active_session_count: 1 })).toBe(false);

    expect(typeof loadedIn.evaluate).toBe('function');
    expect(loadedIn.evaluate({ user_role: 'MANAGER' })).toBe(true);
    expect(loadedIn.evaluate({ user_role: 'USER' })).toBe(false);
  });

  it('hydrates and evaluates predicates across ALL collections: preState, delta, postState, requiredContext, forbiddenContext, and negativeEvidence', async () => {
    const storeKeyAll = 'test_all_collections_store';
    const store1 = new PersistentCapabilityStore(storeKeyAll);
    await store1.init();

    const predPre = createDeclarativePredicate({
      id: 'PRE_STATE_PRED',
      name: 'Pre-State Predicate',
      description: 'Pre-state check',
      source: 'PRE_STATE',
      property: 'account_status',
      operator: 'EQUALS',
      expectedValue: 'ACTIVE',
    });

    const predDelta = {
      property: 'two_factor_enabled',
      expectedChange: 'ENABLED_TO_DISABLED',
      ...createDeclarativePredicate({
        id: 'DELTA_PRED',
        name: 'Delta Predicate',
        description: 'Delta check',
        source: 'ACTION',
        property: 'two_factor_enabled',
        operator: 'EQUALS',
        expectedValue: false,
      }),
    };

    const predPost = {
      property: 'two_factor_enabled',
      expectedValue: false,
      ...createDeclarativePredicate({
        id: 'POST_STATE_PRED',
        name: 'Post-State Predicate',
        description: 'Post-state check',
        source: 'POST_STATE',
        property: 'two_factor_enabled',
        operator: 'EQUALS',
        expectedValue: false,
      }),
    };

    const predReqContext = {
      target: 'container' as const,
      pattern: 'security',
      required: true,
      ...createDeclarativePredicate({
        id: 'REQ_CTX_PRED',
        name: 'Required Context Predicate',
        description: 'Required context check',
        source: 'CONTEXT',
        property: 'security_section_open',
        operator: 'EQUALS',
        expectedValue: true,
      }),
    };

    const predForbidContext = {
      target: 'container' as const,
      pattern: 'maintenance',
      required: true,
      ...createDeclarativePredicate({
        id: 'FORBID_CTX_PRED',
        name: 'Forbidden Context Predicate',
        description: 'Forbidden context check',
        source: 'CONTEXT',
        property: 'maintenance_mode',
        operator: 'EQUALS',
        expectedValue: true,
      }),
    };

    const predContradiction = createDeclarativePredicate({
      id: 'CONTRADICTION_PRED',
      name: 'Contradiction Predicate',
      description: 'Contradiction check',
      source: 'TARGET',
      property: 'disable_all_security',
      operator: 'EQUALS',
      expectedValue: true,
    });

    const fullCap: FunctionalCapabilityFingerprint = {
      capabilityId: 'CAP_ALL_COLLECTIONS_TEST',
      canonicalFunction: 'test_all_collections_hydration',
      actionType: 'TOGGLE',
      targetEntity: 'TWO_FACTOR_AUTH',
      mandatoryPreStatePredicates: [predPre],
      allowedStateDelta: [predDelta],
      expectedPostState: [predPost],
      requiredContextPredicates: [predReqContext],
      forbiddenContextPredicates: [predForbidContext],
      semanticEvidence: {
        canonicalLabel: 'Disable 2FA',
        semanticSynonyms: ['turn off two factor'],
        accessibleName: 'Disable Two-Factor Authentication',
        role: 'button',
        visibleLabel: 'Disable 2FA',
        sectionMeaning: 'Security',
        actionDescription: 'Disables two factor auth',
      },
      contextEvidence: {
        ancestorRelationships: [],
        nearbyText: [],
        surroundingLabels: [],
        containerSemantics: ['security'],
        menuPanelRelationships: [],
        relativeStructuralRelationships: [],
      },
      transitionEvidence: {
        preStateFingerprint: 'PRE_2FA',
        activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
        expectedDelta: { two_factor_enabled: false },
        postStateFingerprint: 'POST_2FA',
        historicalTransitionObservations: 1,
        witnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
        verificationWindowMs: 1500,
      },
      riskMetadata: {
        riskClass: 'SECURITY_SENSITIVE',
        reversible: true,
        financial: false,
        security: true,
        destructive: false,
        requiresConfirmation: true,
      },
      provenance: {
        source: 'INITIAL_SPEC',
        creationTimestamp: Date.now(),
        validationTimestamp: Date.now(),
        routeVersion: 'v1.0.0',
        validationHistory: [],
      },
      confidence: { capabilityConfidence: 0.98, routeConfidence: 0.95 },
      negativeEvidence: {
        rejectedCandidateIdentities: ['decoy_disable_all'],
        contradictionPredicates: [predContradiction],
        failedInvariantPredicates: [],
        failedTransitionWitnesses: [],
        decoyRelationships: [],
        rejectionReasons: ['Matches blanket security disable decoy'],
      },
    };

    await store1.saveCapability(fullCap);

    // Completely destroy instance and simulate restart
    const store2 = new PersistentCapabilityStore(storeKeyAll);
    await store2.init();

    const loaded = await store2.getCapability('CAP_ALL_COLLECTIONS_TEST');
    expect(loaded).not.toBeNull();

    // 1. Check mandatoryPreStatePredicates
    expect(loaded!.mandatoryPreStatePredicates).toHaveLength(1);
    expect(typeof loaded!.mandatoryPreStatePredicates[0]!.evaluate).toBe('function');
    expect(loaded!.mandatoryPreStatePredicates[0]!.evaluate({ account_status: 'ACTIVE' })).toBe(true);
    expect(loaded!.mandatoryPreStatePredicates[0]!.evaluate({ account_status: 'SUSPENDED' })).toBe(false);

    // 2. Check allowedStateDelta
    expect(loaded!.allowedStateDelta).toHaveLength(1);
    expect(typeof loaded!.allowedStateDelta[0]!.evaluate).toBe('function');
    expect(loaded!.allowedStateDelta[0]!.evaluate!({ two_factor_enabled: false })).toBe(true);
    expect(loaded!.allowedStateDelta[0]!.evaluate!({ two_factor_enabled: true })).toBe(false);

    // 3. Check expectedPostState
    expect(loaded!.expectedPostState).toHaveLength(1);
    expect(typeof loaded!.expectedPostState[0]!.evaluate).toBe('function');
    expect(loaded!.expectedPostState[0]!.evaluate!({ two_factor_enabled: false })).toBe(true);
    expect(loaded!.expectedPostState[0]!.evaluate!({ two_factor_enabled: true })).toBe(false);

    // 4. Check requiredContextPredicates
    expect(loaded!.requiredContextPredicates).toHaveLength(1);
    expect(typeof loaded!.requiredContextPredicates[0]!.evaluate).toBe('function');
    expect(loaded!.requiredContextPredicates[0]!.evaluate!({ security_section_open: true })).toBe(true);
    expect(loaded!.requiredContextPredicates[0]!.evaluate!({ security_section_open: false })).toBe(false);

    // 5. Check forbiddenContextPredicates
    expect(loaded!.forbiddenContextPredicates).toHaveLength(1);
    expect(typeof loaded!.forbiddenContextPredicates[0]!.evaluate).toBe('function');
    expect(loaded!.forbiddenContextPredicates[0]!.evaluate!({ maintenance_mode: true })).toBe(true);
    expect(loaded!.forbiddenContextPredicates[0]!.evaluate!({ maintenance_mode: false })).toBe(false);

    // 6. Check negativeEvidence contradictionPredicates
    expect(loaded!.negativeEvidence.contradictionPredicates).toHaveLength(1);
    const loadedContradiction = loaded!.negativeEvidence.contradictionPredicates[0] as InvariantPredicate;
    expect(typeof loadedContradiction.evaluate).toBe('function');
    expect(loadedContradiction.evaluate({ disable_all_security: true })).toBe(true);
    expect(loadedContradiction.evaluate({ disable_all_security: false })).toBe(false);
  });
});

