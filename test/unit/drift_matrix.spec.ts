/**
 * IntentNav-SCFR: 5D Typed Drift Matrix and Regression Tests
 *
 * Covers:
 * - A. Class drift token count correctness (all 6 cases)
 * - B. Presentation-only drift
 * - C. Context-only drift
 * - D. Structural-only drift
 * - E. Capability-only drift
 * - F. Transition-only drift with multi-channel semantics and UNKNOWN states
 * - G. Dominant dimension localization and boundary cases
 */

import { describe, it, expect } from 'vitest';
import {
  TypedDriftDetector,
  PRESENTATION_WEIGHTS,
  CONTEXT_WEIGHTS,
  CAPABILITY_WEIGHTS,
  TRANSITION_WEIGHTS,
} from '../../src/core/drift/detector';
import { DriftClassifier, DEFAULT_DRIFT_THRESHOLDS } from '../../src/core/drift/classifier';
import { FunctionalCapabilityFingerprint } from '../../src/types/capability';

describe('5D Typed Drift Matrix & Dimension Isolation', () => {
  const baseFingerprint: FunctionalCapabilityFingerprint = {
    capabilityId: 'CAP_MANAGE_MARKETING',
    canonicalFunction: 'disable_marketing_communications',
    actionType: 'MODIFY_PREFERENCE',
    targetEntity: 'MARKETING_NOTIFICATIONS',
    mandatoryPreStatePredicates: [
      {
        id: 'PRE_CHECKED',
        name: 'Marketing Enabled',
        description: 'Marketing notifications must be enabled',
        evaluate: (state: any) => state.marketing_notifications_enabled === true,
      },
    ],
    allowedStateDelta: [
      {
        property: 'marketing_notifications_enabled',
        expectedChange: 'ENABLED_TO_DISABLED',
      },
    ],
    expectedPostState: [
      {
        property: 'marketing_notifications_enabled',
        expectedValue: false,
      },
    ],
    requiredContextPredicates: [],
    forbiddenContextPredicates: [],
    semanticEvidence: {
      canonicalLabel: 'Disable marketing notifications',
      semanticSynonyms: ['turn off notifications'],
      accessibleName: 'Turn off marketing notifications',
      role: 'switch',
      visibleLabel: 'Turn off marketing notifications',
      sectionMeaning: 'Notifications',
      actionDescription: 'Disable promotional marketing notifications',
    },
    contextEvidence: {
      ancestorRelationships: ['section[notifications]', 'main[settings]'],
      nearbyText: ['promotional offers', 'newsletter updates'],
      surroundingLabels: ['Marketing Communications'],
      containerSemantics: ['notifications', 'settings'],
      menuPanelRelationships: ['notifications'],
      relativeStructuralRelationships: [
        'main > section:nth-of-type(1) > div > button:nth-of-type(1)',
      ],
      urlSemantics: '/settings/notifications',
    },
    transitionEvidence: {
      preStateFingerprint: 'STATE_PRE_ON',
      activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
      expectedDelta: { marketing_notifications_enabled: false },
      postStateFingerprint: 'STATE_POST_OFF',
      historicalTransitionObservations: 10,
      witnessClasses: ['APPLICATION_STATE_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
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
    confidence: { capabilityConfidence: 0.95, routeConfidence: 0.90 },
    negativeEvidence: {
      rejectedCandidateIdentities: [],
      contradictionPredicates: [],
      failedInvariantPredicates: [],
      failedTransitionWitnesses: [],
      decoyRelationships: [],
      rejectionReasons: [],
    },
  };

  // ==========================================================================
  // SECTION A: CLASS DRIFT TOKEN COUNT CORRECTNESS
  // ==========================================================================
  describe('A. Class Drift Token Count Bugfix & Scenarios', () => {
    it('1. no class change yields 0.0 drift', () => {
      const stored = ['btn', 'btn-primary'];
      const observed = ['btn', 'btn-primary'];
      const drift = TypedDriftDetector.computeClassDrift(stored, observed);
      expect(drift).toBe(0.0);
    });

    it('2. reordered classes yield 0.0 drift (order independence)', () => {
      const stored = ['btn', 'btn-primary', 'active'];
      const observed = ['active', 'btn-primary', 'btn'];
      const drift = TypedDriftDetector.computeClassDrift(stored, observed);
      expect(drift).toBe(0.0);
    });

    it('3. volatile class change increases drift without throwing or using character count', () => {
      const stored = ['btn', 'btn-primary'];
      // Adding styled-components dynamic class
      const observed = ['btn', 'btn-primary', 'sc-bdVaJa'];
      const drift = TypedDriftDetector.computeClassDrift(stored, observed);
      expect(drift).toBeGreaterThan(0.0);
      expect(drift).toBeLessThanOrEqual(1.0);
      // Normalized Jaccard distance: intersection 2, union 3 -> 1 - 2/3 = 0.33
      expect(drift).toBeCloseTo(0.33, 2);
    });

    it('4. stable class change is correctly quantified', () => {
      const stored = ['btn', 'btn-primary'];
      const observed = ['btn', 'btn-secondary'];
      const drift = TypedDriftDetector.computeClassDrift(stored, observed);
      // Intersection 1, Union 3 -> 1 - 1/3 = 0.67
      expect(drift).toBeCloseTo(0.67, 2);
    });

    it('5. multiple class changes produce continuous normalized drift in [0, 1]', () => {
      const stored = ['nav-item', 'active', 'menu-link'];
      const observed = ['sidebar-item', 'collapsed', 'link-dark', 'extra-pill'];
      const drift = TypedDriftDetector.computeClassDrift(stored, observed);
      // Disjoint sets: intersection 0 -> Jaccard 1.0
      expect(drift).toBe(1.0);
    });

    it('6. volatile utility class changes evaluated against unassisted observed classes', () => {
      // When stored baseline is omitted, ratio of volatile tokens to total tokens is measured
      const observed = ['btn-save', 'p-4', 'flex', 'items-center', 'text-sm'];
      // 1 semantic class ('btn-save'), 4 utility classes
      const drift = TypedDriftDetector.computeClassDrift(null, observed);
      expect(drift).toBe(4 / 5);
      expect(drift).toBe(0.8);
    });

    it('7. whitespace-separated class strings in array elements are correctly tokenized', () => {
      const stored = ['btn   btn-primary'];
      const observed = ['btn-primary', 'btn'];
      const drift = TypedDriftDetector.computeClassDrift(stored, observed);
      expect(drift).toBe(0.0);
    });
  });

  // ==========================================================================
  // SECTION B: PRESENTATION DRIFT ISOLATION
  // ==========================================================================
  describe('B. Presentation-Only Drift', () => {
    it('drastic presentation change does not leak into capability or transition drift', () => {
      const vector = TypedDriftDetector.computeDrift(baseFingerprint, {
        tag: 'button',
        id: ':r1928:', // Volatile framework ID (React 18 useId)
        classes: ['css-99182', 'x-19', 'p-4', 'flex', 'items-center'], // Volatile styles
        role: 'switch',
        ancestors: ['section[notifications]', 'main[settings]'],
        nearbyText: ['promotional offers', 'newsletter updates'],
        containerSemantics: ['notifications', 'settings'],
        relativeStructuralPath: 'main > section:nth-of-type(1) > div > button:nth-of-type(1)',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedPreState: { marketing_notifications_enabled: true },
      });

      expect(vector.presentation).toBeGreaterThan(0.70);
      expect(vector.context).toBe(0.0);
      expect(vector.structure).toBe(0.0);
      expect(vector.capability).toBe(0.0);
      expect(vector.transition).toBe(0.0);

      const decision = DriftClassifier.classify(vector);
      expect(decision.actionRequired).toBe('MAINTAIN_ACTIVE');
      expect(decision.dominantDriftDimension).toBe('presentation');
    });
  });

  // ==========================================================================
  // SECTION C: CONTEXT DRIFT ISOLATION
  // ==========================================================================
  describe('C. Context-Only Drift', () => {
    it('detects relocated containers and altered nearby text without capability drift', () => {
      const vector = TypedDriftDetector.computeDrift(baseFingerprint, {
        tag: 'button',
        id: 'btn-marketing-toggle',
        storedId: 'btn-marketing-toggle',
        role: 'switch',
        // Ancestors and container completely shifted from notifications to privacy
        ancestors: ['section[privacy-center]', 'aside[data-protection]'],
        nearbyText: ['telemetry data', 'third-party trackers'],
        containerSemantics: ['privacy', 'compliance'],
        relativeStructuralPath: 'main > section:nth-of-type(1) > div > button:nth-of-type(1)',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedPreState: { marketing_notifications_enabled: true },
      });

      expect(vector.context).toBeGreaterThan(0.70);
      expect(vector.capability).toBe(0.0);
      expect(vector.transition).toBe(0.0);

      const decision = DriftClassifier.classify(vector);
      expect(decision.actionRequired).toBe('TRIGGER_VALIDATION');
      expect(decision.dominantDriftDimension).toBe('context');
    });
  });

  // ==========================================================================
  // SECTION D: STRUCTURAL DRIFT ISOLATION
  // ==========================================================================
  describe('D. Structural-Only Drift', () => {
    it('detects deeply nested DOM reorganization without capability drift', () => {
      const vector = TypedDriftDetector.computeDrift(baseFingerprint, {
        tag: 'button',
        id: 'btn-marketing-toggle',
        storedId: 'btn-marketing-toggle',
        role: 'switch',
        ancestors: ['section[notifications]', 'main[settings]'],
        nearbyText: ['promotional offers', 'newsletter updates'],
        containerSemantics: ['notifications', 'settings'],
        // Reorganized deep hierarchy
        relativeStructuralPath: 'body > div#app-root > drawer-portal > modal-card > div > button',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedPreState: { marketing_notifications_enabled: true },
      });

      expect(vector.structure).toBeGreaterThan(0.60);
      expect(vector.capability).toBe(0.0);
      expect(vector.transition).toBe(0.0);

      const decision = DriftClassifier.classify(vector);
      expect(decision.actionRequired).toBe('TRIGGER_VALIDATION');
      expect(decision.dominantDriftDimension).toBe('structure');
    });
  });

  // ==========================================================================
  // SECTION E: CAPABILITY DRIFT ISOLATION
  // ==========================================================================
  describe('E. Capability-Only Drift', () => {
    it('detects altered target entity and action type regardless of label text', () => {
      const vector = TypedDriftDetector.computeDrift(baseFingerprint, {
        tag: 'button',
        id: 'btn-marketing-toggle',
        storedId: 'btn-marketing-toggle',
        role: 'button',
        // Target is now account deletion and action is DEACTIVATE_ACCOUNT
        observedActionType: 'DEACTIVATE_ACCOUNT',
        observedTargetEntity: 'ACCOUNT_STATUS',
        ancestors: ['section[notifications]', 'main[settings]'],
        nearbyText: ['promotional offers', 'newsletter updates'],
        containerSemantics: ['notifications', 'settings'],
        relativeStructuralPath: 'main > section:nth-of-type(1) > div > button:nth-of-type(1)',
        observedPreState: { marketing_notifications_enabled: true },
      });

      expect(vector.capability).toBeGreaterThan(0.80);
      expect(vector.presentation).toBe(0.0);

      const decision = DriftClassifier.classify(vector);
      expect(decision.actionRequired).toBe('TRIGGER_REBIND_RECOVERY');
      expect(decision.dominantDriftDimension).toBe('capability');
    });
  });

  // ==========================================================================
  // SECTION F: TRANSITION DRIFT & UNKNOWN STATUS
  // ==========================================================================
  describe('F. Transition Drift & Multi-Channel Semantics', () => {
    it('1. represents unobserved transition evidence as UNKNOWN without fabricating scores', () => {
      // Prior to activation: no preState, delta, postState, or witnesses provided
      const vector = TypedDriftDetector.computeDrift(baseFingerprint, {
        tag: 'button',
        id: 'btn-marketing-toggle',
        storedId: 'btn-marketing-toggle',
        role: 'switch',
        ancestors: ['section[notifications]', 'main[settings]'],
        nearbyText: ['promotional offers', 'newsletter updates'],
        containerSemantics: ['notifications', 'settings'],
        relativeStructuralPath: 'main > section:nth-of-type(1) > div > button:nth-of-type(1)',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
      });

      expect(vector.transition).toBe(0.0);
      expect(vector.transitionStatus).toEqual({
        preState: 'UNKNOWN',
        allowedDelta: 'UNKNOWN',
        postState: 'UNKNOWN',
        activationEventType: 'UNKNOWN',
        witnessClasses: 'UNKNOWN',
      });
    });

    it('2. detects pre-state predicate violation', () => {
      const vector = TypedDriftDetector.computeDrift(baseFingerprint, {
        tag: 'button',
        id: 'btn-marketing-toggle',
        storedId: 'btn-marketing-toggle',
        role: 'switch',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        // Marketing is already false; violates PRE_CHECKED!
        observedPreState: { marketing_notifications_enabled: false },
      });

      expect(vector.transition).toBe(1.0);
      expect(vector.transitionStatus?.preState).toBe('EVALUATED');
      expect(vector.capability).toBe(0.0);

      const decision = DriftClassifier.classify(vector);
      expect(decision.actionRequired).toBe('TRIGGER_VALIDATION');
      expect(decision.dominantDriftDimension).toBe('transition');
    });

    it('3. detects allowed state delta mismatch when post-activation delta is observed', () => {
      const vector = TypedDriftDetector.computeDrift(baseFingerprint, {
        tag: 'button',
        id: 'btn-marketing-toggle',
        storedId: 'btn-marketing-toggle',
        role: 'switch',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedPreState: { marketing_notifications_enabled: true },
        // Unexpected state delta occurred!
        observedStateDelta: { marketing_notifications_enabled: true },
      });

      expect(vector.transition).toBeGreaterThan(0.0);
      expect(vector.transitionStatus?.allowedDelta).toBe('EVALUATED');
    });

    it('4. detects expected post-state mismatch', () => {
      const vector = TypedDriftDetector.computeDrift(baseFingerprint, {
        tag: 'button',
        id: 'btn-marketing-toggle',
        storedId: 'btn-marketing-toggle',
        role: 'switch',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedPreState: { marketing_notifications_enabled: true },
        // Post state should be false, observed is true
        observedPostState: { marketing_notifications_enabled: true },
      });

      expect(vector.transition).toBeGreaterThan(0.0);
      expect(vector.transitionStatus?.postState).toBe('EVALUATED');
    });

    it('5. detects activation event type mismatch', () => {
      const vector = TypedDriftDetector.computeDrift(baseFingerprint, {
        tag: 'button',
        id: 'btn-marketing-toggle',
        storedId: 'btn-marketing-toggle',
        role: 'switch',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedPreState: { marketing_notifications_enabled: true },
        // Stored requires 'click', observed is 'submit'
        observedActivationEventType: 'submit',
      });

      expect(vector.transition).toBeGreaterThan(0.0);
      expect(vector.transitionStatus?.activationEventType).toBe('EVALUATED');
    });

    it('6. detects witness class quorum mismatch', () => {
      const vector = TypedDriftDetector.computeDrift(baseFingerprint, {
        tag: 'button',
        id: 'btn-marketing-toggle',
        storedId: 'btn-marketing-toggle',
        role: 'switch',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedPreState: { marketing_notifications_enabled: true },
        // Completely different witness class emitted
        observedWitnessClasses: ['NETWORK_REQUEST_INSPECTED'],
      });

      expect(vector.transition).toBeGreaterThan(0.0);
      expect(vector.transitionStatus?.witnessClasses).toBe('EVALUATED');
    });
  });

  // ==========================================================================
  // SECTION G: BOUNDARY CONDITIONS & QUARANTINE TRIGGER
  // ==========================================================================
  describe('G. Boundary Conditions & Classification Actions', () => {
    it('1. zero drift across all 5 dimensions yields [0,0,0,0,0] and MAINTAIN_ACTIVE', () => {
      const vector = TypedDriftDetector.computeDrift(baseFingerprint, {
        tag: 'button',
        id: 'btn-marketing-toggle',
        storedId: 'btn-marketing-toggle',
        classes: ['btn', 'btn-switch'],
        storedClasses: ['btn', 'btn-switch'],
        role: 'switch',
        ancestors: ['section[notifications]', 'main[settings]'],
        nearbyText: ['promotional offers', 'newsletter updates'],
        containerSemantics: ['notifications', 'settings'],
        relativeStructuralPath: 'main > section:nth-of-type(1) > div > button:nth-of-type(1)',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedPreState: { marketing_notifications_enabled: true },
        observedActivationEventType: 'click',
        observedWitnessClasses: ['APPLICATION_STATE_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
      });

      expect(vector.presentation).toBe(0.0);
      expect(vector.context).toBe(0.0);
      expect(vector.structure).toBe(0.0);
      expect(vector.capability).toBe(0.0);
      expect(vector.transition).toBe(0.0);

      const decision = DriftClassifier.classify(vector);
      expect(decision.actionRequired).toBe('MAINTAIN_ACTIVE');
      expect(decision.triggerFactors[0]).toContain('Zero drift detected');
    });

    it('2. extreme concurrent capability and transition drift triggers QUARANTINE_IMMEDIATELY', () => {
      const vector = TypedDriftDetector.computeDrift(baseFingerprint, {
        tag: 'button',
        id: ':r_random:',
        role: 'alertdialog',
        observedActionType: 'DELETE',
        observedTargetEntity: 'ALL_USER_CREDENTIALS',
        observedPreState: { marketing_notifications_enabled: false },
        observedStateDelta: { user_credentials_deleted: true },
        observedActivationEventType: 'submit',
      });

      expect(vector.capability).toBeGreaterThanOrEqual(0.90);
      expect(vector.transition).toBeGreaterThanOrEqual(0.90);

      const decision = DriftClassifier.classify(vector);
      expect(decision.actionRequired).toBe('QUARANTINE_IMMEDIATELY');
      expect(decision.triggerFactors[0]).toContain('quarantine required');
    });

    it('3. named weights sum to 1.0 within each sub-dimension', () => {
      const pSum = PRESENTATION_WEIGHTS.ID_WEIGHT + PRESENTATION_WEIGHTS.CLASS_WEIGHT;
      expect(pSum).toBeCloseTo(1.0, 5);

      const cSum =
        CONTEXT_WEIGHTS.ANCESTOR_WEIGHT +
        CONTEXT_WEIGHTS.NEARBY_TEXT_WEIGHT +
        CONTEXT_WEIGHTS.CONTAINER_WEIGHT;
      expect(cSum).toBeCloseTo(1.0, 5);

      const capSum =
        CAPABILITY_WEIGHTS.TARGET_WEIGHT +
        CAPABILITY_WEIGHTS.ACTION_WEIGHT +
        CAPABILITY_WEIGHTS.ROLE_WEIGHT;
      expect(capSum).toBeCloseTo(1.0, 5);

      const tSum =
        TRANSITION_WEIGHTS.PRE_STATE_WEIGHT +
        TRANSITION_WEIGHTS.DELTA_WEIGHT +
        TRANSITION_WEIGHTS.POST_STATE_WEIGHT +
        TRANSITION_WEIGHTS.EVENT_TYPE_WEIGHT +
        TRANSITION_WEIGHTS.WITNESS_WEIGHT;
      expect(tSum).toBeCloseTo(1.0, 5);
    });

    it('4. default calibrated thresholds are exposed and documented', () => {
      expect(DEFAULT_DRIFT_THRESHOLDS.presentationRecoveryThreshold).toBe(0.90);
      expect(DEFAULT_DRIFT_THRESHOLDS.contextValidationThreshold).toBe(0.40);
      expect(DEFAULT_DRIFT_THRESHOLDS.structureValidationThreshold).toBe(0.45);
      expect(DEFAULT_DRIFT_THRESHOLDS.capabilityRebindThreshold).toBe(0.20);
      expect(DEFAULT_DRIFT_THRESHOLDS.transitionRebindThreshold).toBe(0.25);
      expect(DEFAULT_DRIFT_THRESHOLDS.extremeDriftQuarantineThreshold).toBe(0.90);
    });
  });
});
