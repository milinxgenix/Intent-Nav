/**
 * Baseline 2: Keyword String Matching
 * Performs naive substring/keyword search against visible labels.
 * Fails on paraphrase synonyms and is tricked by keyword stuffing in decoys.
 */

import { BaselineCandidate } from './baseline1_selector';

export class Baseline2KeywordMatching {
  public execute(query: string, candidates: BaselineCandidate[]): { success: boolean; selectedCandidateId?: string } {
    const queryTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
    let bestMatch: BaselineCandidate | null = null;
    let maxOverlap = 0;

    for (const c of candidates) {
      if (!c.label) continue;
      const labelLower = c.label.toLowerCase();
      let overlap = 0;
      for (const t of queryTokens) {
        if (labelLower.includes(t)) overlap++;
      }

      if (overlap > maxOverlap) {
        maxOverlap = overlap;
        bestMatch = c;
      }
    }

    if (bestMatch && maxOverlap > 0) {
      return { success: true, selectedCandidateId: bestMatch.id || bestMatch.label };
    }
    return { success: false };
  }
}
