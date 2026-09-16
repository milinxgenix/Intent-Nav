/**
 * IntentNav-SCFR: Candidate Generation Engine
 *
 * Phase 3 & Phase 9 Implementation:
 * - Derives all candidate evidence strictly from observable DOM semantics:
 *   accessible name, ARIA, role, tag type, visible text, nearby text, ancestor context,
 *   container semantics, section headings, state attributes, and relative position.
 * - DOES NOT USE data-capability-id.
 * - Creates an internal BindingHandle for actual browser dispatch.
 * - BindingHandle != PersistentCapabilityIdentity.
 */

import { CandidateEvaluationContext } from '../invariant/engine';
import { VolatileFeatureSuppressor } from '../fingerprint/suppressor';
import { BindingHandle } from '../../types/capability';
import { FingerprintConstructor } from '../fingerprint/constructor';

export class CandidateGenerator {
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Generates candidate evaluation contexts from DOM elements purely based on observable semantics.
   */
  public static generateFromDOM(container: Document | Element): CandidateEvaluationContext[] {
    const candidates: CandidateEvaluationContext[] = [];

    // Query interactive controls: buttons, links, inputs, selects, switches, etc.
    const selector =
      'button, a, input, select, [role="button"], [role="link"], [role="switch"], [role="menuitem"], [role="tab"]';
    const elements = Array.from(container.querySelectorAll(selector));

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i]!;

      // Security & Privacy Guarantee: Never extract or process sensitive credential elements
      const inputType = (el.getAttribute('type') || '').toLowerCase();
      const autocomplete = (el.getAttribute('autocomplete') || '').toLowerCase();
      if (
        inputType === 'password' ||
        autocomplete.includes('password') ||
        autocomplete.includes('cc-') ||
        autocomplete.includes('credit-card') ||
        autocomplete.includes('one-time-code')
      ) {
        continue;
      }

      const suppression = VolatileFeatureSuppressor.suppressVolatileFeatures(el);

      // 1. Accessible Name & Visible Label
      const accessibleName =
        el.getAttribute('aria-label') ||
        el.getAttribute('title') ||
        suppression.cleanedText ||
        el.getAttribute('name') ||
        (el as HTMLInputElement).placeholder ||
        `element_${i}`;

      const role = el.getAttribute('role') || el.tagName.toLowerCase();

      // 2. Nearby Text (Previous/Next Sibling, Surrounding Paragraphs)
      const nearbyTexts: string[] = [];
      const parentEl = el.parentElement;
      if (parentEl) {
        const textElements = parentEl.querySelectorAll('p, span, strong, label, h1, h2, h3, h4');
        textElements.forEach((t) => {
          if (t !== el) {
            const text = (t.textContent || '').trim().replace(/\s+/g, ' ');
            if (text.length > 0 && text.length < 150) {
              nearbyTexts.push(text);
            }
          }
        });
      }

      // 3. Ancestor Context & Container Semantics
      const containerSemantics: string[] = [];
      const ancestorDescriptions: string[] = [];
      let currentParent = el.parentElement;
      let depth = 0;

      while (currentParent && currentParent.tagName.toLowerCase() !== 'body' && depth < 6) {
        const pTag = currentParent.tagName.toLowerCase();
        const pRole = currentParent.getAttribute('role') || pTag;
        const pLabel = currentParent.getAttribute('aria-label') || '';
        const heading = currentParent.querySelector('h1, h2, h3, h4');
        const headingText = heading ? (heading.textContent || '').trim() : '';

        if (['section', 'nav', 'main', 'form', 'dialog', 'aside', 'header'].includes(pTag) || currentParent.getAttribute('role')) {
          containerSemantics.push(pRole);
          if (pLabel) containerSemantics.push(pLabel.toLowerCase());
          if (headingText) containerSemantics.push(headingText.toLowerCase());
        }

        ancestorDescriptions.push(`${pRole}${pLabel ? `[${pLabel}]` : ''}`);
        currentParent = currentParent.parentElement;
        depth++;
      }

      const combinedContext = `${accessibleName} ${nearbyTexts.join(' ')} ${containerSemantics.join(' ')}`.toLowerCase();

      // 4. Infer Action Type from Role and Semantic Context
      let observedActionType = 'VIEW';
      const isSwitch = role === 'switch' || el.getAttribute('type') === 'checkbox';
      const isButton = role === 'button' || el.tagName.toLowerCase() === 'button';
      const isLink = role === 'link' || el.tagName.toLowerCase() === 'a';

      if (isSwitch) {
        observedActionType = 'TOGGLE';
      } else if (isButton) {
        if (/delete|remove|erase|purge|destroy/i.test(accessibleName)) {
          observedActionType = 'DELETE';
        } else if (/export|download|archive/i.test(accessibleName)) {
          observedActionType = 'EXPORT_DATA';
        } else if (/pause|deactivate|suspend|close account|break/i.test(accessibleName)) {
          observedActionType = 'DEACTIVATE_ACCOUNT';
        } else if (/turn off 2fa|disable 2fa|remove 2fa|disable mfa|revoke/i.test(accessibleName)) {
          observedActionType = 'REVOKE_ACCESS';
        } else if (/turn on 2fa|enable 2fa|setup 2fa|enroll/i.test(accessibleName)) {
          observedActionType = 'AUTHENTICATE';
        } else if (/submit|save|update|confirm/i.test(accessibleName)) {
          observedActionType = 'SUBMIT';
        } else {
          observedActionType = 'MODIFY_PREFERENCE';
        }
      } else if (isLink) {
        observedActionType = 'NAVIGATE';
      }

      // 5. Infer Target Entity from Combined DOM Semantics
      let observedTargetEntity = 'UNKNOWN';
      if (/all notification|global alert|every alert|indiscriminately|entire platform|all account notification/i.test(combinedContext)) {
        observedTargetEntity = 'ALL_NOTIFICATIONS';
      } else if (/marketing|promot|newsletter|campaign|bulletin/i.test(combinedContext)) {
        observedTargetEntity = 'MARKETING_NOTIFICATIONS';
      } else if (/export|download|my data|gdpr|personal record|data archive/i.test(combinedContext)) {
        observedTargetEntity = 'PERSONAL_DATA_EXPORT';
      } else if (/2fa|two-factor|two step|mfa|authenticat|security code/i.test(combinedContext)) {
        observedTargetEntity = 'TWO_FACTOR_AUTH';
      } else if (/security|password|credential/i.test(combinedContext)) {
        observedTargetEntity = 'SECURITY_SETTINGS';
      } else if (/tracking|cookie|telemetry|analytics|behavioral/i.test(combinedContext)) {
        observedTargetEntity = 'PRIVACY_SETTINGS';
      } else if (/deactivate|pause account|suspend profile|close account|membership hiatus/i.test(combinedContext)) {
        observedTargetEntity = 'ACCOUNT_STATUS';
      } else if (/billing|payment|credit card|invoice/i.test(combinedContext)) {
        observedTargetEntity = 'BILLING_PREFERENCES';
      }

      // 6. Volatile Binding Handle for Browser Dispatch (BindingHandle != CapabilityIdentity)
      const domStructuralPath = VolatileFeatureSuppressor.computeRelativePath(el);
      const bindingHandle: BindingHandle = {
        handleId: `handle_${i}_${Date.now()}`,
        tagName: el.tagName.toLowerCase(),
        role,
        accessibleName,
        domStructuralPath,
        elementIndex: i,
        volatileId: el.id ? el.id : undefined,
        volatileClasses: el.className && typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean) : undefined,
      };

      // 7. Stable Candidate ID (Derived from semantic role, text, and structural path, NOT from data-capability-id)
      const candidateId = `cand_${i}_${this.simpleHash(accessibleName + '_' + role + '_' + domStructuralPath)}`;

      // 8. Candidate Fingerprint Hash
      const candidateFingerprintHash = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: `func_${observedActionType.toLowerCase()}_${observedTargetEntity.toLowerCase()}`,
        actionType: observedActionType,
        targetEntity: observedTargetEntity,
        canonicalLabel: accessibleName,
        role,
      });

      candidates.push({
        candidateId,
        candidateLabel: accessibleName,
        observedActionType,
        observedTargetEntity,
        observedRole: role,
        containerSemantics,
        ancestors: ancestorDescriptions,
        observedState: {
          disabled: (el as HTMLButtonElement).disabled ?? false,
          checked:
            el.getAttribute('aria-checked') !== null
              ? el.getAttribute('aria-checked') === 'true'
              : (el as HTMLInputElement).checked ?? false,
          expanded: el.getAttribute('aria-expanded') === 'true',
        },
        bindingHandle,
        candidateFingerprintHash,
      });
    }

    return candidates;
  }
}
