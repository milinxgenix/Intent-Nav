/**
 * IntentNav-SCFR: Candidate Ranking Engine
 * Enforces: RebindScore is calculated ONLY for candidates that passed Invariant Closure!
 * High semantic similarity can NEVER override a failed mandatory invariant.
 */

import { FunctionalCapabilityFingerprint } from '../../types/capability';
import {
  CandidateRebindScore,
  ScoringWeights,
  ScoreBreakdown,
  DEFAULT_SCORING_WEIGHTS,
} from '../../types/ranking';
import { CandidateEvaluationContext } from '../invariant/engine';

export class CandidateRankingEngine {
  constructor(
    private weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
    private version: string = '1.0.0'
  ) {}

  /**
   * Helper: token-based Jaccard similarity for transparent local-first semantic matching
   */
  private computeSemanticSimilarity(target: string, candidate: string): number {
    const tokenize = (s: string) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);

    const tokensA = new Set(tokenize(target));
    const tokensB = new Set(tokenize(candidate));

    if (tokensA.size === 0 && tokensB.size === 0) return 1.0;
    if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

    const intersection = new Set([...tokensA].filter((x) => tokensB.has(x)));
    const union = new Set([...tokensA, ...tokensB]);

    return intersection.size / union.size;
  }

  /**
   * Ranks an array of ELIGIBLE candidates.
   * Notice: Non-eligible candidates should NEVER be passed here.
   */
  public rankCandidates(
    targetFingerprint: FunctionalCapabilityFingerprint,
    eligibleCandidates: CandidateEvaluationContext[]
  ): CandidateRebindScore[] {
    const scoredList: CandidateRebindScore[] = [];

    for (const candidate of eligibleCandidates) {
      // 1. Invariant Fit: 1.0 since it already passed hard invariant closure
      const invariantFit = 1.0;

      // 2. Semantic Fit: match between canonical target labels/synonyms and candidate text
      const targetLabel = targetFingerprint.semanticEvidence.canonicalLabel;
      const directSim = this.computeSemanticSimilarity(targetLabel, candidate.candidateLabel);

      let maxSynonymSim = directSim;
      for (const syn of targetFingerprint.semanticEvidence.semanticSynonyms) {
        const synSim = this.computeSemanticSimilarity(syn, candidate.candidateLabel);
        if (synSim > maxSynonymSim) maxSynonymSim = synSim;
      }
      const semanticFit = Math.min(1.0, maxSynonymSim);

      // 3. Context Fit: container and ancestor semantics overlap
      let contextFit = 0.75;
      if (candidate.containerSemantics && candidate.containerSemantics.length > 0) {
        let contextOverlapCount = 0;
        const targetContainers = targetFingerprint.contextEvidence.containerSemantics;
        for (const c of candidate.containerSemantics) {
          if (targetContainers.some((tc) => tc.toLowerCase() === c.toLowerCase())) {
            contextOverlapCount++;
          }
        }
        contextFit = targetContainers.length > 0
          ? Math.min(1.0, contextOverlapCount / targetContainers.length)
          : 0.8;
      }

      // 4. Transition Fit: default 0.9 for eligible interactive candidate
      const transitionFit = 0.9;

      // 5. Validation History: historical success score
      const validationHistory = 0.85;

      // Penalties
      const contradictionPenalty = 0.0; // 0 since candidate passed contradiction filter
      const stalenessPenalty = 0.0;
      const riskPenalty =
        targetFingerprint.riskMetadata.riskClass === 'DESTRUCTIVE'
          ? 0.30
          : targetFingerprint.riskMetadata.riskClass === 'SECURITY_SENSITIVE'
          ? 0.20
          : 0.0;
      const pathCostPenalty = 0.05;

      // Compute Weighted Total
      const totalScore =
        this.weights.wInvariantFit * invariantFit +
        this.weights.wSemanticFit * semanticFit +
        this.weights.wContextFit * contextFit +
        this.weights.wTransitionFit * transitionFit +
        this.weights.wValidationHistory * validationHistory -
        this.weights.wContradictionPenalty * contradictionPenalty -
        this.weights.wStalenessPenalty * stalenessPenalty -
        this.weights.wRiskPenalty * riskPenalty -
        this.weights.wPathCostPenalty * pathCostPenalty;

      const breakdown: ScoreBreakdown = {
        invariantFit,
        semanticFit,
        contextFit,
        transitionFit,
        validationHistory,
        contradictionPenalty,
        stalenessPenalty,
        riskPenalty,
        pathCostPenalty,
        totalScore: Number(totalScore.toFixed(3)),
      };

      scoredList.push({
        candidateId: candidate.candidateId,
        candidateLabel: candidate.candidateLabel,
        isEligible: true,
        scoreBreakdown: breakdown,
        rank: 0,
        weightsVersion: this.version,
      });
    }

    // Sort descending by totalScore
    scoredList.sort((a, b) => b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore);

    // Assign 1-indexed ranks
    scoredList.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return scoredList;
  }
}

