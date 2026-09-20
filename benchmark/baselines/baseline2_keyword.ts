/**
 * Baseline 2: Keyword String Matching
 * Performs naive substring/keyword search against visible labels.
 * Fails on paraphrase synonyms and is tricked by keyword stuffing in decoys.
 */

import { BaselineCandidate } from './baseline1_selector';

export class Baseline2KeywordMatching {
  public execute(query: string, candidates: BaselineCandidate[]): {
    success: boolean;
    selectedCandidateId?: string;
    topCandidateIds?: string[];
  } {
    const queryTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
    const scored: Array<{ id: string; overlap: number }> = [];

    for (const c of candidates) {
      const label = c.label || (c as any).candidateLabel;
      if (!label) continue;
      const labelLower = label.toLowerCase();
      let overlap = 0;
      for (const t of queryTokens) {
        if (labelLower.includes(t)) overlap++;
      }

      if (overlap > 0) {
        scored.push({ id: c.id || (c as any).candidateId || label, overlap });
      }
    }

    scored.sort((a, b) => b.overlap - a.overlap);

    const first = scored[0];
    if (first) {
      return {
        success: true,
        selectedCandidateId: first.id,
        topCandidateIds: scored.slice(0, 3).map((s) => s.id),
      };
    }
    return { success: false, topCandidateIds: [] };
  }
}

