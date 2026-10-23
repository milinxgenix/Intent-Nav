/**
 * IntentNav-SCFR: Generic Capability Acquisition Engine
 *
 * Implements Step 7: Generic Capability Acquisition
 * - Discovers previously unseen, arbitrary interface capabilities directly from observed DOM semantics.
 * - Enforces strict eligibility criteria (rejects credentials, inaccessible/hidden, ambiguous, volatile-only, generic decoy elements).
 * - Preserves fundamental distinction: Capability Identity != Concrete DOM Instance (BindingHandle).
 * - Uses deterministic domain-separated SHA-256 capability fingerprinting.
 * - Associates acquired capabilities with rich multi-channel evidence and provenance.
 * - Preserves execution authorization gating (Discovery != Authorization).
 */

import {
  FunctionalCapabilityFingerprint,
  CapabilityEligibilityResult,
  DiscoveredCapabilityCandidate,
  ActionType,
  TargetEntity,
  RiskClass,
} from '../../types/capability';
import { CandidateEvaluationContext } from '../invariant/engine';
import { CandidateGenerator } from '../candidate/generator';
import { createFunctionalCapability } from './catalog';
import { createDeclarativePredicate } from '../invariant/predicates';
import { FingerprintConstructor } from '../fingerprint/constructor';
import { RiskClassifier } from '../authorization/classifier';

export class CapabilityAcquisitionEngine {
  /**
   * Evaluates whether an observed candidate is eligible to be acquired as a first-class capability.
   * Filters out credentials, hidden elements, ambiguous controls, volatile-only hashes, and generic decoys.
   */
  public static evaluateEligibility(
    candidate: CandidateEvaluationContext,
    element?: Element
  ): CapabilityEligibilityResult {
    const label = (candidate.candidateLabel || '').trim();
    const role = (candidate.observedRole || '').toLowerCase();
    const tag = (candidate.bindingHandle?.tagName || '').toLowerCase();

    // 1. Security & Privacy: Sensitive input / credential check
    const lowerContext = `${label} ${candidate.nearbyText?.join(' ') || ''} ${candidate.containerSemantics?.join(' ') || ''}`.toLowerCase();
    if (
      /password|credential|secret|credit[-_\s]*card|cvv|one[-_\s]*time[-_\s]*code|passcode/i.test(lowerContext) ||
      /password|credit-card|cc-/i.test(candidate.bindingHandle?.volatileId || '')
    ) {
      return {
        eligible: false,
        classification: 'INELIGIBLE_CANDIDATE',
        rejectionReason: 'CREDENTIAL_OR_SENSITIVE_INPUT',
      };
    }

    // 2. Accessibility & Visibility: Inaccessible, disabled or hidden elements
    const isStateDisabled = Boolean(candidate.observedState?.['disabled']);
    const isStateHidden = Boolean(candidate.observedState?.['hidden']);
    if (isStateDisabled || isStateHidden) {
      return {
        eligible: false,
        classification: 'INELIGIBLE_CANDIDATE',
        rejectionReason: 'ELEMENT_INACCESSIBLE_OR_HIDDEN',
      };
    }

    if (element) {
      const ariaHidden = element.getAttribute('aria-hidden') === 'true';
      const hiddenAttr = element.hasAttribute('hidden');
      if (ariaHidden || hiddenAttr) {
        return {
          eligible: false,
          classification: 'INELIGIBLE_CANDIDATE',
          rejectionReason: 'ELEMENT_INACCESSIBLE_OR_HIDDEN',
        };
      }
      if (typeof window !== 'undefined' && (element as HTMLElement).style) {
        const style = (element as HTMLElement).style;
        if (style.display === 'none' || style.visibility === 'hidden') {
          return {
            eligible: false,
            classification: 'INELIGIBLE_CANDIDATE',
            rejectionReason: 'ELEMENT_INACCESSIBLE_OR_HIDDEN',
          };
        }
      }
    }

    // 3. Role Validation: Element must have an interactive semantic role
    const validRoles = ['button', 'switch', 'link', 'menuitem', 'tab', 'checkbox', 'radio', 'input', 'select'];
    const isInteractiveTag = ['button', 'a', 'input', 'select'].includes(tag);
    if (!validRoles.includes(role) && !isInteractiveTag) {
      return {
        eligible: false,
        classification: 'INELIGIBLE_CANDIDATE',
        rejectionReason: 'MISSING_INTERACTIVE_ROLE',
      };
    }

    // 4. Ambiguity Detection: Elements with empty or uninformative labels and no semantic container
    const isBlankLabel = !label || /^element_\d+$/i.test(label) || /^btn$/i.test(label);
    const hasMeaningfulContainer = (candidate.containerSemantics && candidate.containerSemantics.length > 0) ||
      (candidate.nearbyText && candidate.nearbyText.some((t) => t.trim().length > 3));

    if (isBlankLabel && !hasMeaningfulContainer) {
      return {
        eligible: false,
        classification: 'INELIGIBLE_CANDIDATE',
        rejectionReason: 'AMBIGUOUS_SEMANTICS',
      };
    }

    // 5. Volatile-only Identifier Detection
    // If the candidate's only identity is an ephemeral session token with no stable structural path or accessible name
    if (
      (!candidate.bindingHandle?.domStructuralPath || candidate.bindingHandle.domStructuralPath === 'unknown') &&
      isBlankLabel
    ) {
      return {
        eligible: false,
        classification: 'INELIGIBLE_CANDIDATE',
        rejectionReason: 'VOLATILE_ONLY_IDENTIFIER',
      };
    }

    // 6. Generic Unsupported Target Check: Pure generic decoys with zero functional intent
    if (
      candidate.observedTargetEntity === 'UNKNOWN' &&
      isBlankLabel &&
      (!candidate.nearbyText || candidate.nearbyText.length === 0)
    ) {
      return {
        eligible: false,
        classification: 'INELIGIBLE_CANDIDATE',
        rejectionReason: 'GENERIC_UNSUPPORTED_TARGET',
      };
    }

    return {
      eligible: true,
      classification: 'ELIGIBLE_CANDIDATE',
    };
  }

  /**
   * Acquires a new FunctionalCapabilityFingerprint from an eligible observed candidate context.
   * Produces a fully deterministic, domain-separated SHA-256 capability fingerprint.
   */
  public static acquireCapability(
    candidate: CandidateEvaluationContext,
    routeContext?: { fromStateId?: string; urlPattern?: string }
  ): FunctionalCapabilityFingerprint {
    const eligibility = this.evaluateEligibility(candidate);
    if (!eligibility.eligible) {
      throw new Error(`Cannot acquire ineligible candidate: ${eligibility.rejectionReason}`);
    }

    const actionType = (candidate.observedActionType || 'MODIFY_PREFERENCE') as ActionType;
    const targetEntity = (candidate.observedTargetEntity || 'GENERIC_PREFERENCE') as TargetEntity;
    const accessibleName = candidate.candidateLabel || `${actionType}_${targetEntity}`;
    const role = candidate.observedRole || candidate.bindingHandle?.role || 'button';

    // Derive stable canonical capability ID independent of volatile DOM attributes
    const cleanEntity = targetEntity.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const cleanAction = actionType.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const capabilityId = `CAP_${cleanAction}_${cleanEntity}`;

    const canonicalFunction = `func_${actionType.toLowerCase()}_${targetEntity.toLowerCase()}`;

    // Risk classification using established rules
    const riskInfo = RiskClassifier.classifyRisk(actionType, targetEntity);

    // Build canonical semantic evidence
    const synonyms: string[] = [
      accessibleName.toLowerCase(),
      `${actionType.toLowerCase()} ${targetEntity.toLowerCase()}`.replace(/_/g, ' '),
    ];
    if (candidate.nearbyText) {
      for (const text of candidate.nearbyText.slice(0, 3)) {
        if (text.length > 3 && text.length < 60) {
          synonyms.push(text.toLowerCase());
        }
      }
    }

    // Determine state property to observe
    const stateProperty = targetEntity.toLowerCase().replace(/[^a-z0-9_]/g, '_') + '_enabled';
    const isToggle = role === 'switch' || role === 'checkbox' || actionType === 'MODIFY_PREFERENCE' || actionType === 'TOGGLE';

    // Build the acquired capability fingerprint specification
    const acquiredCap = createFunctionalCapability({
      capabilityId,
      canonicalFunction,
      actionType,
      targetEntity,
      mandatoryPreStatePredicates: isToggle
        ? [
            createDeclarativePredicate({
              id: `PRE_${cleanEntity}_ACTIVE`,
              name: `${accessibleName} Precondition`,
              description: `Precondition for ${accessibleName}`,
              source: 'PRE_STATE',
              property: stateProperty,
              operator: 'EQUALS',
              expectedValue: true,
            }),
          ]
        : [],
      allowedStateDelta: isToggle
        ? [{ property: stateProperty, expectedChange: 'ENABLED_TO_DISABLED' }]
        : [{ property: stateProperty, expectedChange: 'MODIFIED' }],
      expectedPostState: isToggle
        ? [{ property: stateProperty, expectedValue: false }]
        : [],
      requiredContextPredicates: candidate.containerSemantics && candidate.containerSemantics.length > 0
        ? [
            {
              target: 'container',
              pattern: candidate.containerSemantics[0]!,
              required: true,
            },
          ]
        : [],
      forbiddenContextPredicates: [
        {
          target: 'container',
          pattern: 'delete_account|billing_purge',
          required: false,
        },
      ],
      semanticEvidence: {
        canonicalLabel: accessibleName,
        semanticSynonyms: Array.from(new Set(synonyms)),
        accessibleName,
        role,
        visibleLabel: accessibleName,
        sectionMeaning: candidate.ancestors?.[0] || 'Discovered Controls',
        actionDescription: `Execute ${actionType} on ${targetEntity}`,
      },
      contextEvidence: {
        ancestorRelationships: candidate.ancestors || [],
        nearbyText: candidate.nearbyText || [],
        surroundingLabels: [accessibleName],
        containerSemantics: candidate.containerSemantics || [],
        menuPanelRelationships: [],
        relativeStructuralRelationships: candidate.bindingHandle?.domStructuralPath
          ? [candidate.bindingHandle.domStructuralPath]
          : [],
        urlSemantics: routeContext?.urlPattern || '/',
      },
      transitionEvidence: {
        preStateFingerprint: `STATE_PRE_${cleanEntity}`,
        activationEventCharacteristics: {
          eventType: 'click',
          bubbles: true,
          cancelable: true,
        },
        expectedDelta: { [stateProperty]: false },
        postStateFingerprint: `STATE_POST_${cleanEntity}`,
        historicalTransitionObservations: 1,
        witnessClasses: ['DOM_MUTATION', 'APPLICATION_STATE_MUTATION'],
        verificationWindowMs: 2500,
      },
      riskMetadata: {
        riskClass: riskInfo.riskClass as RiskClass,
        reversible: riskInfo.riskLevel !== 'HIGH',
        financial: riskInfo.riskClass === 'FINANCIAL',
        security: riskInfo.riskClass === 'SECURITY_SENSITIVE',
        destructive: Boolean(riskInfo.isDestructive),
        requiresConfirmation: riskInfo.riskLevel === 'HIGH',
      },
      provenance: {
        source: 'DISCOVERED',
        creationTimestamp: Date.now(),
        validationTimestamp: Date.now(),
        routeVersion: 'v1.0.0',
        invalidationReason: undefined,
        validationHistory: [],
      },
      confidence: {
        capabilityConfidence: 0.88,
        routeConfidence: 0.80,
      },
    });

    return acquiredCap;
  }

  /**
   * Scans a DOM container and acquires all eligible, previously unseen capabilities.
   * Deduplicates capabilities by their canonical SHA-256 fingerprint hash.
   */
  public static discoverFromDOM(
    container: Document | Element,
    urlPattern: string = '/'
  ): {
    acquiredCapabilities: FunctionalCapabilityFingerprint[];
    discoveredCandidates: DiscoveredCapabilityCandidate[];
    rejectedCandidates: Array<{ candidate: CandidateEvaluationContext; reason: string }>;
  } {
    const rawCandidates = CandidateGenerator.generateFromDOM(container);
    const acquiredCapabilities: FunctionalCapabilityFingerprint[] = [];
    const discoveredCandidates: DiscoveredCapabilityCandidate[] = [];
    const rejectedCandidates: Array<{ candidate: CandidateEvaluationContext; reason: string }> = [];

    const seenFingerprints = new Set<string>();

    for (const cand of rawCandidates) {
      const eligibility = this.evaluateEligibility(cand);
      if (!eligibility.eligible) {
        rejectedCandidates.push({
          candidate: cand,
          reason: eligibility.rejectionReason || 'INELIGIBLE',
        });
        continue;
      }

      try {
        const cap = this.acquireCapability(cand, { urlPattern });
        const hash = cap.fingerprintHash || FingerprintConstructor.computeFingerprintHashFromCapability(cap);

        if (!seenFingerprints.has(hash)) {
          seenFingerprints.add(hash);
          acquiredCapabilities.push(cap);
        }

        if (cand.bindingHandle) {
          discoveredCandidates.push({
            candidateId: cand.candidateId,
            fingerprint: cap,
            bindingHandle: cand.bindingHandle,
            eligibility,
            discoveredAt: Date.now(),
            sourceUrl: urlPattern,
          });
        }
      } catch (err: any) {
        rejectedCandidates.push({
          candidate: cand,
          reason: err?.message || 'Acquisition error',
        });
      }
    }

    return {
      acquiredCapabilities,
      discoveredCandidates,
      rejectedCandidates,
    };
  }
}
