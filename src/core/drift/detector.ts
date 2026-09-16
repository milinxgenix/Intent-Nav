/**
 * IntentNav-SCFR: Typed Drift Detector
 * Computes 5-dimensional typed drift vector: [presentation, context, structure, capability, transition]
 */

import { TypedDriftVector } from '../../types/drift';
import { FunctionalCapabilityFingerprint } from '../../types/capability';

export interface ObservedElementFeatures {
  tag: string;
  id?: string;
  classes?: string[];
  role?: string;
  accessibleName?: string;
  ancestors?: string[];
  nearbyText?: string[];
  relativeStructuralPath?: string;
  observedActionType?: string;
  observedTargetEntity?: string;
  observedPreState?: Record<string, unknown>;
}

export class TypedDriftDetector {
  /**
   * Helper: Jaccard distance between two string arrays (0.0 = identical, 1.0 = completely disjoint)
   */
  private static jaccardDistance(a: string[], b: string[]): number {
    if (a.length === 0 && b.length === 0) return 0.0;
    const setA = new Set(a.map((s) => s.toLowerCase().trim()));
    const setB = new Set(b.map((s) => s.toLowerCase().trim()));
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    if (union.size === 0) return 0.0;
    return 1.0 - intersection.size / union.size;
  }

  /**
   * Computes the Typed Drift Vector comparing stored fingerprint to current observed features
   */
  public static computeDrift(
    stored: FunctionalCapabilityFingerprint,
    observed: ObservedElementFeatures
  ): TypedDriftVector {
    // 1. Presentation Drift (IDs, classes, visual styling attributes)
    const storedClasses = stored.contextEvidence.relativeStructuralRelationships;
    const observedClasses = observed.classes || [];
    const presentation = observed.id && observed.id !== stored.capabilityId
      ? Math.min(1.0, 0.5 + this.jaccardDistance(storedClasses, observedClasses) * 0.5)
      : this.jaccardDistance(storedClasses, observedClasses);

    // 2. Contextual Drift (ancestors, nearby text, container semantics)
    let context = 0.0;
    if (observed.ancestors !== undefined || observed.nearbyText !== undefined) {
      const contextDistanceAncestors = observed.ancestors !== undefined
        ? this.jaccardDistance(stored.contextEvidence.ancestorRelationships, observed.ancestors)
        : 0.0;
      const contextDistanceNearby = observed.nearbyText !== undefined
        ? this.jaccardDistance(stored.contextEvidence.nearbyText, observed.nearbyText)
        : 0.0;
      context = 0.6 * contextDistanceAncestors + 0.4 * contextDistanceNearby;
    }

    // 3. Structural Drift (relative path / hierarchy changes)
    const storedPath = stored.contextEvidence.relativeStructuralRelationships[0] || '';
    const observedPath = observed.relativeStructuralPath;
    let structure = 0.0;
    if (observedPath !== undefined) {
      structure = storedPath === observedPath ? 0.0 : storedPath.length === 0 ? 0.5 : 0.65;
    }

    // 4. Capability Drift (role, target entity, functional action type)
    let capability = 0.0;
    if (observed.observedTargetEntity && observed.observedTargetEntity !== stored.targetEntity) {
      capability += 0.60;
    }
    if (observed.observedActionType && observed.observedActionType !== stored.actionType) {
      capability += 0.30;
    }
    if (observed.role && observed.role !== stored.semanticEvidence.role) {
      capability += 0.10;
    }
    capability = Math.min(1.0, capability);

    // 5. Transition Drift (pre-state compatibility)
    let transition = 0.0;
    if (observed.observedPreState && stored.mandatoryPreStatePredicates.length > 0) {
      const allPassed = stored.mandatoryPreStatePredicates.every((p) => {
        try {
          return p.evaluate(observed.observedPreState!);
        } catch {
          return false;
        }
      });
      if (!allPassed) {
        transition = 0.85;
      }
    }

    return {
      presentation: Number(presentation.toFixed(2)),
      context: Number(context.toFixed(2)),
      structure: Number(structure.toFixed(2)),
      capability: Number(capability.toFixed(2)),
      transition: Number(transition.toFixed(2)),
    };
  }
}

