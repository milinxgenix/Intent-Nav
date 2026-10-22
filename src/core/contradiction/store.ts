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
import { FingerprintConstructor } from '../fingerprint/constructor';

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
    candidateContext?: CandidateEvaluationContext,
    extra?: {
      failedCondition?: string;
      affectedCapabilityId?: string;
      affectedRouteId?: string;
      affectedCandidateId?: string;
      sequenceNumber?: number;
      activationEventId?: string;
      witnessIds?: string[];
      failureClassification?: string;
      quarantined?: boolean;
      canReconsider?: boolean;
      requiredMaterialEvidenceChange?: string;
    }
  ): NegativeEvidenceEntry {
    const id = `neg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const capId = partialFingerprint.capabilityId || extra?.affectedCapabilityId || 'GLOBAL';
    const rawEvidenceHash = candidateContext
      ? NegativeEvidenceStore.computeEvidenceHash(candidateContext)
      : `id_${candidateIdentifier}`;
    const interfaceEvidenceHash = `${capId}::${rawEvidenceHash}`;
    const idKey = `${capId}::${candidateIdentifier}`;

    const computedCandidateFpHash =
      partialFingerprint.fingerprintHash ||
      FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: partialFingerprint.canonicalFunction || `rejected_${candidateIdentifier}`,
        actionType: partialFingerprint.actionType || candidateContext?.observedActionType || 'VIEW',
        targetEntity: partialFingerprint.targetEntity || candidateContext?.observedTargetEntity || 'UNKNOWN',
        role: partialFingerprint.semanticEvidence?.role || candidateContext?.observedRole || 'element',
        riskClass: partialFingerprint.riskMetadata?.riskClass,
      });

    const defaultRequiredChange =
      extra?.requiredMaterialEvidenceChange ||
      'Material change in candidate role, target entity, or container semantics required before reconsideration.';

    const entry: NegativeEvidenceEntry = {
      id,
      candidateFingerprint: partialFingerprint,
      candidateIdentifier,
      candidateFingerprintHash: computedCandidateFpHash,
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

      // Step 6 structured negative evidence:
      failedCondition: extra?.failedCondition || failedInvariantId,
      affectedCapabilityId: capId,
      affectedRouteId: originatingRouteId || extra?.affectedRouteId,
      affectedCandidateId: candidateIdentifier,
      sequenceNumber: extra?.sequenceNumber,
      activationEventId: extra?.activationEventId,
      witnessIds: extra?.witnessIds,
      failureClassification: extra?.failureClassification || contradictionType,
      quarantined: extra?.quarantined ?? true,
      canReconsider: extra?.canReconsider ?? false,
      requiredMaterialEvidenceChange: defaultRequiredChange,
    };

    this.records.set(interfaceEvidenceHash, entry);
    this.idIndex.set(idKey, interfaceEvidenceHash);

    if (this.store) {
      const contradictionRecord: ContradictionEvidence = {
        evidenceId: id,
        capabilityId: capId,
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
   * Records structured negative evidence for a failed causal transition verification
   */
  public recordCausalFailure(params: {
    capabilityId: string;
    routeId: string;
    candidateIdentifier?: string;
    verificationStatus: string;
    failureReason?: string;
    explanation: string;
    activationEventId?: string;
    sequenceNumber?: number;
    witnessIds?: string[];
    observedWitnessClasses?: string[];
    observedPostStateFingerprint?: string;
    candidateContext?: CandidateEvaluationContext;
  }): NegativeEvidenceEntry {
    const candidateId = params.candidateIdentifier || `cand_${params.capabilityId}_${params.routeId}`;
    const requiredChange =
      params.verificationStatus === 'FAILED_POST_STATE_MISMATCH'
        ? 'Requires valid observed interface post-state progression differing from pre-state and satisfying expected delta.'
        : params.verificationStatus === 'FAILED_CONTRADICTORY_WITNESS'
        ? 'Requires eliminating conflicting DOM mutations or error/failure flags in observation channels.'
        : params.verificationStatus === 'FAILED_INSUFFICIENT_WITNESS_CLASSES'
        ? 'Requires independent observations across at least 2 distinct witness classes and origins.'
        : params.verificationStatus === 'FAILED_WINDOW_TIMEOUT'
        ? 'Requires state transition to occur within the bounded verification window.'
        : 'Requires material interface or state transition change.';

    return this.recordContradiction(
      candidateId,
      'CAUSAL_WITNESS_FAILURE',
      params.verificationStatus,
      params.explanation,
      {
        failureReason: params.failureReason,
        status: params.verificationStatus,
        activationEventId: params.activationEventId,
        sequenceNumber: params.sequenceNumber,
        witnessIds: params.witnessIds,
        observedWitnessClasses: params.observedWitnessClasses,
        postStateFingerprint: params.observedPostStateFingerprint,
      },
      { capabilityId: params.capabilityId },
      params.routeId,
      params.candidateContext,
      {
        failedCondition: params.verificationStatus,
        affectedCapabilityId: params.capabilityId,
        affectedRouteId: params.routeId,
        affectedCandidateId: candidateId,
        sequenceNumber: params.sequenceNumber,
        activationEventId: params.activationEventId,
        witnessIds: params.witnessIds,
        failureClassification: params.verificationStatus,
        quarantined: true,
        canReconsider: false,
        requiredMaterialEvidenceChange: requiredChange,
      }
    );
  }

  /**
   * Explains whether a candidate can be reconsidered upon material interface change,
   * returning an auditable decision object.
   */
  public canCandidateBeReconsidered(
    candidateIdentifier: string,
    candidateContext: CandidateEvaluationContext,
    capabilityId?: string
  ): { allowed: boolean; reason: string; requiredChange?: string } {
    const rawEvidenceHash = NegativeEvidenceStore.computeEvidenceHash(candidateContext);
    const cap = capabilityId || 'GLOBAL';
    const scopedHash = `${cap}::${rawEvidenceHash}`;

    if (this.records.has(scopedHash) || this.records.has(`GLOBAL::${rawEvidenceHash}`)) {
      const entry = this.records.get(scopedHash) || this.records.get(`GLOBAL::${rawEvidenceHash}`);
      return {
        allowed: false,
        reason: `Suppressed by identical material evidence (${scopedHash}). Candidate unchanged since prior failure.`,
        requiredChange: entry?.requiredMaterialEvidenceChange || 'Material change in candidate role, target entity, or container semantics required.',
      };
    }

    const idKey = `${cap}::${candidateIdentifier}`;
    const previousHash = this.idIndex.get(idKey) || this.idIndex.get(`GLOBAL::${candidateIdentifier}`);

    if (previousHash && !previousHash.endsWith(`id_${candidateIdentifier}`) && previousHash !== scopedHash) {
      return {
        allowed: true,
        reason: `Reconsideration permitted: Material interface change observed (previous evidence: ${previousHash}, current evidence: ${scopedHash}).`,
      };
    }

    if (this.idIndex.has(idKey) || this.idIndex.has(`GLOBAL::${candidateIdentifier}`)) {
      return {
        allowed: false,
        reason: `Candidate identifier '${candidateIdentifier}' remains under active failure quarantine without material evidence delta.`,
        requiredChange: 'Material DOM or interface evidence change required.',
      };
    }

    return {
      allowed: true,
      reason: 'No conflicting negative evidence recorded for this candidate.',
    };
  }

  /**
   * Initializes store by loading existing negative evidence from persistent capability store
   */
  public async init(): Promise<void> {
    if (this.store) {
      try {
        const stored = await this.store.getNegativeEvidence();
        for (const item of stored) {
          if (!this.records.has(item.interfaceEvidenceHash)) {
            const entry: NegativeEvidenceEntry = {
              id: item.evidenceId,
              candidateFingerprint: { capabilityId: item.capabilityId },
              candidateIdentifier: item.evidenceId,
              candidateFingerprintHash: item.candidateFingerprintHash,
              interfaceEvidenceHash: item.interfaceEvidenceHash,
              contradictionType: item.contradictionType,
              failedInvariantId: item.failedInvariant,
              reason: item.reason,
              timestamp: item.timestamp,
              originatingRouteId: item.routeVersion,
              interfaceVersion: '1.0.0',
              evidenceDetails: {},
              confidence: 0.95,
              previouslySelected: item.previouslySelected,
              suppressionWeight: item.suppressionWeight,
              failedCondition: item.failedInvariant,
              affectedCapabilityId: item.capabilityId,
              affectedRouteId: item.routeVersion,
              quarantined: true,
              canReconsider: false,
            };
            this.records.set(item.interfaceEvidenceHash, entry);
            const idKey = `${item.capabilityId}::${item.evidenceId}`;
            this.idIndex.set(idKey, item.interfaceEvidenceHash);
          }
        }
      } catch {}
    }
  }

  /**
   * Evaluates whether candidate is suppressed by known negative evidence.
   * Enforces:
   * - Same material evidence -> suppressed
   * - Material interface change -> candidate may be reconsidered
   */
  public isKnownContradiction(
    candidateIdentifier: string,
    candidateContext?: CandidateEvaluationContext,
    capabilityId?: string
  ): boolean {
    if (candidateContext) {
      const rawEvidenceHash = NegativeEvidenceStore.computeEvidenceHash(candidateContext);
      if (capabilityId) {
        const scopedHash = `${capabilityId}::${rawEvidenceHash}`;
        if (this.records.has(scopedHash) || this.records.has(`GLOBAL::${rawEvidenceHash}`)) {
          return true;
        }
        const idKey = `${capabilityId}::${candidateIdentifier}`;
        const previousHash = this.idIndex.get(idKey) || this.idIndex.get(`GLOBAL::${candidateIdentifier}`);
        if (previousHash && !previousHash.endsWith(`id_${candidateIdentifier}`) && previousHash !== scopedHash) {
          // Material interface change detected!
          return false;
        }
      } else {
        // When capabilityId is not specified, check across recorded capability scopes
        for (const [hash] of this.records) {
          if (hash.endsWith(`::${rawEvidenceHash}`) || hash === rawEvidenceHash) {
            return true;
          }
        }
        for (const [key, previousHash] of this.idIndex) {
          if (key === candidateIdentifier || key.endsWith(`::${candidateIdentifier}`)) {
            if (!previousHash.endsWith(`id_${candidateIdentifier}`) && !previousHash.endsWith(`::${rawEvidenceHash}`)) {
              // Material interface change detected!
              return false;
            }
          }
        }
      }
    }

    if (capabilityId) {
      return this.idIndex.has(`${capabilityId}::${candidateIdentifier}`) || this.idIndex.has(`GLOBAL::${candidateIdentifier}`) || this.idIndex.has(candidateIdentifier);
    }

    for (const key of this.idIndex.keys()) {
      if (key === candidateIdentifier || key.endsWith(`::${candidateIdentifier}`)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Retrieves negative evidence details
   */
  public getNegativeEvidence(candidateIdentifier: string, capabilityId?: string): NegativeEvidenceEntry | undefined {
    if (capabilityId) {
      const hash = this.idIndex.get(`${capabilityId}::${candidateIdentifier}`) || this.idIndex.get(`GLOBAL::${candidateIdentifier}`) || this.idIndex.get(candidateIdentifier);
      if (hash) return this.records.get(hash);
    }
    for (const [key, hash] of this.idIndex) {
      if (key === candidateIdentifier || key.endsWith(`::${candidateIdentifier}`)) {
        return this.records.get(hash);
      }
    }
    return undefined;
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
