/**
 * IntentNav-SCFR: Drift Classifier & Action Decider
 * Evaluates typed drift vector against thresholds and generates structured explanations
 */

import {
  TypedDriftVector,
  DriftThresholds,
  DriftLocalizationResult,
  DriftActionRequired,
} from '../../types/drift';

export const DEFAULT_DRIFT_THRESHOLDS: DriftThresholds = {
  presentationRecoveryThreshold: 0.90,
  contextValidationThreshold: 0.40,
  structureValidationThreshold: 0.45,
  capabilityRebindThreshold: 0.20,
  transitionRebindThreshold: 0.25,
};

export class DriftClassifier {
  public static classify(
    vector: TypedDriftVector,
    thresholds: DriftThresholds = DEFAULT_DRIFT_THRESHOLDS
  ): DriftLocalizationResult {
    const triggerFactors: string[] = [];
    let actionRequired: DriftActionRequired = 'MAINTAIN_ACTIVE';

    // 1. Check capability drift first (highest priority)
    if (vector.capability >= 0.90 && vector.transition >= 0.90) {
      actionRequired = 'QUARANTINE_IMMEDIATELY';
      triggerFactors.push('Extreme concurrent capability and transition drift detected; immediate quarantine required');
    } else if (vector.capability >= thresholds.capabilityRebindThreshold) {
      actionRequired = 'TRIGGER_REBIND_RECOVERY';
      triggerFactors.push(
        `Capability drift (${vector.capability}) exceeds threshold (${thresholds.capabilityRebindThreshold})`
      );
    }

    // 2. Check transition drift (route validation required if capability is unchanged)
    if (vector.transition >= thresholds.transitionRebindThreshold) {
      if (actionRequired !== 'TRIGGER_REBIND_RECOVERY') {
        actionRequired = 'TRIGGER_VALIDATION';
      }
      triggerFactors.push(
        `Transition drift (${vector.transition}) exceeds threshold (${thresholds.transitionRebindThreshold})`
      );
    }

    // 3. Check structural & contextual drift (trigger validation if not already recovering)
    if (actionRequired !== 'TRIGGER_REBIND_RECOVERY') {
      if (vector.structure >= thresholds.structureValidationThreshold) {
        actionRequired = 'TRIGGER_VALIDATION';
        triggerFactors.push(
          `Structural drift (${vector.structure}) exceeds threshold (${thresholds.structureValidationThreshold})`
        );
      }
      if (vector.context >= thresholds.contextValidationThreshold) {
        actionRequired = 'TRIGGER_VALIDATION';
        triggerFactors.push(
          `Contextual drift (${vector.context}) exceeds threshold (${thresholds.contextValidationThreshold})`
        );
      }
    }

    // 4. Presentation-only check
    if (triggerFactors.length === 0) {
      if (vector.presentation > 0.0) {
        triggerFactors.push(`Presentation-only drift (${vector.presentation}) detected; functional identity preserved`);
      } else {
        triggerFactors.push('Zero drift detected across all dimensions');
      }
    }

    // Determine dominant dimension
    const dimensions: Array<keyof TypedDriftVector> = [
      'capability',
      'transition',
      'structure',
      'context',
      'presentation',
    ];
    let dominantDriftDimension: keyof TypedDriftVector = 'presentation';
    let maxVal = -1;
    for (const dim of dimensions) {
      if (vector[dim] > maxVal) {
        maxVal = vector[dim];
        dominantDriftDimension = dim;
      }
    }

    // Build explanatory text
    let explanation = '';
    switch (actionRequired) {
      case 'MAINTAIN_ACTIVE':
        explanation = `Route remains valid. Only presentation drift (${vector.presentation}) observed, leaving functional invariants intact.`;
        break;
      case 'TRIGGER_VALIDATION':
        explanation = `Re-assessment triggered due to structural/contextual shift (${dominantDriftDimension}: ${maxVal}). Route must be verified before execution.`;
        break;
      case 'TRIGGER_REBIND_RECOVERY':
        explanation = `Functional recovery triggered! Significant drift detected in ${dominantDriftDimension} (${maxVal}). Invariant closure and re-binding required.`;
        break;
      case 'QUARANTINE_IMMEDIATELY':
        explanation = 'Route immediately quarantined due to contradictory evidence.';
        break;
    }

    return {
      driftVector: vector,
      actionRequired,
      dominantDriftDimension,
      explanation,
      triggerFactors,
      assessedTimestamp: Date.now(),
    };
  }
}

