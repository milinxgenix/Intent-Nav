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

  public execute(query: string, candidates: BaselineCandidate[]): {
    success: boolean;
    selectedCandidateId?: string;
    similarityScore: number;
    topCandidateIds?: string[];
  } {
    const scored: Array<{ id: string; sim: number }> = [];

    for (const c of candidates) {
      const label = c.label || (c as any).candidateLabel;
      if (!label) continue;
      const sim = this.computeSimilarity(query, label);
      if (sim > 0.15) {
        scored.push({ id: c.id || (c as any).candidateId || label, sim });
      }
    }

    scored.sort((a, b) => b.sim - a.sim);

    const first = scored[0];
    if (first) {
      return {
        success: true,
        selectedCandidateId: first.id,
        similarityScore: first.sim,
        topCandidateIds: scored.slice(0, 3).map((s) => s.id),
      };
    }
    return { success: false, similarityScore: 0, topCandidateIds: [] };
  }
}

