/**
 * IntentNav-SCFR: Typed Drift Detector
 *
 * Phase 7 Implementation:
 * Computes 5-dimensional typed drift vector: [presentation, context, structure, capability, transition]
 * Each dimension compares equivalent evidence types with continuous normalized metric distances in [0, 1].
 * Zero arbitrary constant assignments.
 */

import { TypedDriftVector } from '../../types/drift';
import { FunctionalCapabilityFingerprint } from '../../types/capability';
import { VolatileFeatureSuppressor } from '../fingerprint/suppressor';

export interface ObservedElementFeatures {
  tag: string;
  id?: string;
  classes?: string[];
  role?: string;
  accessibleName?: string;
  ancestors?: string[];
  containerSemantics?: string[];
  nearbyText?: string[];
  relativeStructuralPath?: string;
  observedActionType?: string;
  observedTargetEntity?: string;
  observedPreState?: Record<string, unknown>;
}

export class TypedDriftDetector {
  /**
   * Jaccard distance between two string arrays in [0.0, 1.0]
   */
  private static jaccardDistance(a: string[], b: string[]): number {
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
  private static normalizedStringDistance(a: string, b: string): number {
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
   * Computes the 5D Typed Drift Vector comparing stored fingerprint to observed features
   */
  public static computeDrift(
    stored: FunctionalCapabilityFingerprint,
    observed: ObservedElementFeatures
  ): TypedDriftVector {
    // 1. Presentation Drift: Compares IDs, classes, and volatile style tokens
    let presentation = 0.0;
    const observedId = observed.id || '';
    const isObservedIdVolatile = VolatileFeatureSuppressor.isVolatileId(observedId);
    const observedClasses = observed.classes || [];
    const sanitizedObservedClasses = VolatileFeatureSuppressor.sanitizeClasses(observedClasses.join(' '));

    let idDrift = 0.0;
    if (isObservedIdVolatile) {
      idDrift = 0.95;
    } else if (observedId && observedId !== stored.capabilityId) {
      idDrift = this.normalizedStringDistance(stored.capabilityId, observedId);
    }

    let classDrift = 0.0;
    if (observedClasses.length > 0) {
      const volatileCount = observedClasses.length - sanitizedObservedClasses.length;
      classDrift = volatileCount / observedClasses.length;
    }

    presentation = Math.min(1.0, 0.5 * idDrift + 0.5 * classDrift);
    if (isObservedIdVolatile && classDrift > 0.5) {
      presentation = Math.max(presentation, 0.85);
    }

    // 2. Contextual Drift: Compares equivalent context channels (ancestors, nearby text, container semantics)
    let context = 0.0;
    const storedAncestors = stored.contextEvidence.ancestorRelationships || [];
    const observedAncestors = observed.ancestors || [];
    const ancestorDist = observed.ancestors !== undefined
      ? this.jaccardDistance(storedAncestors, observedAncestors)
      : 0.0;

    const storedNearby = stored.contextEvidence.nearbyText || [];
    const observedNearby = observed.nearbyText || [];
    const nearbyDist = observed.nearbyText !== undefined
      ? this.jaccardDistance(storedNearby, observedNearby)
      : 0.0;

    const storedContainers = stored.contextEvidence.containerSemantics || [];
    const observedContainers = observed.containerSemantics || [];
    const containerDist = observed.containerSemantics !== undefined
      ? this.jaccardDistance(storedContainers, observedContainers)
      : 0.0;

    context = 0.4 * ancestorDist + 0.3 * nearbyDist + 0.3 * containerDist;

    // 3. Structural Drift: Compares relative DOM hierarchy paths
    let structure = 0.0;
    const storedPath = stored.contextEvidence.relativeStructuralRelationships[0] || '';
    const observedPath = observed.relativeStructuralPath || '';

    if (observed.relativeStructuralPath !== undefined) {
      if (storedPath === observedPath) {
        structure = 0.0;
      } else {
        const storedSegments = storedPath.split('>').map((s) => s.trim());
        const observedSegments = observedPath.split('>').map((s) => s.trim());
        structure = this.jaccardDistance(storedSegments, observedSegments);
      }
    }

    // 4. Capability Drift: Compares functional semantics (role, target entity, action type)
    let capability = 0.0;
    let targetDiff = 0.0;
    if (observed.observedTargetEntity) {
      targetDiff =
        observed.observedTargetEntity.toLowerCase() === stored.targetEntity.toLowerCase()
          ? 0.0
          : 1.0;
    }

    let actionDiff = 0.0;
    if (observed.observedActionType) {
      if (observed.observedActionType === stored.actionType) {
        actionDiff = 0.0;
      } else if (
        (stored.actionType === 'MODIFY_PREFERENCE' && observed.observedActionType === 'TOGGLE') ||
        (stored.actionType === 'TOGGLE' && observed.observedActionType === 'MODIFY_PREFERENCE')
      ) {
        actionDiff = 0.25; // Compatible
      } else {
        actionDiff = 1.0;
      }
    }

    let roleDiff = 0.0;
    if (observed.role) {
      const storedRole = (stored.semanticEvidence.role || '').toLowerCase();
      const obsRole = observed.role.toLowerCase();
      if (storedRole === obsRole) {
        roleDiff = 0.0;
      } else if (
        (storedRole === 'switch' && obsRole === 'button') ||
        (storedRole === 'button' && obsRole === 'switch')
      ) {
        roleDiff = 0.20;
      } else {
        roleDiff = 0.80;
      }
    }

    capability = Math.min(1.0, 0.50 * targetDiff + 0.30 * actionDiff + 0.20 * roleDiff);

    // 5. Transition Drift: Compares pre-state and transition signature expectations
    let transition = 0.0;
    if (observed.observedPreState && stored.mandatoryPreStatePredicates.length > 0) {
      let failedPreCount = 0;
      for (const pred of stored.mandatoryPreStatePredicates) {
        try {
          if (!pred.evaluate(observed.observedPreState)) failedPreCount++;
        } catch {
          failedPreCount++;
        }
      }
      transition = failedPreCount / stored.mandatoryPreStatePredicates.length;
    }

    return {
      presentation: Number(Math.min(1.0, Math.max(0.0, presentation)).toFixed(2)),
      context: Number(Math.min(1.0, Math.max(0.0, context)).toFixed(2)),
      structure: Number(Math.min(1.0, Math.max(0.0, structure)).toFixed(2)),
      capability: Number(Math.min(1.0, Math.max(0.0, capability)).toFixed(2)),
      transition: Number(Math.min(1.0, Math.max(0.0, transition)).toFixed(2)),
    };
  }
}
