/**
 * IntentNav-SCFR: Presentation-Only Drift Demonstration Test (Phase 8)
 *
 * Demonstrates that when presentation features drift severely (framework ID :r918:, utility CSS css-8291 x-19 p-4)
 * while functional capability semantics remain identical:
 * - Presentation drift is HIGH (> 0.7)
 * - Capability drift is LOW (< 0.15)
 * - Transition drift is LOW (< 0.15)
 * - The existing validated capability route remains usable without breaking
 */

import { describe, it, expect } from 'vitest';
import { TypedDriftDetector, ObservedElementFeatures } from '../../src/core/drift/detector';
import { DriftClassifier } from '../../src/core/drift/classifier';
import { FunctionalCapabilityFingerprint } from '../../src/types/capability';

describe('Phase 8: Presentation-Only Drift Demonstration', () => {
  const storedCapability: FunctionalCapabilityFingerprint = {
    capabilityId: 'CAP_DISABLE_MARKETING',
    canonicalFunction: 'disable_marketing_communications',
    actionType: 'TOGGLE',
    targetEntity: 'MARKETING_NOTIFICATIONS',
    mandatoryPreStatePredicates: [
      {
        id: 'pred_enabled',
        name: 'Check Enabled',
        description: 'Control must be checked',
        evaluate: (ctx) => ctx['checked'] === true,
      },
    ],
    allowedStateDelta: [{ property: 'checked', expectedChange: 'ENABLED_TO_DISABLED' }],
    expectedPostState: [{ property: 'marketing_emails_enabled', expectedValue: false }],
    requiredContextPredicates: [{ target: 'container', pattern: 'notification', required: true }],
    forbiddenContextPredicates: [],
    semanticEvidence: {
      canonicalLabel: 'Disable Marketing Emails',
      semanticSynonyms: ['turn off marketing emails'],
      accessibleName: 'Disable Marketing Emails',
      role: 'switch',
      visibleLabel: 'Disable Marketing Emails',
      sectionMeaning: 'Notifications',
      actionDescription: 'Disable promotional marketing emails',
    },
    contextEvidence: {
      ancestorRelationships: ['section[notification preferences]', 'main[settings]'],
      nearbyText: ['Receive promotional offers and newsletters'],
      surroundingLabels: ['Marketing Communications'],
      containerSemantics: ['notification preferences', 'settings'],
      menuPanelRelationships: ['Notifications'],
      relativeStructuralRelationships: ['main > section:nth-of-type(2) > div > button'],
      urlSemantics: '/settings/notifications',
    },
    transitionEvidence: {
      preStateFingerprint: 'PRE_1',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: { marketing_emails_enabled: false },
      postStateFingerprint: 'POST_1',
      historicalTransitionObservations: 10,
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
    provenance: { source: 'INITIAL_SPEC', creationTimestamp: Date.now(), validationTimestamp: Date.now(), routeVersion: 'v1.0.0', validationHistory: [] },
    confidence: { capabilityConfidence: 0.95, routeConfidence: 0.90 },
    negativeEvidence: { rejectedCandidateIdentities: [], contradictionPredicates: [], failedInvariantPredicates: [], failedTransitionWitnesses: [], decoyRelationships: [], rejectionReasons: [] },
  };

  it('demonstrates high presentation drift with low capability and transition drift', () => {
    // Version B: Scrambled framework ID and utility CSS, but identical functional semantics
    const driftedObserved: ObservedElementFeatures = {
      tag: 'button',
      id: ':r918:', // React Aria dynamic auto-increment ID
      classes: ['css-8291', 'x-19', 'p-4', 'flex', 'items-center'], // CSS-in-JS utility hashes
      role: 'switch',
      accessibleName: 'Disable Marketing Emails',
      ancestors: ['section[notification preferences]', 'main[settings]'],
      containerSemantics: ['notification preferences', 'settings'],
      nearbyText: ['Receive promotional offers and newsletters'],
      relativeStructuralPath: 'main > section:nth-of-type(2) > div > button',
      observedActionType: 'TOGGLE',
      observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      observedPreState: { checked: true },
    };

    const driftVector = TypedDriftDetector.computeDrift(storedCapability, driftedObserved);

    // Assert: Presentation drift is HIGH (> 0.7)
    expect(driftVector.presentation).toBeGreaterThan(0.70);

    // Assert: Capability drift is LOW (0.0)
    expect(driftVector.capability).toBeLessThanOrEqual(0.10);

    // Assert: Transition drift is LOW (0.0)
    expect(driftVector.transition).toBeLessThanOrEqual(0.10);

    // Assert: Context and Structural drift are LOW (0.0)
    expect(driftVector.context).toBe(0.0);
    expect(driftVector.structure).toBe(0.0);

    // Classify drift action
    const classification = DriftClassifier.classify(driftVector);
    // When only presentation drifts and capability/transition are preserved, route remains active or validated
    expect(['MAINTAIN_ACTIVE', 'TRIGGER_VALIDATION']).toContain(classification.actionRequired);
  });
});
