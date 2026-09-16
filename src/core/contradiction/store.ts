/**
 * IntentNav-SCFR: Persistent Contradiction and Negative Evidence Store
 *
 * Phase 11 implementation:
 * - Stores fine-grained material evidence hashes rather than relying on DOM IDs
 * - Same material evidence -> suppresses candidate
 * - Material interface change -> candidate may be reconsidered
 * - Integrates with PersistentCapabilityStore
 */

import { ContradictionType, NegativeEvidenceEntry, ContradictionEvidence } from '../../types/negativeEvidence';
import { FunctionalCapabilityFingerprint } from '../../types/capability';
import { CandidateEvaluationContext } from '../invariant/engine';
import { PersistentCapabilityStore } from '../storage/persistentStore';

export class NegativeEvidenceStore {
  private records: Map<string, NegativeEvidenceEntry> = new Map(); // key = interfaceEvidenceHash or candidateFingerprintHash
  private idIndex: Map<string, string> = new Map(); // candidateIdentifier -> interfaceEvidenceHash

  constructor(private store?: PersistentCapabilityStore) {}

  /**
   * Computes a deterministic material evidence hash from observable candidate features.
   */
  public static computeEvidenceHash(candidate: {
    candidateLabel: string;
    observedRole: string;
    observedActionType: string;
    observedTargetEntity: string;
    containerSemantics?: string[];
  }): string {
    const containers = (candidate.containerSemantics || []).sort().join(';');
    const raw = `${candidate.candidateLabel.toLowerCase().trim()}|${candidate.observedRole}|${candidate.observedActionType}|${candidate.observedTargetEntity}|${containers}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `evh_${Math.abs(hash).toString(16)}`;
  }

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
    originatingRouteId?: string,
    candidateContext?: CandidateEvaluationContext
  ): NegativeEvidenceEntry {
    const id = `neg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const interfaceEvidenceHash = candidateContext
      ? NegativeEvidenceStore.computeEvidenceHash(candidateContext)
      : `evh_${candidateIdentifier}`;

    const entry: NegativeEvidenceEntry = {
      id,
      candidateFingerprint: partialFingerprint,
      candidateIdentifier,
      candidateFingerprintHash: partialFingerprint.fingerprintHash || `fph_${candidateIdentifier}`,
      interfaceEvidenceHash,
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

    this.records.set(interfaceEvidenceHash, entry);
    this.idIndex.set(candidateIdentifier, interfaceEvidenceHash);

    if (this.store) {
      const contradictionRecord: ContradictionEvidence = {
        evidenceId: id,
        capabilityId: partialFingerprint.capabilityId || 'UNKNOWN_CAP',
        candidateFingerprintHash: entry.candidateFingerprintHash!,
        interfaceEvidenceHash,
        failedInvariant: failedInvariantId,
        contradictionType,
        reason,
        timestamp: entry.timestamp,
        routeVersion: originatingRouteId || 'v1.0.0',
        interfaceState: 'CURRENT',
        previouslySelected: false,
        suppressionWeight: 1.0,
      };
      this.store.saveNegativeEvidence(contradictionRecord).catch(() => {});
    }

    return entry;
  }

  /**
   * Evaluates whether candidate is suppressed by known negative evidence.
   * Enforces:
   * - Same material evidence -> suppressed
   * - Material interface change -> candidate may be reconsidered
   */
  public isKnownContradiction(
    candidateIdentifier: string,
    candidateContext?: CandidateEvaluationContext
  ): boolean {
    if (candidateContext) {
      const currentHash = NegativeEvidenceStore.computeEvidenceHash(candidateContext);
      if (this.records.has(currentHash)) {
        return true; // Exact material evidence match -> suppress
      }
      // If candidateIdentifier was known but material evidence has changed, allow reconsideration!
      const previousHash = this.idIndex.get(candidateIdentifier);
      if (previousHash && previousHash !== currentHash) {
        // Material interface change detected!
        return false;
      }
    }

    return this.idIndex.has(candidateIdentifier);
  }

  /**
   * Retrieves negative evidence details
   */
  public getNegativeEvidence(candidateIdentifier: string): NegativeEvidenceEntry | undefined {
    const hash = this.idIndex.get(candidateIdentifier);
    return hash ? this.records.get(hash) : undefined;
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
    this.idIndex.clear();
  }
}
