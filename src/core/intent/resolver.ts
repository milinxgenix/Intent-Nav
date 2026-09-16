/**
 * IntentNav-SCFR: Capability Intent Resolver
 * Flow: Intent -> Capability Identity -> Candidate Route (NEVER intent -> selector or URL)
 */

import { NormalizedIntent } from '../../types/intent';
import { FunctionalCapabilityFingerprint } from '../../types/capability';

export interface CapabilityMatchResult {
  capabilityId: string;
  matchScore: number;
  isActionMatched: boolean;
  isTargetMatched: boolean;
  matchedSynonyms: string[];
  reasons: string[];
}

export class CapabilityIntentResolver {
  /**
   * Resolves a NormalizedIntent against a catalog of FunctionalCapabilityFingerprints
   */
  public static resolve(
    intent: NormalizedIntent,
    capabilities: FunctionalCapabilityFingerprint[]
  ): CapabilityMatchResult[] {
    const results: CapabilityMatchResult[] = [];

    for (const cap of capabilities) {
      const isActionMatched = cap.actionType === intent.actionType;
      const isTargetMatched = cap.targetEntity === intent.targetEntity;

      const reasons: string[] = [];
      const matchedSynonyms: string[] = [];

      let score = 0;

      // 1. Target match has primary functional weight
      if (isTargetMatched) {
        score += 0.50;
        reasons.push(`Target entity matched: ${cap.targetEntity}`);
      }

      // 2. Action match has secondary functional weight
      if (isActionMatched) {
        score += 0.30;
        reasons.push(`Action type matched: ${cap.actionType}`);
      }

      // 3. Synonym / Semantic overlap
      const rawTokens = intent.rawGoal.toLowerCase().split(/\s+/);
      for (const syn of cap.semanticEvidence.semanticSynonyms) {
        const synTokens = syn.toLowerCase().split(/\s+/);
        const overlap = synTokens.filter((t) => rawTokens.includes(t));
        if (overlap.length > 0) {
          matchedSynonyms.push(syn);
          score += 0.05 * Math.min(overlap.length, 3);
        }
      }

      // 4. Accessible label token overlap
      const labelTokens = cap.semanticEvidence.accessibleName.toLowerCase().split(/\s+/);
      const labelOverlap = labelTokens.filter((t) => rawTokens.includes(t));
      if (labelOverlap.length > 0) {
        score += 0.05;
      }

      score = Math.min(1.0, score);

      results.push({
        capabilityId: cap.capabilityId,
        matchScore: score,
        isActionMatched,
        isTargetMatched,
        matchedSynonyms,
        reasons,
      });
    }

    // Sort by match score descending
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }
}

