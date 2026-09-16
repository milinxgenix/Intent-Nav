/**
 * IntentNav-SCFR: Candidate Evaluation Pipeline
 * ARCHITECTURAL CONSTRAINT:
 * Observe -> Drift -> Candidates -> Invariant Closure -> Contradiction Filter -> Ranking
 * Rejected candidates are strictly purged before the ranking engine receives candidates.
 */

import { FunctionalCapabilityFingerprint } from '../../types/capability';
import { InvariantClosureResult } from '../../types/invariant';
import { CandidateRebindScore } from '../../types/ranking';
import { InvariantClosureEngine, CandidateEvaluationContext } from '../invariant/engine';
import { NegativeEvidenceStore } from '../contradiction/store';
import { CandidateRankingEngine } from '../ranking/engine';

export interface CandidatePipelineResult {
  allCandidates: CandidateEvaluationContext[];
  invariantResults: Record<string, InvariantClosureResult>;
  eligibleCandidates: CandidateEvaluationContext[];
  rejectedCandidates: Array<{
    candidate: CandidateEvaluationContext;
    result: InvariantClosureResult;
    rejectionReason: string;
  }>;
  rankedScores: CandidateRebindScore[];
  selectedWinner: CandidateRebindScore | null;
}

export class CandidatePipeline {
  constructor(
    private negativeEvidenceStore: NegativeEvidenceStore,
    private rankingEngine: CandidateRankingEngine
  ) {}

  /**
   * Processes raw observed candidates through the strict invariant-first pipeline
   */
  public processCandidates(
    targetFingerprint: FunctionalCapabilityFingerprint,
    candidates: CandidateEvaluationContext[]
  ): CandidatePipelineResult {
    const invariantResults: Record<string, InvariantClosureResult> = {};
    const eligibleCandidates: CandidateEvaluationContext[] = [];
    const rejectedCandidates: Array<{
      candidate: CandidateEvaluationContext;
      result: InvariantClosureResult;
      rejectionReason: string;
    }> = [];

    // STEP 1: Hard Invariant Closure & Contradiction Filtering for each candidate
    for (const candidate of candidates) {
      // Check negative evidence store first
      if (this.negativeEvidenceStore.isKnownContradiction(candidate.candidateId)) {
        const neg = this.negativeEvidenceStore.getNegativeEvidence(candidate.candidateId)!;
        const fakeResult: InvariantClosureResult = {
          candidateId: candidate.candidateId,
          status: 'CONTRADICTED',
          isEligibleForRanking: false,
          passedPredicates: [],
          failedPredicates: [
            {
              predicateId: 'STORED_NEGATIVE_EVIDENCE',
              predicateName: 'Known Contradiction',
              isNegativePredicate: true,
              passed: false,
              explanation: `Pre-existing negative evidence: ${neg.reason}`,
            },
          ],
          rejectionReason: `Pre-existing negative evidence: ${neg.reason}`,
          evaluatedTimestamp: Date.now(),
        };
        invariantResults[candidate.candidateId] = fakeResult;
        rejectedCandidates.push({
          candidate,
          result: fakeResult,
          rejectionReason: fakeResult.rejectionReason!,
        });
        continue;
      }

      // Evaluate Invariant Closure
      const closureResult = InvariantClosureEngine.evaluateCandidate(
        targetFingerprint,
        candidate
      );
      invariantResults[candidate.candidateId] = closureResult;

      if (closureResult.isEligibleForRanking && closureResult.status === 'PASS') {
        eligibleCandidates.push(candidate);
      } else {
        // Record contradiction if status is CONTRADICTED
        if (closureResult.status === 'CONTRADICTED') {
          this.negativeEvidenceStore.recordContradiction(
            candidate.candidateId,
            'KNOWN_DECOY_PATTERN',
            'HARD_GATE_FAILURE',
            closureResult.rejectionReason || 'Hard gate contradiction'
          );
        }

        rejectedCandidates.push({
          candidate,
          result: closureResult,
          rejectionReason: closureResult.rejectionReason || 'Failed mandatory invariant',
        });
      }
    }

    // STEP 2: ONLY ELIGIBLE CANDIDATES ARE PASSED TO RANKING ENGINE
    // Non-eligible candidates are NEVER passed to ranking!
    const rankedScores = this.rankingEngine.rankCandidates(
      targetFingerprint,
      eligibleCandidates
    );

    const selectedWinner = rankedScores.length > 0 && rankedScores[0] ? rankedScores[0] : null;

    return {
      allCandidates: candidates,
      invariantResults,
      eligibleCandidates,
      rejectedCandidates,
      rankedScores,
      selectedWinner,
    };
  }
}

