/**
 * IntentNav-SCFR: Persistent Capability Store Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PersistentCapabilityStore } from '../../src/core/storage/persistentStore';
import { FunctionalCapabilityFingerprint } from '../../src/types/capability';
import { RouteVersion } from '../../src/types/state';
import { ContradictionEvidence } from '../../src/types/negativeEvidence';
import { ValidationRecord } from '../../src/types/transition';

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
      riskDecision: 'REVERSIBLE_APPROVED',
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
});
