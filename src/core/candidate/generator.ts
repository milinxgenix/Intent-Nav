/**
 * IntentNav-SCFR: Candidate Generation Engine
 * Discovers interactive candidate elements in current interface state
 */

import { CandidateEvaluationContext } from '../invariant/engine';
import { VolatileFeatureSuppressor } from '../fingerprint/suppressor';

export class CandidateGenerator {
  /**
   * Generates candidate evaluation contexts from DOM elements
   */
  public static generateFromDOM(container: Document | Element): CandidateEvaluationContext[] {
    const candidates: CandidateEvaluationContext[] = [];

    // Query interactive controls: buttons, links, inputs, selects, role=button, etc.
    const selector = 'button, a, input, select, [role="button"], [role="link"], [role="switch"], [role="menuitem"], [role="tab"]';
    const elements = Array.from(container.querySelectorAll(selector));

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i]!;
      const suppression = VolatileFeatureSuppressor.suppressVolatileFeatures(el);

      const label =
        el.getAttribute('aria-label') ||
        el.getAttribute('title') ||
        suppression.cleanedText ||
        el.getAttribute('name') ||
        `element_${i}`;

      const role = el.getAttribute('role') || el.tagName.toLowerCase();

      // Extract container semantics
      const containerSemantics: string[] = [];
      let parent = el.parentElement;
      while (parent && parent.tagName.toLowerCase() !== 'body') {
        const pRole = parent.getAttribute('role') || parent.tagName.toLowerCase();
        if (['section', 'nav', 'main', 'form', 'dialog', 'aside', 'header'].includes(parent.tagName.toLowerCase()) || parent.getAttribute('role')) {
          containerSemantics.push(pRole);
        }
        parent = parent.parentElement;
      }

      // Infer functional hints
      let observedActionType = 'VIEW';
      if (role === 'switch' || el.getAttribute('type') === 'checkbox') {
        observedActionType = 'TOGGLE';
      } else if (role === 'button' || el.tagName.toLowerCase() === 'button') {
        if (/delete|remove|erase/i.test(label)) observedActionType = 'DELETE';
        else if (/export|download/i.test(label)) observedActionType = 'EXPORT_DATA';
        else if (/pause|deactivate/i.test(label)) observedActionType = 'DEACTIVATE_ACCOUNT';
        else observedActionType = 'MODIFY_PREFERENCE';
      } else if (el.tagName.toLowerCase() === 'a') {
        observedActionType = 'NAVIGATE';
      }

      // Infer target entity hint
      let observedTargetEntity = 'UNKNOWN';
      const combinedContext = `${label} ${containerSemantics.join(' ')}`.toLowerCase();
      if (/marketing|promot|newsletter|campaign/i.test(combinedContext)) {
        observedTargetEntity = 'MARKETING_NOTIFICATIONS';
      } else if (/all notification|global alert|system notification/i.test(combinedContext)) {
        observedTargetEntity = 'ALL_NOTIFICATIONS';
      } else if (/export|download|my data/i.test(combinedContext)) {
        observedTargetEntity = 'PERSONAL_DATA_EXPORT';
      } else if (/2fa|two-factor|authenticat/i.test(combinedContext)) {
        observedTargetEntity = 'TWO_FACTOR_AUTH';
      } else if (/security|password/i.test(combinedContext)) {
        observedTargetEntity = 'SECURITY_SETTINGS';
      } else if (/privacy|tracking|cookie/i.test(combinedContext)) {
        observedTargetEntity = 'PRIVACY_SETTINGS';
      } else if (/account|membership|profile/i.test(combinedContext)) {
        observedTargetEntity = 'ACCOUNT_STATUS';
      }

      const candidateId = el.getAttribute('data-capability-id') || el.id || `cand_${i}_${label.slice(0, 15).replace(/\s+/g, '_')}`;

      candidates.push({
        candidateId,
        candidateLabel: label,
        observedActionType,
        observedTargetEntity,
        observedRole: role,
        containerSemantics,
        ancestors: containerSemantics,
        observedState: {
          disabled: (el as HTMLButtonElement).disabled ?? false,
          checked: (el as HTMLInputElement).checked ?? false,
        },
      });
    }

    return candidates;
  }
}

