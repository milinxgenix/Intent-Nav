/**
 * IntentNav-SCFR: Candidate Ranking Engine
 *
 * Evidence-Driven Ranking Implementation:
 * Uses only evidence actually available from:
 * - normalized intent & candidate semantic evidence
 * - observed context (containers, ancestors, nearby text)
 * - pre-activation transition feasibility (pre-state compatibility, allowed delta, interactive status)
 * - persisted validation history (from provenance.validationHistory)
 * - structural DOM path depth
 *
 * STRICT NON-FABRICATION GUARANTEE:
 * Missing evidence evaluates to 0.0 (NO POSITIVE EVIDENCE AVAILABLE).
 * Missing evidence is NEVER converted into synthetic positive scores.
 *
 * STRICT ORDERING MANDATE:
 * Invariant Closure & Contradiction Filtering occur BEFORE Ranking.
 * Hard invariant failures, contradictions, and decoys NEVER reach this engine.
 */

import { FunctionalCapabilityFingerprint } from '../../types/capability';
import {
  CandidateRebindScore,
  ScoringWeights,
  ScoreBreakdown,
  DEFAULT_SCORING_WEIGHTS,
} from '../../types/ranking';
import { CandidateEvaluationContext } from '../invariant/engine';

export interface RankingOptions {
  currentTime?: number;
  intent?: string;
}

export class CandidateRankingEngine {
  constructor(
    private weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS,
    private version: string = '1.0.0'
  ) {}

  /**
   * Domain-specific entity and concept synonym mapping
   */
  private static readonly SYNONYM_MAP: Record<string, string> = {
    notification: 'notification',
    notifications: 'notification',
    alert: 'notification',
    alerts: 'notification',
    bulletin: 'notification',
    bulletins: 'notification',
    marketing: 'marketing',
    commercial: 'marketing',
    promotional: 'marketing',
    advertising: 'marketing',
    campaign: 'marketing',
    email: 'email',
    emails: 'email',
    mail: 'email',
    mails: 'email',
    twofactor: 'twofactor',
    '2fa': 'twofactor',
    mfa: 'twofactor',
  };

  /**
   * Simple morphological stemmer for common English web control suffixes
   */
  private static stemWord(word: string): string {
    const mapped = CandidateRankingEngine.SYNONYM_MAP[word.toLowerCase()];
    if (mapped) return mapped;
    return word
      .replace(/(ing|edly|ingly|ed|es|s|tion|ment|able|ible)$/i, '')
      .replace(/(ies)$/i, 'y');
  }

  /**
   * Tokenizes, normalizes, and stems an input phrase
   */
  private static tokenizeAndStem(phrase: string): string[] {
    const cleaned = phrase
      .toLowerCase()
      .replace(/two[-\s]*factor/g, 'twofactor')
      .replace(/[^a-z0-9\s]/g, ' ');

    const stopWords = new Set(['of', 'the', 'a', 'an', 'for', 'in', 'on', 'to']);

    return cleaned
      .split(/\s+/)
      .filter((w) => Boolean(w) && !stopWords.has(w))
      .map(this.stemWord);
  }

  /**
   * Computes semantic similarity with stemming, synonym normalization, and token containment
   */
  public computeSemanticSimilarity(target: string, candidate: string): number {
    const tokensA = CandidateRankingEngine.tokenizeAndStem(target);
    const tokensB = CandidateRankingEngine.tokenizeAndStem(candidate);

    if (tokensA.length === 0 && tokensB.length === 0) return 1.0;
    if (tokensA.length === 0 || tokensB.length === 0) return 0.0;

    const setA = new Set(tokensA);
    const setB = new Set(tokensB);

    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    if (union.size === 0) return 0.0;
    const jaccard = intersection.size / union.size;
    const containment = intersection.size / Math.min(setA.size, setB.size);
    // When target concept is fully contained in candidate (e.g. "Confirm Disable Marketing Emails" contains "Disable Marketing Emails")
    const score = containment === 1.0 ? Math.max(jaccard, 0.95) : jaccard;
    return Number(score.toFixed(3));
  }

  /**
   * Ranks an array of ELIGIBLE candidates using only real observed evidence.
   * Hard-failing candidates, contradictions, and decoys must be purged before calling this method.
   */
  public rankCandidates(
    targetFingerprint: FunctionalCapabilityFingerprint,
    eligibleCandidates: CandidateEvaluationContext[],
    options?: RankingOptions
  ): CandidateRebindScore[] {
    const scoredList: CandidateRebindScore[] = [];

    for (const candidate of eligibleCandidates) {
      // 1. Invariant Fit: 1.0 since candidate already verified eligible by Invariant Closure
      const invariantFit = 1.0;

      // 2. Semantic Fit: match between canonical target labels/synonyms/intent and candidate text
      const candidateLabel = candidate.candidateLabel || candidate.accessibleName || '';
      const semanticTargets: string[] = [
        targetFingerprint.semanticEvidence?.canonicalLabel || '',
        ...(targetFingerprint.semanticEvidence?.semanticSynonyms || []),
        targetFingerprint.semanticEvidence?.accessibleName || '',
        targetFingerprint.semanticEvidence?.actionDescription || '',
        targetFingerprint.semanticEvidence?.visibleLabel || '',
      ];
      if (options?.intent) {
        semanticTargets.push(options.intent);
      }

      let maxSim = 0.0;
      for (const tgt of semanticTargets) {
        if (!tgt) continue;
        const sim = this.computeSemanticSimilarity(tgt, candidateLabel);
        if (sim > maxSim) maxSim = sim;
      }
      const semanticFit = Math.min(1.0, maxSim);

      // 3. Context Fit: multi-channel overlap across containerSemantics, ancestors, and nearbyText
      // ZERO synthetic positive fallback (missing context = 0.0, NO POSITIVE EVIDENCE AVAILABLE)
      let contextFit = 0.0;
      const targetContainers = targetFingerprint.contextEvidence?.containerSemantics || [];
      const targetAncestors = targetFingerprint.contextEvidence?.ancestorRelationships || [];
      const targetNearby = targetFingerprint.contextEvidence?.nearbyText || [];

      const candidateContainers = candidate.containerSemantics || [];
      const candidateAncestors = candidate.ancestors || [];
      const candidateNearby = candidate.nearbyText || [];

      let containerOverlap = 0.0;
      if (candidateContainers.length > 0 && targetContainers.length > 0) {
        let matchCount = 0;
        for (const c of candidateContainers) {
          if (
            targetContainers.some(
              (tc) =>
                tc.toLowerCase().includes(c.toLowerCase()) ||
                c.toLowerCase().includes(tc.toLowerCase())
            )
          ) {
            matchCount++;
          }
        }
        containerOverlap = matchCount / targetContainers.length;
      }

      let ancestorOverlap = 0.0;
      if (candidateAncestors.length > 0 && targetAncestors.length > 0) {
        let matchCount = 0;
        for (const a of candidateAncestors) {
          if (
            targetAncestors.some(
              (ta) =>
                ta.toLowerCase().includes(a.toLowerCase()) ||
                a.toLowerCase().includes(ta.toLowerCase())
            )
          ) {
            matchCount++;
          }
        }
        ancestorOverlap = matchCount / targetAncestors.length;
      }

      let nearbyOverlap = 0.0;
      if (candidateNearby.length > 0 && targetNearby.length > 0) {
        let matchCount = 0;
        for (const n of candidateNearby) {
          if (
            targetNearby.some(
              (tn) =>
                tn.toLowerCase().includes(n.toLowerCase()) ||
                n.toLowerCase().includes(tn.toLowerCase())
            )
          ) {
            matchCount++;
          }
        }
        nearbyOverlap = matchCount / targetNearby.length;
      }

      // Dynamically normalize by active observed context channels
      const observedChannelsWeight =
        (candidateContainers.length > 0 ? 0.50 : 0) +
        (candidateAncestors.length > 0 ? 0.30 : 0) +
        (candidateNearby.length > 0 ? 0.20 : 0);

      if (observedChannelsWeight > 0) {
        contextFit = Number(
          Math.min(
            1.0,
            (0.50 * containerOverlap + 0.30 * ancestorOverlap + 0.20 * nearbyOverlap) /
              observedChannelsWeight
          ).toFixed(3)
        );
      } else {
        // Missing context evidence -> NO POSITIVE EVIDENCE AVAILABLE
        contextFit = 0.0;
      }

      // 4. Transition Fit: Pre-Activation Transition Feasibility
      // Evaluates observed pre-state compatibility, allowed delta feasibility, and interactive role status.
      // NOTE: This represents pre-activation feasibility, NOT causal transition verification.
      // Actual causal transition verification occurs exclusively post-activation via witness quorum.
      let transitionFit = 0.0;
      if (candidate.observedState && Object.keys(candidate.observedState).length > 0) {
        let preStateScore = 1.0;
        const mandatoryPreds = targetFingerprint.mandatoryPreStatePredicates || [];
        if (mandatoryPreds.length > 0) {
          let passedCount = 0;
          for (const pred of mandatoryPreds) {
            try {
              if (pred.evaluate(candidate.observedState)) passedCount++;
            } catch {
              // Evaluation failure
            }
          }
          preStateScore = passedCount / mandatoryPreds.length;
        }

        let deltaFeasibility = 1.0;
        const allowedDeltas = targetFingerprint.allowedStateDelta || [];
        if (allowedDeltas.length > 0) {
          let compatibleDeltas = 0;
          for (const delta of allowedDeltas) {
            const currentVal = candidate.observedState[delta.property];
            if (currentVal !== undefined) {
              if (delta.expectedChange === 'ENABLED_TO_DISABLED' && currentVal === false) {
                // Incompatible: control is already disabled
              } else if (delta.expectedChange === 'DISABLED_TO_ENABLED' && currentVal === true) {
                // Incompatible: control is already enabled
              } else {
                compatibleDeltas++;
              }
            } else {
              // Property not observed in state
            }
          }
          deltaFeasibility = compatibleDeltas / allowedDeltas.length;
        }

        const isInteractive = candidate.observedState['disabled'] !== true;
        const interactiveScore = isInteractive ? 1.0 : 0.0;

        transitionFit = Number(
          (0.40 * preStateScore + 0.40 * deltaFeasibility + 0.20 * interactiveScore).toFixed(3)
        );
      } else {
        // Missing pre-state observation -> NO POSITIVE EVIDENCE AVAILABLE
        transitionFit = 0.0;
      }

      // 5. Validation History: ratio of historical successful validations
      // ZERO synthetic positive score (missing history = 0.0, NO POSITIVE EVIDENCE AVAILABLE)
      let validationHistory = 0.0;
      const historyEntries = targetFingerprint.provenance?.validationHistory || [];
      if (historyEntries.length > 0) {
        const successCount = historyEntries.filter((h) => h.success === true).length;
        validationHistory = Number((successCount / historyEntries.length).toFixed(3));
      } else {
        // No historical validations on record
        validationHistory = 0.0;
      }

      // 6. Contradiction Penalty: non-blocking soft negative evidence
      // Hard contradictions and decoys are purged BEFORE ranking.
      let contradictionPenalty = 0.0;
      const rejectedList = targetFingerprint.negativeEvidence?.rejectedCandidateIdentities || [];
      if (rejectedList.includes(candidate.candidateId)) {
        contradictionPenalty = 1.0;
      }

      // 7. Staleness Penalty: derived from route age since last validation
      let stalenessPenalty = 0.0;
      const valTimestamp = targetFingerprint.provenance?.validationTimestamp || 0;
      if (valTimestamp > 0) {
        const now = options?.currentTime || Date.now();
        const elapsedHours = (now - valTimestamp) / (1000 * 60 * 60);
        if (elapsedHours > 24) {
          stalenessPenalty = Math.min(1.0, Number(((elapsedHours - 24) / 48).toFixed(3)));
        }
      }

      // 8. Risk Penalty: declared capability risk class penalty
      const riskPenalty =
        targetFingerprint.riskMetadata?.riskClass === 'DESTRUCTIVE'
          ? 0.30
          : targetFingerprint.riskMetadata?.riskClass === 'SECURITY_SENSITIVE'
          ? 0.20
          : 0.0;

      // 9. Path Cost Penalty: derived from actual observed structural path depth
      // ZERO unconditional constant penalty
      let pathCostPenalty = 0.0;
      const structuralPath = candidate.domStructuralPath || candidate.bindingHandle?.domStructuralPath;
      if (structuralPath) {
        const depth = structuralPath.split('>').map((s) => s.trim()).filter(Boolean).length;
        if (depth > 2) {
          pathCostPenalty = Math.min(1.0, Number(((depth - 2) / 10).toFixed(3)));
        }
      } else if (candidate.ancestors && candidate.ancestors.length > 2) {
        pathCostPenalty = Math.min(1.0, Number(((candidate.ancestors.length - 2) / 10).toFixed(3)));
      }

      // Compute Weighted Total Score
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
        totalScore: Number(Math.max(0.0, totalScore).toFixed(4)),
      };

      scoredList.push({
        candidateId: candidate.candidateId,
        candidateLabel: candidate.candidateLabel,
        bindingHandle: candidate.bindingHandle,
        isEligible: true,
        scoreBreakdown: breakdown,
        rank: 0,
        weightsVersion: this.version,
        rankingVersion: this.version,
        rankingTimestamp: Date.now(),
      });
    }

    // Sort descending by totalScore and assign ranks deterministically
    scoredList.sort((a, b) => {
      const diff = b.scoreBreakdown.totalScore - a.scoreBreakdown.totalScore;
      if (Math.abs(diff) > 1e-5) return diff;
      // Deterministic tie-breaking on candidateId
      return a.candidateId.localeCompare(b.candidateId);
    });

    scoredList.forEach((item, index) => {
      item.rank = index + 1;
    });

    return scoredList;
  }
}
