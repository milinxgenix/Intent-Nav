/**
 * Baseline 3: Semantic-Only Matching
 * Ranks candidates purely on semantic embedding / token overlap similarity.
 * Lacks Invariant Closure and Hard Gates: regularly falls for high-overlap adversarial decoys.
 */

import { BaselineCandidate } from './baseline1_selector';

export class Baseline3SemanticOnly {
  private computeSimilarity(textA: string, textB: string): number {
    const tokenize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
    const setA = new Set(tokenize(textA));
    const setB = new Set(tokenize(textB));
    if (setA.size === 0 || setB.size === 0) return 0;
    const inter = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return inter.size / union.size;
  }

  public execute(query: string, candidates: BaselineCandidate[]): { success: boolean; selectedCandidateId?: string; similarityScore: number } {
    let bestCandidate: BaselineCandidate | null = null;
    let highestSim = -1;

    for (const c of candidates) {
      const text = c.candidateLabel || c.label;
      if (!text) continue;
      const sim = this.computeSimilarity(query, text);
      if (sim > highestSim) {
        highestSim = sim;
        bestCandidate = c;
      }
    }

    if (bestCandidate && highestSim > 0.15) {
      return { success: true, selectedCandidateId: bestCandidate.id || bestCandidate.candidateLabel || bestCandidate.label, similarityScore: highestSim };
    }
    return { success: false, similarityScore: 0 };
  }
}
