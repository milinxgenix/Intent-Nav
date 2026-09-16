/**
 * IntentNav-SCFR: Persistent Contradiction and Negative Evidence Store
 * Retains failed candidates and decoys to prevent recurring false bindings
 */

import { NegativeEvidenceEntry, ContradictionType } from '../../types/negativeEvidence';
import { FunctionalCapabilityFingerprint } from '../../types/capability';

export class NegativeEvidenceStore {
  private records: Map<string, NegativeEvidenceEntry> = new Map();

  /**
   * Records negative evidence for a rejected candidate
   */
  public recordContradiction(
    candidateIdentifier: string,
    contradictionType: ContradictionType,
    failedInvariantId: string,
    reason: string,
    evidenceDetails: Record<string, unknown> = {},
    partialFingerprint: Partial<FunctionalCapabilityFingerprint> = {},
    originatingRouteId?: string
  ): NegativeEvidenceEntry {
    const id = `neg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const entry: NegativeEvidenceEntry = {
      id,
      candidateFingerprint: partialFingerprint,
      candidateIdentifier,
      contradictionType,
      failedInvariantId,
      reason,
      timestamp: Date.now(),
      originatingRouteId,
      interfaceVersion: '1.0.0',
      evidenceDetails,
      confidence: 0.95,
      previouslySelected: false,
      suppressionWeight: 1.0, // Full suppression
    };

    this.records.set(candidateIdentifier, entry);
    return entry;
  }

  /**
   * Checks if a candidate is recognized as a known contradiction/decoy
   */
  public isKnownContradiction(candidateIdentifier: string): boolean {
    return this.records.has(candidateIdentifier);
  }

  /**
   * Retrieves negative evidence details
   */
  public getNegativeEvidence(candidateIdentifier: string): NegativeEvidenceEntry | undefined {
    return this.records.get(candidateIdentifier);
  }

  /**
   * Returns all stored negative evidence records
   */
  public getAllRecords(): NegativeEvidenceEntry[] {
    return Array.from(this.records.values());
  }

  /**
   * Clears the store (for testing)
   */
  public clear(): void {
    this.records.clear();
  }
}

