/**
 * IntentNav-SCFR: Persistent Capability Store Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PersistentCapabilityStore } from '../../src/core/storage/persistentStore';
import { FunctionalCapabilityFingerprint, InvariantPredicate } from '../../src/types/capability';
import { RouteVersion, GraphEdge, CapabilityNode } from '../../src/types/state';
import { ContradictionEvidence } from '../../src/types/negativeEvidence';
import { ValidationRecord, TransitionVerificationToken, TransitionSignature, ActivationEventRecord, TransitionWitness } from '../../src/types/transition';
import { createDeclarativePredicate } from '../../src/core/invariant/predicates';
import { CapabilityGraphEngine } from '../../src/core/graph/capabilityGraph';
import { RouteManager } from '../../src/core/graph/routeManager';
import { IntentNavMachine, ExecutionDispatcher } from '../../src/core/stateMachine/machine';
import { CandidateEvaluationContext } from '../../src/core/invariant/engine';

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

    const token = machine1.tokenAuthenticator.issueToken({
      tokenId: 'tok_restart_1',
      routeId: provisional.routeId,
      capabilityId: 'CAP_RESTART_TEST',
      activationEventId: 'act_restart_1',
      verifiedWitnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
    });

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

describe('Prompt 7: Persistence Completeness & Restart Matrix', () => {
  it('PERSIST-EDGE-01: Graph edges survive restart with all metadata', async () => {
    const edgeStoreKey = 'test_persist_edge_store';
    if (typeof localStorage !== 'undefined') localStorage.removeItem(edgeStoreKey);

    const store1 = new PersistentCapabilityStore(edgeStoreKey);
    await store1.init();
    const graph1 = new CapabilityGraphEngine(store1);
    await graph1.loadFromStore();

    graph1.registerCapability('CAP_SETTINGS', 'manage_settings');
    graph1.registerInterfaceState({
      stateId: 'STATE_DASHBOARD',
      stateType: 'PAGE',
      urlPattern: '/dashboard',
      domStructuralHash: 'hash_dashboard_123',
      semanticLandmarks: ['main'],
      activeModalsOrDialogs: [],
      activeTabs: [],
      timestamp: 1000,
    });
    graph1.registerInterfaceState({
      stateId: 'STATE_SETTINGS',
      stateType: 'PAGE',
      urlPattern: '/settings',
      domStructuralHash: 'hash_settings_456',
      semanticLandmarks: ['settings_panel'],
      activeModalsOrDialogs: [],
      activeTabs: [],
      timestamp: 1010,
    });

    const edgeSignature: TransitionSignature = {
      preStateFingerprint: 'state_dash_hash',
      activationEventExpected: { eventType: 'click' },
      expectedStateDelta: { url: '/settings' },
      verificationWindowMs: 1500,
      postStateFingerprint: 'state_settings_hash',
    };

    const edge: GraphEdge = {
      id: 'edge_dash_to_settings',
      sourceNodeId: 'STATE_DASHBOARD',
      targetNodeId: 'STATE_SETTINGS',
      edgeType: 'NAVIGATE',
      weight: 1.0,
      routeId: 'route_nav_v1',
      version: 1,
      timestamp: 1020,
      transitionSignature: edgeSignature,
      validationStatus: 'ACTIVE_VALIDATED',
    };

    graph1.addEdge(edge);

    // Simulate restart with store2
    const store2 = new PersistentCapabilityStore(edgeStoreKey);
    await store2.init();
    const graph2 = new CapabilityGraphEngine(store2);
    await graph2.loadFromStore();

    const storedEdges = await store2.getAllGraphEdges();
    expect(storedEdges).toHaveLength(1);
    const restoredEdge = storedEdges[0]!;
    expect(restoredEdge.id).toBe('edge_dash_to_settings');
    expect(restoredEdge.sourceNodeId).toBe('STATE_DASHBOARD');
    expect(restoredEdge.targetNodeId).toBe('STATE_SETTINGS');
    expect(restoredEdge.edgeType).toBe('NAVIGATE');
    expect(restoredEdge.routeId).toBe('route_nav_v1');
    expect(restoredEdge.version).toBe(1);
    expect(restoredEdge.timestamp).toBe(1020);
    expect(restoredEdge.transitionSignature?.preStateFingerprint).toBe('state_dash_hash');
    expect(restoredEdge.transitionSignature?.postStateFingerprint).toBe('state_settings_hash');
    expect(restoredEdge.validationStatus).toBe('ACTIVE_VALIDATED');
  });

  it('PERSIST-QUAR-01: Quarantined route survives restart with status, reason, and cleared activeRouteId', async () => {
    const quarStoreKey = 'test_persist_quar_store';
    if (typeof localStorage !== 'undefined') localStorage.removeItem(quarStoreKey);

    const store1 = new PersistentCapabilityStore(quarStoreKey);
    await store1.init();
    const graph1 = new CapabilityGraphEngine(store1);
    await graph1.loadFromStore();
    const rm1 = new RouteManager(graph1);

    const capId = 'CAP_QUAR_TEST';
    graph1.registerCapability(capId, 'quar_function');
    const provRoute = rm1.createProvisionalRoute(capId, [], 0.8, 1.0);

    // Quarantine the route
    rm1.quarantineRoute(capId, provRoute.routeId, 'Decoy clickjacking detected');

    const node1 = graph1.getCapability(capId);
    expect(node1?.activeRouteId).toBeNull();
    expect(node1?.quarantinedRouteIds).toContain(provRoute.routeId);
    expect(node1?.provisionalRouteIds).not.toContain(provRoute.routeId);

    // Simulate restart with store2
    const store2 = new PersistentCapabilityStore(quarStoreKey);
    await store2.init();
    const graph2 = new CapabilityGraphEngine(store2);
    await graph2.loadFromStore();

    const restoredRoute = await store2.getRouteVersion(provRoute.routeId);
    expect(restoredRoute).not.toBeNull();
    expect(restoredRoute?.status).toBe('QUARANTINED');
    expect(restoredRoute?.quarantineReason).toBe('Decoy clickjacking detected');

    const node2 = graph2.getCapability(capId);
    expect(node2).not.toBeNull();
    expect(node2?.activeRouteId).toBeNull();
    expect(node2?.quarantinedRouteIds).toContain(provRoute.routeId);
    expect(node2?.provisionalRouteIds).not.toContain(provRoute.routeId);
  });

  it('PERSIST-ROLLBACK-01: Demoted route and rollback route survive restart with correct activeRouteId', async () => {
    const rollbackStoreKey = 'test_persist_rollback_store';
    if (typeof localStorage !== 'undefined') localStorage.removeItem(rollbackStoreKey);

    const store1 = new PersistentCapabilityStore(rollbackStoreKey);
    await store1.init();
    const graph1 = new CapabilityGraphEngine(store1);
    await graph1.loadFromStore();
    const rm1 = new RouteManager(graph1);

    const capId = 'CAP_ROLLBACK_TEST';
    graph1.registerCapability(capId, 'rollback_function');

    // Route 1 promoted
    const route1 = rm1.createProvisionalRoute(capId, [], 0.95, 1.0);
    const token1: TransitionVerificationToken = rm1.tokenAuthenticator.issueToken({
      tokenId: 'tok_v1',
      capabilityId: capId,
      routeId: route1.routeId,
      activationEventId: 'evt_act_tok1',
      issuedTimestamp: Date.now() - 5000,
      verifiedWitnessClasses: ['DOM_MUTATION', 'HISTORY_STATE_MUTATION'],
    });
    rm1.promoteToActive(capId, route1.routeId, token1);

    // Route 2 promoted
    const route2 = rm1.createProvisionalRoute(capId, [], 0.99, 0.8);
    const token2: TransitionVerificationToken = rm1.tokenAuthenticator.issueToken({
      tokenId: 'tok_v2',
      capabilityId: capId,
      routeId: route2.routeId,
      activationEventId: 'evt_act_tok2',
      issuedTimestamp: Date.now() - 2000,
      verifiedWitnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
    });
    rm1.promoteToActive(capId, route2.routeId, token2);

    expect(graph1.getCapability(capId)?.activeRouteId).toBe(route2.routeId);

    // Now demote Route 2 -> should roll back to Route 1
    const { demotedRoute, rollbackRoute } = rm1.demoteActiveRoute(capId, route2.routeId, 'Drift regression observed');
    expect(demotedRoute.status).toBe('DEMOTED');
    expect(rollbackRoute).not.toBeNull();
    expect(rollbackRoute?.routeId).toBe(route1.routeId);
    expect(rollbackRoute?.status).toBe('ACTIVE_VALIDATED');
    expect(graph1.getCapability(capId)?.activeRouteId).toBe(route1.routeId);

    // Simulate restart with store2
    const store2 = new PersistentCapabilityStore(rollbackStoreKey);
    await store2.init();
    const graph2 = new CapabilityGraphEngine(store2);
    await graph2.loadFromStore();

    const restoredRoute2 = await store2.getRouteVersion(route2.routeId);
    expect(restoredRoute2?.status).toBe('DEMOTED');
    expect(restoredRoute2?.demotionReason).toBe('Drift regression observed');

    const restoredRoute1 = await store2.getRouteVersion(route1.routeId);
    expect(restoredRoute1?.status).toBe('ACTIVE_VALIDATED');

    const node2 = graph2.getCapability(capId);
    expect(node2?.activeRouteId).toBe(route1.routeId);
    expect(node2?.demotedRouteIds).toContain(route2.routeId);
  });

  it('PERSIST-STALE-ACTIVE-01: Stale activeRouteId pointing to non-active or quarantined/demoted routes is cleared on restart', async () => {
    const staleStoreKey = 'test_persist_stale_store';
    if (typeof localStorage !== 'undefined') localStorage.removeItem(staleStoreKey);

    const store1 = new PersistentCapabilityStore(staleStoreKey);
    await store1.init();

    // Manually inject a stale capability node where activeRouteId points to a quarantined route
    const staleNode: CapabilityNode = {
      capabilityId: 'CAP_STALE_TEST',
      canonicalFunction: 'stale_fn',
      routeVersions: {
        'route_quar': {
          routeId: 'route_quar',
          capabilityId: 'CAP_STALE_TEST',
          versionNumber: 1,
          status: 'QUARANTINED',
          quarantineReason: 'Prior compromise',
          steps: [],
          creationTimestamp: 1000,
          confidenceScore: 0.5,
          pathCost: 1.0,
        },
      },
      activeRouteId: 'route_quar', // INVARIANT VIOLATION: Points to a quarantined route!
      provisionalRouteIds: [],
      quarantinedRouteIds: ['route_quar'],
      demotedRouteIds: [],
      creationTimestamp: 1000,
    };

    await store1.saveCapabilityNode(staleNode);
    await store1.saveRouteVersion(staleNode.routeVersions['route_quar']!);

    // Restart and load into CapabilityGraphEngine
    const store2 = new PersistentCapabilityStore(staleStoreKey);
    await store2.init();
    const graph2 = new CapabilityGraphEngine(store2);
    await graph2.loadFromStore();

    // Safety invariant: loadFromStore must have cleared activeRouteId to null!
    const node2 = graph2.getCapability('CAP_STALE_TEST');
    expect(node2).not.toBeNull();
    expect(node2?.activeRouteId).toBeNull();
  });

  it('PERSIST-VALREC-01: ValidationRecord survives restart with non-null transitionSignature and full evidence', async () => {
    const recStoreKey = 'test_persist_valrec_store';
    if (typeof localStorage !== 'undefined') localStorage.removeItem(recStoreKey);

    const store1 = new PersistentCapabilityStore(recStoreKey);
    await store1.init();

    const signature: TransitionSignature = {
      preStateFingerprint: 'sha256_pre_state_hash_abc',
      activationEventExpected: { eventType: 'click' },
      expectedStateDelta: { element_hidden: true },
      verificationWindowMs: 1500,
      postStateFingerprint: 'sha256_post_state_hash_def',
    };

    const activationEvent: ActivationEventRecord = {
      eventId: 'evt_act_001',
      sequenceNumber: 1,
      timestamp: 1699999999900,
      targetCandidateId: 'btn_submit',
      eventType: 'click',
      initiatingCapabilityId: 'CAP_SUBMIT_ORDER',
    };

    const witness1: TransitionWitness = {
      witnessId: 'wit_001',
      witnessClass: 'DOM_MUTATION',
      sequenceNumber: 2,
      timestamp: 1699999999950,
      observedDelta: { element_hidden: true },
      correlatedActivationEventId: 'evt_act_001',
      temporalDeltaMs: 50,
      isCausallyCorrelated: true,
      correlationExplanation: 'Observed valid DOM mutation within window',
    };

    const witness2: TransitionWitness = {
      witnessId: 'wit_002',
      witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
      sequenceNumber: 3,
      timestamp: 1699999999980,
      observedDelta: { status_code: 200 },
      correlatedActivationEventId: 'evt_act_001',
      temporalDeltaMs: 80,
      isCausallyCorrelated: true,
      correlationExplanation: 'Observed valid a11y mutation within window',
    };

    const valRecord: ValidationRecord = {
      recordId: 'valrec_authoritative_001',
      timestamp: 1700000000000,
      candidateIdentity: 'candidate_submit_btn',
      candidateFingerprint: { capabilityId: 'CAP_SUBMIT_ORDER', canonicalFunction: 'Submit' },
      capabilityId: 'CAP_SUBMIT_ORDER',
      interfaceStateId: 'STATE_CHECKOUT',
      typedDriftVector: { presentation: 0.02, context: 0.01, structure: 0.0, capability: 0.0, transition: 0.0 },
      invariantResults: null,
      contradictionResults: { contradiction: false },
      rankingComponents: null,
      routeVersion: {
        routeId: 'route_checkout_v1',
        capabilityId: 'CAP_SUBMIT_ORDER',
        versionNumber: 1,
        status: 'ACTIVE_VALIDATED',
        steps: [],
        creationTimestamp: 1699999990000,
        confidenceScore: 0.98,
        pathCost: 1.0,
      },
      activationEvent,
      transitionSignature: signature,
      transitionWitnesses: [witness1, witness2],
      causalVerificationResult: null,
      promotionState: 'PROMOTED',
      riskDecision: 'LOW_REVERSIBLE',
      authorizationDecision: null,
      finalOutcome: 'EXECUTED',
    };

    await store1.saveValidationRecord(valRecord);

    // Restart
    const store2 = new PersistentCapabilityStore(recStoreKey);
    await store2.init();

    const records = await store2.getValidationRecords('CAP_SUBMIT_ORDER');
    expect(records).toHaveLength(1);
    const restored = records[0]!;
    expect(restored.recordId).toBe('valrec_authoritative_001');
    expect(restored.transitionSignature).not.toBeNull();
    expect(restored.transitionSignature?.preStateFingerprint).toBe('sha256_pre_state_hash_abc');
    expect(restored.transitionSignature?.postStateFingerprint).toBe('sha256_post_state_hash_def');
    expect(restored.transitionSignature?.expectedStateDelta).toEqual({ element_hidden: true });
    expect(restored.activationEvent?.eventId).toBe('evt_act_001');
    expect(restored.transitionWitnesses).toHaveLength(2);
    expect(restored.transitionWitnesses[0]?.witnessClass).toBe('DOM_MUTATION');
    expect(restored.transitionWitnesses[1]?.witnessClass).toBe('ACCESSIBILITY_STATE_MUTATION');
    expect(restored.finalOutcome).toBe('EXECUTED');
  });

  it('PERSIST-JSON-SAFE-01: Serialized store state is pure JSON-safe with no unexecutable raw functions', async () => {
    const jsonStoreKey = 'test_persist_json_store';
    if (typeof localStorage !== 'undefined') localStorage.removeItem(jsonStoreKey);

    const store1 = new PersistentCapabilityStore(jsonStoreKey);
    await store1.init();

    const capWithDeclaratives: FunctionalCapabilityFingerprint = {
      capabilityId: 'CAP_DECLARATIVE_TEST',
      canonicalFunction: 'declarative_fn',
      actionType: 'TOGGLE',
      targetEntity: 'NOTIFICATIONS',
      mandatoryPreStatePredicates: [
        createDeclarativePredicate({
          id: 'PRED_STATUS_ACTIVE',
          name: 'Status Active',
          description: 'Checks status is active',
          source: 'PRE_STATE',
          property: 'status',
          operator: 'EQUALS',
          expectedValue: 'ACTIVE',
        }),
      ],
      allowedStateDelta: [],
      expectedPostState: [],
      requiredContextPredicates: [],
      forbiddenContextPredicates: [],
      semanticEvidence: {
        canonicalLabel: 'Declarative Toggle',
        semanticSynonyms: [],
        accessibleName: 'Declarative Toggle',
        role: 'switch',
        visibleLabel: 'Declarative Toggle',
        sectionMeaning: 'Notifications',
        actionDescription: 'Toggle declarative status',
      },
      contextEvidence: {
        ancestorRelationships: [],
        nearbyText: [],
        surroundingLabels: [],
        containerSemantics: ['notifications'],
        menuPanelRelationships: [],
        relativeStructuralRelationships: [],
      },
      transitionEvidence: {
        preStateFingerprint: 'PRE_DECL',
        activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
        expectedDelta: { status: 'INACTIVE' },
        postStateFingerprint: 'POST_DECL',
        historicalTransitionObservations: 1,
        witnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
        verificationWindowMs: 1500,
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
      confidence: { capabilityConfidence: 0.98, routeConfidence: 0.95 },
      negativeEvidence: {
        rejectedCandidateIdentities: [],
        contradictionPredicates: [],
        failedInvariantPredicates: [],
        failedTransitionWitnesses: [],
        decoyRelationships: [],
        rejectionReasons: [],
      },
    };

    await store1.saveCapability(capWithDeclaratives);

    // Retrieve raw serialized string from storage
    let rawSerialized: string | undefined;
    if (typeof localStorage !== 'undefined') {
      rawSerialized = localStorage.getItem(jsonStoreKey) || undefined;
    } else {
      rawSerialized = (PersistentCapabilityStore as any).nodeFallbackStorage.get(jsonStoreKey);
    }

    expect(rawSerialized).toBeDefined();
    // Verify it is strictly parseable JSON
    const parsed = JSON.parse(rawSerialized!);
    expect(parsed).toBeTypeOf('object');
    expect(parsed.schemaVersion).toBe(1);

    // In JSON, function properties are serialized away or absent
    const storedCap = parsed.capabilities['CAP_DECLARATIVE_TEST'];
    expect(storedCap).toBeDefined();
    const storedPred = storedCap.mandatoryPreStatePredicates[0];
    expect(storedPred.declarative).toBeDefined();
    expect(storedPred.declarative.property).toBe('status');
    expect(typeof storedPred.evaluate).toBe('undefined'); // Functions not serialized

    // Now restart session2: init() must hydrate evaluate() back into an executable function
    const store2 = new PersistentCapabilityStore(jsonStoreKey);
    await store2.init();

    const loadedCap = await store2.getCapability('CAP_DECLARATIVE_TEST');
    expect(loadedCap).not.toBeNull();
    expect(typeof loadedCap?.mandatoryPreStatePredicates[0]?.evaluate).toBe('function');
    expect(loadedCap?.mandatoryPreStatePredicates[0]?.evaluate({ status: 'ACTIVE' })).toBe(true);
    expect(loadedCap?.mandatoryPreStatePredicates[0]?.evaluate({ status: 'SUSPENDED' })).toBe(false);
  });

  it('PERSIST-SAFETY-REGRESSION-01: Persisted ACTIVE_VALIDATED route + current live invariant failure = ABSTAIN', async () => {
    const safetyStoreKey = 'test_persist_safety_store';
    if (typeof localStorage !== 'undefined') localStorage.removeItem(safetyStoreKey);

    // Session 1: Setup capability with mandatory pre-state predicate and active validated route
    const store1 = new PersistentCapabilityStore(safetyStoreKey);
    await store1.init();

    const cap: FunctionalCapabilityFingerprint = {
      capabilityId: 'CAP_TWO_FACTOR_TOGGLE',
      canonicalFunction: 'disable_two_factor',
      actionType: 'TOGGLE',
      targetEntity: 'SECURITY_2FA',
      mandatoryPreStatePredicates: [
        createDeclarativePredicate({
          id: 'PRED_SECURITY_UNLOCKED',
          name: 'Require Security Unlocked',
          description: 'Checks security session is unlocked',
          source: 'PRE_STATE',
          property: 'security_unlocked',
          operator: 'EQUALS',
          expectedValue: true,
        }),
      ],
      allowedStateDelta: [],
      expectedPostState: [],
      requiredContextPredicates: [],
      forbiddenContextPredicates: [],
      semanticEvidence: {
        canonicalLabel: 'Disable 2FA',
        semanticSynonyms: [],
        accessibleName: 'Disable 2FA',
        role: 'switch',
        visibleLabel: 'Disable 2FA',
        sectionMeaning: 'Security',
        actionDescription: 'Disable two factor authentication',
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
        expectedDelta: { security_unlocked: true },
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
        rejectedCandidateIdentities: [],
        contradictionPredicates: [],
        failedInvariantPredicates: [],
        failedTransitionWitnesses: [],
        decoyRelationships: [],
        rejectionReasons: [],
      },
    };
    await store1.saveCapability(cap);

    const graph1 = new CapabilityGraphEngine(store1);
    await graph1.loadFromStore();
    graph1.registerCapability(cap.capabilityId, cap.canonicalFunction);

    const activeRoute: RouteVersion = {
      routeId: 'route_2fa_v1',
      capabilityId: cap.capabilityId,
      versionNumber: 1,
      status: 'ACTIVE_VALIDATED',
      steps: [
        {
          stepIndex: 0,
          fromStateId: 'STATE_A',
          toStateId: 'STATE_B',
          actionDescription: 'Toggle 2FA button',
          bindingHandle: {
            handleId: 'handle_2fa_toggle',
            tagName: 'button',
            role: 'switch',
            accessibleName: 'Disable 2FA',
            domStructuralPath: 'button#btn-2fa',
            elementIndex: 0,
          },
        },
      ],
      creationTimestamp: Date.now() - 10000,
      lastValidatedTimestamp: Date.now() - 5000,
      confidenceScore: 0.95,
      pathCost: 1.0,
    };
    graph1.attachRouteVersion(cap.capabilityId, activeRoute);

    // Session 2: System restarts
    const store2 = new PersistentCapabilityStore(safetyStoreKey);
    const machine = new IntentNavMachine(undefined, store2);
    await machine.init();

    // Verify machine loaded capability and active route
    const loadedNode = machine.graph.getCapability(cap.capabilityId);
    expect(loadedNode?.activeRouteId).toBe('route_2fa_v1');

    // Live candidate arrives, but current state violates the mandatory predicate:
    // security_unlocked is false!
    const candidate: CandidateEvaluationContext = {
      candidateId: 'handle_2fa_toggle',
      candidateLabel: 'Disable 2FA',
      observedActionType: 'TOGGLE',
      observedTargetEntity: 'SECURITY_2FA',
      observedRole: 'switch',
      bindingHandle: activeRoute.steps[0]!.bindingHandle,
      containerSemantics: ['security', 'two_factor'],
      observedState: {
        security_unlocked: false, // VIOLATION of mandatory predicate!
      },
    };

    const mockDispatcher: ExecutionDispatcher = {
      async dispatchActivation() {
        throw new Error('UNREACHABLE: Dispatcher should never be invoked when invariant fails!');
      },
      async collectWitnesses() {
        return [];
      },
    };

    const ctx = await machine.processIntent(
      'Turn off two factor authentication',
      { tag: 'button', role: 'switch', id: 'handle_2fa_toggle', observedPreState: candidate.observedState },
      [candidate],
      false,
      mockDispatcher
    );

    // Invariant closure failure MUST block execution and result in ABSTAINED state
    expect(ctx.currentState).toBe('ABSTAINED');
    expect(machine.state).toBe('ABSTAINED');
    expect(machine.state).not.toBe('EXECUTED');
    expect(ctx.invariantResults?.[candidate.candidateId]?.status).not.toBe('PASS');
  });
});

