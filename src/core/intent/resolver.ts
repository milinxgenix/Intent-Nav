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
    // Blanket adversarial targets must immediately abstain with zero matches
    if (['ALL_NOTIFICATIONS', 'ALL_SECURITY', 'ALL_DATA', 'ORGANIZATION_USERS'].includes(intent.targetEntity)) {
      return [];
    }

    const results: CapabilityMatchResult[] = [];

    for (const cap of capabilities) {
      const isActionMatched =
        cap.actionType === intent.actionType ||
        (cap.actionType === 'TOGGLE' && (intent.actionType === 'MODIFY_PREFERENCE' || intent.actionType === 'REVOKE_ACCESS')) ||
        (cap.actionType === 'REVOKE_ACCESS' && (intent.actionType === 'TOGGLE' || intent.actionType === 'MODIFY_PREFERENCE'));
      const isTargetMatched = cap.targetEntity === intent.targetEntity;

      const reasons: string[] = [];
      const matchedSynonyms: string[] = [];

      let score = 0;

      // 1. Target match has primary functional weight
      if (isTargetMatched) {
        score += 0.50;
        reasons.push(`Target entity matched: ${cap.targetEntity}`);
      } else if (intent.targetEntity !== 'UNKNOWN') {
        // Explicit target mismatch penalty - prevents targeting security settings when looking for notifications
        score -= 0.35;
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

