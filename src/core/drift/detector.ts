/**
 * IntentNav-SCFR: Typed Drift Detector
 *
 * Computes 5-dimensional typed drift vector: [presentation, context, structure, capability, transition]
 * Each dimension compares equivalent evidence types with continuous normalized metric distances in [0, 1].
 * All weights and thresholds are named, documented, and normalized.
 */

import { TypedDriftVector, TransitionEvidenceStatus } from '../../types/drift';
import { FunctionalCapabilityFingerprint, InvariantPredicate } from '../../types/capability';
import { VolatileFeatureSuppressor } from '../fingerprint/suppressor';

export interface ObservedElementFeatures {
  tag: string;
  id?: string;
  classes?: string[];
  storedClasses?: string[];
  storedId?: string;
  role?: string;
  accessibleName?: string;
  ancestors?: string[];
  containerSemantics?: string[];
  nearbyText?: string[];
  relativeStructuralPath?: string;
  observedActionType?: string;
  observedTargetEntity?: string;
  observedPreState?: Record<string, unknown>;
  // Transition evidence channels
  observedStateDelta?: Record<string, unknown>;
  observedPostState?: Record<string, unknown>;
  observedActivationEventType?: string;
  observedWitnessClasses?: string[];
  candidatePredicates?: InvariantPredicate[];
}

/**
 * Normalized sub-dimension weights for presentation drift.
 * ID token and class tokens are equally weighted at 0.50 each.
 */
export const PRESENTATION_WEIGHTS = {
  ID_WEIGHT: 0.50,
  CLASS_WEIGHT: 0.50,
} as const;

/**
 * Normalized sub-dimension weights for contextual drift.
 * Ancestor relationships (0.40) carry highest structural context,
 * nearby text (0.30) and container semantics (0.30) provide local semantic framing.
 */
export const CONTEXT_WEIGHTS = {
  ANCESTOR_WEIGHT: 0.40,
  NEARBY_TEXT_WEIGHT: 0.30,
  CONTAINER_WEIGHT: 0.30,
} as const;

/**
 * Normalized sub-dimension weights for capability-semantic drift.
 * Target entity (0.50) is the primary functional determinant,
 * action type (0.30) and accessible role (0.20) refine interactive semantics.
 */
export const CAPABILITY_WEIGHTS = {
  TARGET_WEIGHT: 0.50,
  ACTION_WEIGHT: 0.30,
  ROLE_WEIGHT: 0.20,
} as const;

/**
 * Normalized sub-dimension weights for transition drift.
 * When all transition channels are observable:
 * - Pre-state predicate validity: 0.30
 * - Allowed state delta compatibility: 0.25
 * - Expected post-state match: 0.25
 * - Activation event type match: 0.10
 * - Witness class quorum match: 0.10
 */
export const TRANSITION_WEIGHTS = {
  PRE_STATE_WEIGHT: 0.30,
  DELTA_WEIGHT: 0.25,
  POST_STATE_WEIGHT: 0.25,
  EVENT_TYPE_WEIGHT: 0.10,
  WITNESS_WEIGHT: 0.10,
} as const;

export class TypedDriftDetector {
  /**
   * Jaccard distance between two string arrays in [0.0, 1.0]
   */
  public static jaccardDistance(a: string[], b: string[]): number {
    if (a.length === 0 && b.length === 0) return 0.0;
    if (a.length === 0 || b.length === 0) return 1.0;
    const setA = new Set(a.map((s) => s.toLowerCase().trim()).filter(Boolean));
    const setB = new Set(b.map((s) => s.toLowerCase().trim()).filter(Boolean));
    if (setA.size === 0 && setB.size === 0) return 0.0;
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    if (union.size === 0) return 0.0;
    return 1.0 - intersection.size / union.size;
  }

  /**
   * Normalized Levenshtein distance between two strings in [0.0, 1.0]
   */
  public static normalizedStringDistance(a: string, b: string): number {
    const s1 = a.trim().toLowerCase();
    const s2 = b.trim().toLowerCase();
    if (s1 === s2) return 0.0;
    if (s1.length === 0) return 1.0;
    if (s2.length === 0) return 1.0;

    const matrix: number[][] = [];
    for (let i = 0; i <= s1.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s2.length; j++) {
      matrix[0]![j] = j;
    }

    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j]! + 1,
          matrix[i]![j - 1]! + 1,
          matrix[i - 1]![j - 1]! + cost
        );
      }
    }

    const editDist = matrix[s1.length]![s2.length]!;
    return editDist / Math.max(s1.length, s2.length);
  }

  /**
   * Normalizes a collection of class strings into individual trimmed, lowercase tokens
   */
  public static extractClassTokens(classes?: string[] | null): string[] {
    if (!classes || !Array.isArray(classes)) return [];
    return classes
      .flatMap((cls) => (typeof cls === 'string' ? cls.split(/\s+/) : []))
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }

  /**
   * Computes class drift in [0.0, 1.0] ensuring both operands represent class token counts.
   *
   * If storedClasses is provided:
   * - Evaluates Jaccard distance over normalized tokens (reordering yields 0.0).
   * - Distinguishes volatile utility changes from stable semantic class shifts.
   *
   * If storedClasses is omitted:
   * - Measures the ratio of volatile styling/utility tokens to total observed tokens.
   */
  public static computeClassDrift(
    storedClasses?: string[] | null,
    observedClasses?: string[] | null
  ): number {
    const observedTokens = this.extractClassTokens(observedClasses);

    if (storedClasses !== undefined && storedClasses !== null) {
      const storedTokens = this.extractClassTokens(storedClasses);
      if (storedTokens.length === 0 && observedTokens.length === 0) return 0.0;
      if (storedTokens.length === 0 || observedTokens.length === 0) return 1.0;

      // Check exact set equality (handles reordering and duplicate normalization)
      const storedSet = new Set(storedTokens);
      const observedSet = new Set(observedTokens);
      if (storedSet.size === observedSet.size && [...storedSet].every((c) => observedSet.has(c))) {
        return 0.0;
      }

      return this.jaccardDistance(storedTokens, observedTokens);
    }

    // When stored baseline is not provided, evaluate volatile class ratio
    if (observedTokens.length === 0) return 0.0;
    const sanitizedTokens = VolatileFeatureSuppressor.sanitizeClasses(observedTokens.join(' ')).map((s) =>
      s.toLowerCase()
    );
    const sanitizedSet = new Set(sanitizedTokens);

    let volatileCount = 0;
    for (const token of observedTokens) {
      if (!sanitizedSet.has(token)) {
        volatileCount++;
      }
    }

    return volatileCount / observedTokens.length;
  }

  /**
   * Computes the 5D Typed Drift Vector comparing stored capability fingerprint to observed features
   */
  public static computeDrift(
    stored: FunctionalCapabilityFingerprint,
    observed: ObservedElementFeatures
  ): TypedDriftVector {
    // 1. Presentation Drift: Compares IDs, classes, and volatile style tokens
    let presentation = 0.0;
    const observedId = observed.id || '';
    const storedId = observed.storedId;
    const isObservedIdVolatile = VolatileFeatureSuppressor.isVolatileId(observedId);

    let idDrift = 0.0;
    if (storedId !== undefined && observedId) {
      if (storedId === observedId) {
        idDrift = 0.0;
      } else if (isObservedIdVolatile) {
        idDrift = 1.0;
      } else {
        idDrift = this.normalizedStringDistance(storedId, observedId);
      }
    } else if (isObservedIdVolatile) {
      idDrift = 1.0; // Volatile ID drift
    } else if (observedId) {
      idDrift = 0.0;
    }

    const classDrift = this.computeClassDrift(observed.storedClasses, observed.classes);
    presentation = Math.min(
      1.0,
      PRESENTATION_WEIGHTS.ID_WEIGHT * idDrift + PRESENTATION_WEIGHTS.CLASS_WEIGHT * classDrift
    );

    // 2. Contextual Drift: Compares equivalent context channels (ancestors, nearby text, container semantics)
    const storedAncestors = stored.contextEvidence?.ancestorRelationships || [];
    const observedAncestors = observed.ancestors;
    const hasAncestors = observedAncestors !== undefined;
    const ancestorDist = hasAncestors ? this.jaccardDistance(storedAncestors, observedAncestors) : 0.0;

    const storedNearby = stored.contextEvidence?.nearbyText || [];
    const observedNearby = observed.nearbyText;
    const hasNearby = observedNearby !== undefined;
    const nearbyDist = hasNearby ? this.jaccardDistance(storedNearby, observedNearby) : 0.0;

    const storedContainers = stored.contextEvidence?.containerSemantics || [];
    const observedContainers = observed.containerSemantics;
    const hasContainers = observedContainers !== undefined;
    const containerDist = hasContainers ? this.jaccardDistance(storedContainers, observedContainers) : 0.0;

    const contextWeightSum =
      (hasAncestors ? CONTEXT_WEIGHTS.ANCESTOR_WEIGHT : 0) +
      (hasNearby ? CONTEXT_WEIGHTS.NEARBY_TEXT_WEIGHT : 0) +
      (hasContainers ? CONTEXT_WEIGHTS.CONTAINER_WEIGHT : 0);

    let context = 0.0;
    if (contextWeightSum > 0) {
      context =
        ((hasAncestors ? CONTEXT_WEIGHTS.ANCESTOR_WEIGHT * ancestorDist : 0) +
          (hasNearby ? CONTEXT_WEIGHTS.NEARBY_TEXT_WEIGHT * nearbyDist : 0) +
          (hasContainers ? CONTEXT_WEIGHTS.CONTAINER_WEIGHT * containerDist : 0)) /
        contextWeightSum;
    }

    // 3. Structural Drift: Compares relative DOM hierarchy paths
    let structure = 0.0;
    const storedPaths = stored.contextEvidence?.relativeStructuralRelationships || [];
    const observedPath = observed.relativeStructuralPath;

    if (observedPath !== undefined) {
      const normObserved = observedPath.trim().toLowerCase();
      if (storedPaths.some((p) => p.trim().toLowerCase() === normObserved)) {
        structure = 0.0;
      } else if (storedPaths.length > 0) {
        const observedSegments = normObserved.split('>').map((s) => s.trim()).filter(Boolean);
        let minDist = 1.0;
        for (const sp of storedPaths) {
          const storedSegments = sp.toLowerCase().split('>').map((s) => s.trim()).filter(Boolean);
          const dist = this.jaccardDistance(storedSegments, observedSegments);
          if (dist < minDist) minDist = dist;
        }
        structure = minDist;
      } else {
        structure = 1.0;
      }
    }

    // 4. Capability Drift: Compares functional semantics (role, target entity, action type)
    let targetDiff = 0.0;
    const hasTarget = observed.observedTargetEntity !== undefined;
    if (hasTarget) {
      targetDiff =
        observed.observedTargetEntity!.toLowerCase() === stored.targetEntity.toLowerCase()
          ? 0.0
          : 1.0;
    }

    let actionDiff = 0.0;
    const hasAction = observed.observedActionType !== undefined;
    if (hasAction) {
      if (observed.observedActionType === stored.actionType) {
        actionDiff = 0.0;
      } else if (
        (stored.actionType === 'MODIFY_PREFERENCE' && observed.observedActionType === 'TOGGLE') ||
        (stored.actionType === 'TOGGLE' && observed.observedActionType === 'MODIFY_PREFERENCE')
      ) {
        actionDiff = 0.25; // Compatible action transition
      } else {
        actionDiff = 1.0;
      }
    }

    let roleDiff = 0.0;
    const hasRole = observed.role !== undefined;
    if (hasRole) {
      const storedRole = (stored.semanticEvidence?.role || '').toLowerCase();
      const obsRole = observed.role!.toLowerCase();
      if (storedRole === obsRole) {
        roleDiff = 0.0;
      } else if (
        (storedRole === 'switch' && obsRole === 'button') ||
        (storedRole === 'button' && obsRole === 'switch')
      ) {
        roleDiff = 0.20; // Compatible interactive controls
      } else {
        roleDiff = 1.0;
      }
    }

    const capWeightSum =
      (hasTarget ? CAPABILITY_WEIGHTS.TARGET_WEIGHT : 0) +
      (hasAction ? CAPABILITY_WEIGHTS.ACTION_WEIGHT : 0) +
      (hasRole ? CAPABILITY_WEIGHTS.ROLE_WEIGHT : 0);

    let capability = 0.0;
    if (capWeightSum > 0) {
      capability =
        ((hasTarget ? CAPABILITY_WEIGHTS.TARGET_WEIGHT * targetDiff : 0) +
          (hasAction ? CAPABILITY_WEIGHTS.ACTION_WEIGHT * actionDiff : 0) +
          (hasRole ? CAPABILITY_WEIGHTS.ROLE_WEIGHT * roleDiff : 0)) /
        capWeightSum;
    }

    // 5. Transition Drift: Evaluates all declared transition semantics without fabricating unobserved scores
    const transitionStatus: TransitionEvidenceStatus = {
      preState: 'UNKNOWN',
      allowedDelta: 'UNKNOWN',
      postState: 'UNKNOWN',
      activationEventType: 'UNKNOWN',
      witnessClasses: 'UNKNOWN',
    };

    let preStateDrift = 0.0;
    if (observed.observedPreState !== undefined) {
      transitionStatus.preState = 'EVALUATED';
      if (stored.mandatoryPreStatePredicates && stored.mandatoryPreStatePredicates.length > 0) {
        let failedCount = 0;
        for (const pred of stored.mandatoryPreStatePredicates) {
          try {
            if (!pred.evaluate(observed.observedPreState)) failedCount++;
          } catch {
            failedCount++;
          }
        }
        preStateDrift = failedCount / stored.mandatoryPreStatePredicates.length;
      } else {
        preStateDrift = 0.0;
      }
    }

    let deltaDrift = 0.0;
    if (observed.observedStateDelta !== undefined) {
      transitionStatus.allowedDelta = 'EVALUATED';
      const expectedDelta = stored.transitionEvidence?.expectedDelta || {};
      const expectedKeys = Object.keys(expectedDelta);
      if (expectedKeys.length > 0) {
        let mismatched = 0;
        for (const k of expectedKeys) {
          if (observed.observedStateDelta[k] !== expectedDelta[k]) {
            mismatched++;
          }
        }
        deltaDrift = mismatched / expectedKeys.length;
      } else if (stored.allowedStateDelta && stored.allowedStateDelta.length > 0) {
        let deltaMismatches = 0;
        for (const deltaPred of stored.allowedStateDelta) {
          if (deltaPred.property in observed.observedStateDelta) {
            const val = observed.observedStateDelta[deltaPred.property];
            if (deltaPred.expectedChange === 'ENABLED_TO_DISABLED' && val !== false) deltaMismatches++;
            if (deltaPred.expectedChange === 'DISABLED_TO_ENABLED' && val !== true) deltaMismatches++;
          } else {
            deltaMismatches++;
          }
        }
        deltaDrift = deltaMismatches / stored.allowedStateDelta.length;
      } else {
        deltaDrift = 0.0;
      }
    } else if (observed.observedPreState !== undefined && stored.allowedStateDelta && stored.allowedStateDelta.length > 0) {
      // Pre-activation check of allowed delta compatibility with observed current state
      transitionStatus.allowedDelta = 'EVALUATED';
      let incompatibleCount = 0;
      for (const deltaPred of stored.allowedStateDelta) {
        const prop = deltaPred.property;
        const currentVal = observed.observedPreState[prop];
        if (currentVal !== undefined) {
          if (deltaPred.expectedChange === 'ENABLED_TO_DISABLED' && currentVal === false) incompatibleCount++;
          if (deltaPred.expectedChange === 'DISABLED_TO_ENABLED' && currentVal === true) incompatibleCount++;
        }
      }
      deltaDrift = incompatibleCount / stored.allowedStateDelta.length;
    }

    let postStateDrift = 0.0;
    if (observed.observedPostState !== undefined) {
      transitionStatus.postState = 'EVALUATED';
      if (stored.expectedPostState && stored.expectedPostState.length > 0) {
        let failedPost = 0;
        for (const postPred of stored.expectedPostState) {
          if (postPred.property in observed.observedPostState) {
            if (postPred.expectedValue !== undefined) {
              if (observed.observedPostState[postPred.property] !== postPred.expectedValue) {
                failedPost++;
              }
            }
          } else {
            failedPost++;
          }
        }
        postStateDrift = failedPost / stored.expectedPostState.length;
      } else {
        postStateDrift = 0.0;
      }
    }

    let eventTypeDrift = 0.0;
    if (observed.observedActivationEventType !== undefined) {
      transitionStatus.activationEventType = 'EVALUATED';
      const expectedType = stored.transitionEvidence?.activationEventCharacteristics?.eventType;
      if (expectedType) {
        eventTypeDrift =
          observed.observedActivationEventType.toLowerCase().trim() === expectedType.toLowerCase().trim()
            ? 0.0
            : 1.0;
      } else {
        eventTypeDrift = 0.0;
      }
    }

    let witnessDrift = 0.0;
    if (observed.observedWitnessClasses !== undefined) {
      transitionStatus.witnessClasses = 'EVALUATED';
      const expectedWitnesses = stored.transitionEvidence?.witnessClasses || [];
      if (expectedWitnesses.length > 0) {
        witnessDrift = this.jaccardDistance(expectedWitnesses, observed.observedWitnessClasses);
      } else {
        witnessDrift = 0.0;
      }
    }

    const transitionWeightSum =
      (transitionStatus.preState === 'EVALUATED' ? TRANSITION_WEIGHTS.PRE_STATE_WEIGHT : 0) +
      (transitionStatus.allowedDelta === 'EVALUATED' ? TRANSITION_WEIGHTS.DELTA_WEIGHT : 0) +
      (transitionStatus.postState === 'EVALUATED' ? TRANSITION_WEIGHTS.POST_STATE_WEIGHT : 0) +
      (transitionStatus.activationEventType === 'EVALUATED' ? TRANSITION_WEIGHTS.EVENT_TYPE_WEIGHT : 0) +
      (transitionStatus.witnessClasses === 'EVALUATED' ? TRANSITION_WEIGHTS.WITNESS_WEIGHT : 0);

    let transition = 0.0;
    if (transitionWeightSum > 0) {
      transition =
        ((transitionStatus.preState === 'EVALUATED' ? TRANSITION_WEIGHTS.PRE_STATE_WEIGHT * preStateDrift : 0) +
          (transitionStatus.allowedDelta === 'EVALUATED' ? TRANSITION_WEIGHTS.DELTA_WEIGHT * deltaDrift : 0) +
          (transitionStatus.postState === 'EVALUATED' ? TRANSITION_WEIGHTS.POST_STATE_WEIGHT * postStateDrift : 0) +
          (transitionStatus.activationEventType === 'EVALUATED'
            ? TRANSITION_WEIGHTS.EVENT_TYPE_WEIGHT * eventTypeDrift
            : 0) +
          (transitionStatus.witnessClasses === 'EVALUATED' ? TRANSITION_WEIGHTS.WITNESS_WEIGHT * witnessDrift : 0)) /
        transitionWeightSum;
    }

    return {
      presentation: Number(Math.min(1.0, Math.max(0.0, presentation)).toFixed(2)),
      context: Number(Math.min(1.0, Math.max(0.0, context)).toFixed(2)),
      structure: Number(Math.min(1.0, Math.max(0.0, structure)).toFixed(2)),
      capability: Number(Math.min(1.0, Math.max(0.0, capability)).toFixed(2)),
      transition: Number(Math.min(1.0, Math.max(0.0, transition)).toFixed(2)),
      transitionStatus,
    };
  }
}
