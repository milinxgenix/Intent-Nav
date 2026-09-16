/**
 * IntentNav-SCFR: Evidence Quorum Evaluator
 * Verifies multi-source evidence quorum required for high-risk executions
 */

import { EvidenceQuorum } from '../../types/authorization';
import { FunctionalCapabilityFingerprint } from '../../types/capability';
import { InvariantClosureResult } from '../../types/invariant';
import { CausalVerificationResult } from '../../types/transition';

export class EvidenceQuorumEvaluator {
  /**
   * Evaluates if the evidence quorum is satisfied
   */
  public static evaluateQuorum(
    fingerprint: FunctionalCapabilityFingerprint,
    invariantResult: InvariantClosureResult | null,
    transitionResult: CausalVerificationResult | null
  ): EvidenceQuorum {
    // 1. Semantic Evidence: Valid canonical label and accessible name
    const hasSemanticEvidence =
      fingerprint.semanticEvidence.canonicalLabel.length > 0 &&
      fingerprint.semanticEvidence.accessibleName.length > 0;

    // 2. Functional Invariant Evidence: Invariant closure must have evaluated to PASS
    const hasFunctionalInvariantEvidence =
      invariantResult !== null &&
      invariantResult.status === 'PASS';

    // 3. Transition / State Evidence: Transition verifier succeeded with causal witnesses OR pre-state transition contract exists
    const hasTransitionStateEvidence =
      transitionResult !== null
        ? transitionResult.causallyVerified && transitionResult.verifiedWitnessClasses.length >= 1
        : Boolean(
            fingerprint.transitionEvidence &&
            (fingerprint.transitionEvidence.preStateFingerprint ||
             (fingerprint.transitionEvidence.witnessClasses && fingerprint.transitionEvidence.witnessClasses.length > 0))
          );

    const quorumSatisfied =
      hasSemanticEvidence &&
      hasFunctionalInvariantEvidence &&
      hasTransitionStateEvidence;

    return {
      hasSemanticEvidence,
      hasFunctionalInvariantEvidence,
      hasTransitionStateEvidence,
      quorumSatisfied,
    };
  }
}

