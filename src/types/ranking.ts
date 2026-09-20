/**
 * IntentNav-SCFR: Re-Binding and Candidate Ranking Types
 * Crucial Rule: Candidate is NEVER scored if Invariant Closure or Contradiction Filter failed!
 */

export interface ScoringWeights {
  wInvariantFit: number;       // w1
  wSemanticFit: number;        // w2
  wContextFit: number;         // w3
  wTransitionFit: number;      // w4
  wValidationHistory: number;  // w5
  wContradictionPenalty: number; // w6
  wStalenessPenalty: number;   // w7
  wRiskPenalty: number;        // w8
  wPathCostPenalty: number;    // w9
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  wInvariantFit: 0.30,
  wSemanticFit: 0.25,
  wContextFit: 0.15,
  wTransitionFit: 0.15,
  wValidationHistory: 0.10,
  wContradictionPenalty: 0.25,
  wStalenessPenalty: 0.05,
  wRiskPenalty: 0.10,
  wPathCostPenalty: 0.05,
};

export interface ScoreBreakdown {
  invariantFit: number;
  semanticFit: number;
  contextFit: number;
  transitionFit: number;
  validationHistory: number;
  contradictionPenalty: number;
  stalenessPenalty: number;
  riskPenalty: number;
  pathCostPenalty: number;
  totalScore: number;
}

import { BindingHandle } from './capability';

export interface CandidateRebindScore {
  candidateId: string;
  candidateLabel: string;
  bindingHandle?: BindingHandle;
  isEligible: boolean;
  scoreBreakdown: ScoreBreakdown;
  rank: number;
  weightsVersion: string;
  rankingVersion?: string;
  rankingTimestamp?: number;
}

