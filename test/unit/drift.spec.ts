/**
 * IntentNav-SCFR: Typed Drift Localization Tests
 */

import { describe, it, expect } from 'vitest';
import { TypedDriftDetector } from '../../src/core/drift/detector';
import { DriftClassifier } from '../../src/core/drift/classifier';
import { FunctionalCapabilityFingerprint } from '../../src/types/capability';

describe('TypedDriftDetector & DriftClassifier', () => {
  const baseFingerprint: FunctionalCapabilityFingerprint = {
    capabilityId: 'CAP_DISABLE_MARKETING',
    canonicalFunction: 'disable_marketing_communications',
    actionType: 'MODIFY_PREFERENCE',
    targetEntity: 'MARKETING_NOTIFICATIONS',
    mandatoryPreStatePredicates: [],
    allowedStateDelta: [],
    expectedPostState: [],
    requiredContextPredicates: [],
    forbiddenContextPredicates: [],
    semanticEvidence: {
      canonicalLabel: 'Disable marketing emails',
      semanticSynonyms: [],
      accessibleName: 'Marketing email notifications',
      role: 'switch',
      visibleLabel: 'Marketing',
      sectionMeaning: 'Notifications',
      actionDescription: 'Disable marketing emails',
    },
    contextEvidence: {
      ancestorRelationships: ['section[notifications]', 'main[settings]'],
      nearbyText: ['promotional offers'],
      surroundingLabels: ['Marketing Communications'],
      containerSemantics: ['notifications'],
      menuPanelRelationships: ['notifications'],
      relativeStructuralRelationships: ['main > section:nth-of-type(1) > button:nth-of-type(1)'],
    },
    transitionEvidence: {
      preStateFingerprint: 'PRE',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: {},
      postStateFingerprint: 'POST',
      historicalTransitionObservations: 5,
      witnessClasses: ['DOM_MUTATION'],
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
    confidence: { capabilityConfidence: 0.9, routeConfidence: 0.9 },
    negativeEvidence: {
      rejectedCandidateIdentities: [],
      contradictionPredicates: [],
      failedInvariantPredicates: [],
      failedTransitionWitnesses: [],
      decoyRelationships: [],
      rejectionReasons: [],
    },
  };

  it('computes 5D vector and maintains route when only presentation drift occurs', () => {
    // Only IDs and classes changed, but ancestors, role, target and actions match
    const vector = TypedDriftDetector.computeDrift(baseFingerprint, {
      tag: 'button',
      id: 'scrambled-id-99881',
      classes: ['css-sc92h1', 'p-4', 'bg-white'],
      role: 'switch',
      ancestors: ['section[notifications]', 'main[settings]'],
      nearbyText: ['promotional offers'],
      relativeStructuralPath: 'main > section:nth-of-type(1) > button:nth-of-type(1)',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
    });

    expect(vector.presentation).toBeGreaterThan(0.4);
    expect(vector.capability).toBe(0.0);
    expect(vector.transition).toBe(0.0);

    const classification = DriftClassifier.classify(vector);
    expect(classification.actionRequired).toBe('MAINTAIN_ACTIVE');
    expect(classification.explanation).toContain('Only presentation drift');
  });

  it('triggers recovery and explains cause when capability drift is detected', () => {
    // Control targets something else
    const vector = TypedDriftDetector.computeDrift(baseFingerprint, {
      tag: 'button',
      role: 'button',
      observedActionType: 'DELETE',
      observedTargetEntity: 'ACCOUNT_STATUS',
    });

    expect(vector.capability).toBeGreaterThan(0.60);

    const classification = DriftClassifier.classify(vector);
    expect(classification.actionRequired).toBe('TRIGGER_REBIND_RECOVERY');
    expect(classification.dominantDriftDimension).toBe('capability');
    expect(classification.explanation).toContain('Significant drift detected in capability');
  });
});
