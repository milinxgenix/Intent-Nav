/**
 * IntentNav-SCFR: Functional Capability Fingerprint Constructor
 * Constructs strongly typed FunctionalCapabilityFingerprint using VolatileFeatureSuppressor
 * Generates stable functional fingerprint hashes independent of volatile DOM presentation.
 */

import {
  FunctionalCapabilityFingerprint,
  ActionType,
  TargetEntity,
  RiskClass,
  InvariantPredicate,
  StateDeltaPredicate,
  ExpectedStatePredicate,
  ContextPredicate,
} from '../../types/capability';
import { VolatileFeatureSuppressor } from './suppressor';

export interface FingerprintConstructionOptions {
  capabilityId: string;
  canonicalFunction: string;
  actionType: ActionType;
  targetEntity: TargetEntity;
  riskClass?: RiskClass;
  canonicalLabel?: string;
  semanticSynonyms?: string[];
  mandatoryPreStatePredicates?: InvariantPredicate[];
  allowedStateDelta?: StateDeltaPredicate[];
  expectedPostState?: ExpectedStatePredicate[];
  requiredContextPredicates?: ContextPredicate[];
  forbiddenContextPredicates?: ContextPredicate[];
  urlSemantics?: string;
}

export interface FunctionalFingerprintInput {
  canonicalFunction: string;
  actionType: string;
  targetEntity: string;
  role: string;
  riskClass?: string;
  canonicalLabel?: string; // Explicitly ignored for persistent functional identity hash
  mandatoryPreStatePredicates?: Array<{ id?: string; name?: string }>;
  allowedStateDelta?: Array<{ property: string; expectedChange?: string }>;
  expectedPostState?: Array<{ property: string; expectedValue?: unknown }>;
  requiredContextPredicates?: Array<{ target?: string; pattern?: string }>;
  forbiddenContextPredicates?: Array<{ target?: string; pattern?: string }>;
}

export class FingerprintConstructor {
  /**
   * Generates a deterministic hash from functional evidence only.
   * Volatile presentation features (labels, IDs, classes, coordinates) are strictly excluded.
   */
  public static computeFingerprintHash(fingerprint: FunctionalFingerprintInput): string {
    const parts: string[] = [
      fingerprint.canonicalFunction.trim().toLowerCase(),
      fingerprint.actionType.trim().toUpperCase(),
      fingerprint.targetEntity.trim().toUpperCase(),
      fingerprint.role.trim().toLowerCase(),
    ];

    if (fingerprint.riskClass) {
      parts.push(`risk:${fingerprint.riskClass.trim().toUpperCase()}`);
    }

    if (fingerprint.mandatoryPreStatePredicates && fingerprint.mandatoryPreStatePredicates.length > 0) {
      const preds = fingerprint.mandatoryPreStatePredicates
        .map((p) => (p.id || p.name || '').trim())
        .filter(Boolean)
        .sort();
      if (preds.length > 0) {
        parts.push(`pre:${preds.join(',')}`);
      }
    }

    if (fingerprint.allowedStateDelta && fingerprint.allowedStateDelta.length > 0) {
      const deltas = fingerprint.allowedStateDelta
        .map((d) => `${d.property}:${d.expectedChange || ''}`.trim())
        .sort();
      if (deltas.length > 0) {
        parts.push(`delta:${deltas.join(',')}`);
      }
    }

    if (fingerprint.expectedPostState && fingerprint.expectedPostState.length > 0) {
      const post = fingerprint.expectedPostState
        .map((p) => `${p.property}:${String(p.expectedValue)}`.trim())
        .sort();
      if (post.length > 0) {
        parts.push(`post:${post.join(',')}`);
      }
    }

    if (fingerprint.requiredContextPredicates && fingerprint.requiredContextPredicates.length > 0) {
      const reqCtx = fingerprint.requiredContextPredicates
        .map((c) => `${c.target || ''}:${c.pattern || ''}`.trim())
        .sort();
      if (reqCtx.length > 0) {
        parts.push(`reqCtx:${reqCtx.join(',')}`);
      }
    }

    if (fingerprint.forbiddenContextPredicates && fingerprint.forbiddenContextPredicates.length > 0) {
      const forbCtx = fingerprint.forbiddenContextPredicates
        .map((c) => `${c.target || ''}:${c.pattern || ''}`.trim())
        .sort();
      if (forbCtx.length > 0) {
        parts.push(`forbCtx:${forbCtx.join(',')}`);
      }
    }

    const raw = parts.join('|');
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `fph_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Constructs a FunctionalCapabilityFingerprint from a DOM Element and metadata
   */
  public static fromElement(
    element: Element,
    options: FingerprintConstructionOptions
  ): FunctionalCapabilityFingerprint {
    const suppression = VolatileFeatureSuppressor.suppressVolatileFeatures(element);

    // Extract surrounding and ancestor context
    const ancestorRelationships: string[] = [];
    const containerSemantics: string[] = [];
    let parent = element.parentElement;
    let depth = 0;
    while (parent && depth < 4) {
      const parentRole = parent.getAttribute('role') || parent.tagName.toLowerCase();
      const parentLabel = parent.getAttribute('aria-label') || '';
      ancestorRelationships.push(`${parentRole}${parentLabel ? `[${parentLabel}]` : ''}`);

      if (['section', 'nav', 'main', 'form', 'dialog', 'aside'].includes(parent.tagName.toLowerCase()) || parentRole) {
        containerSemantics.push(parentRole);
      }
      parent = parent.parentElement;
      depth++;
    }

    // Nearby text (siblings)
    const nearbyText: string[] = [];
    const prev = element.previousElementSibling;
    if (prev && prev.textContent) nearbyText.push(prev.textContent.trim().slice(0, 100));
    const next = element.nextElementSibling;
    if (next && next.textContent) nearbyText.push(next.textContent.trim().slice(0, 100));

    // Accessible name calculation
    const accessibleName =
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.getAttribute('title') ||
      element.getAttribute('placeholder') ||
      suppression.cleanedText ||
      '';

    const visibleLabel = suppression.cleanedText;
    const role = element.getAttribute('role') || element.tagName.toLowerCase();

    // Default risk class derivation if not specified
    const riskClass: RiskClass =
      options.riskClass ||
      (options.actionType === 'DELETE' || options.actionType === 'DEACTIVATE_ACCOUNT'
        ? 'DESTRUCTIVE'
        : options.actionType === 'REVOKE_ACCESS' || options.actionType === 'AUTHENTICATE'
        ? 'SECURITY_SENSITIVE'
        : options.actionType === 'MODIFY_PREFERENCE' || options.actionType === 'TOGGLE'
        ? 'REVERSIBLE'
        : 'READ_ONLY');

    const canonicalLabel = options.canonicalLabel || accessibleName || options.canonicalFunction;

    const fpHash = this.computeFingerprintHash({
      canonicalFunction: options.canonicalFunction,
      actionType: options.actionType,
      targetEntity: options.targetEntity,
      role,
      riskClass,
      mandatoryPreStatePredicates: options.mandatoryPreStatePredicates,
      allowedStateDelta: options.allowedStateDelta,
      expectedPostState: options.expectedPostState,
      requiredContextPredicates: options.requiredContextPredicates,
      forbiddenContextPredicates: options.forbiddenContextPredicates,
    });

    return {
      capabilityId: options.capabilityId,
      canonicalFunction: options.canonicalFunction,
      actionType: options.actionType,
      targetEntity: options.targetEntity,
      fingerprintHash: fpHash,

      mandatoryPreStatePredicates: options.mandatoryPreStatePredicates || [],
      allowedStateDelta: options.allowedStateDelta || [],
      expectedPostState: options.expectedPostState || [],
      requiredContextPredicates: options.requiredContextPredicates || [],
      forbiddenContextPredicates: options.forbiddenContextPredicates || [],

      semanticEvidence: {
        canonicalLabel,
        semanticSynonyms: options.semanticSynonyms || [],
        accessibleName,
        role,
        visibleLabel,
        sectionMeaning: containerSemantics.join(' > '),
        actionDescription: `${options.actionType} on ${options.targetEntity}`,
      },

      contextEvidence: {
        ancestorRelationships,
        nearbyText,
        surroundingLabels: nearbyText,
        containerSemantics,
        menuPanelRelationships: containerSemantics,
        relativeStructuralRelationships: [suppression.relativeStructuralPath],
        urlSemantics: options.urlSemantics || (typeof window !== 'undefined' ? window.location.pathname : ''),
      },

      transitionEvidence: {
        preStateFingerprint: 'STATE_PRE_INITIAL',
        activationEventCharacteristics: {
          eventType: 'click',
          bubbles: true,
          cancelable: true,
        },
        expectedDelta: {},
        postStateFingerprint: 'STATE_POST_EXPECTED',
        historicalTransitionObservations: 0,
        witnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
        verificationWindowMs: 1500,
      },

      riskMetadata: {
        riskClass,
        reversible: riskClass === 'READ_ONLY' || riskClass === 'REVERSIBLE',
        financial: riskClass === 'FINANCIAL',
        security: riskClass === 'SECURITY_SENSITIVE',
        destructive: riskClass === 'DESTRUCTIVE' || riskClass === 'IRREVERSIBLE',
        requiresConfirmation: ['SECURITY_SENSITIVE', 'DESTRUCTIVE', 'FINANCIAL', 'IRREVERSIBLE'].includes(riskClass),
      },

      provenance: {
        source: 'DISCOVERED',
        creationTimestamp: Date.now(),
        validationTimestamp: 0,
        routeVersion: 'v1.0.0',
        validationHistory: [],
      },

      confidence: {
        capabilityConfidence: 0.85,
        routeConfidence: 0.70,
      },

      negativeEvidence: {
        rejectedCandidateIdentities: [],
        contradictionPredicates: [],
        failedInvariantPredicates: [],
        failedTransitionWitnesses: [],
        decoyRelationships: [],
        rejectionReasons: [],
      },
    };
  }
}
