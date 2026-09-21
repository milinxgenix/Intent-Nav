/**
 * IntentNav-SCFR: Browser DOM Activation Event Dispatcher
 *
 * Implements genuine event-type-correct DOM activation:
 * - click -> MouseEvent('click')
 * - keydown -> KeyboardEvent('keydown') with declared key/code/keyCode
 * - change -> Event('change')
 * - submit -> SubmitEvent / Event('submit') on form or form controls
 *
 * Enforces legitimate target receipt rules to prevent blindly dispatching
 * arbitrary events to elements that cannot legitimately receive them.
 */

import { ActivationEventCharacteristics } from '../types/capability';

export interface EventReceiptCheck {
  allowed: boolean;
  reason?: string;
}

export interface DOMActivationResult {
  success: boolean;
  eventDispatched: boolean;
  eventType: 'click' | 'keydown' | 'change' | 'submit';
  reason?: string;
}

/**
 * Checks whether an element can legitimately receive the declared event type.
 */
export function canElementReceiveActivation(
  el: HTMLElement,
  eventType: string
): EventReceiptCheck {
  if (!el || typeof el !== 'object') {
    return { allowed: false, reason: 'Target element is null or not a valid DOM node.' };
  }

  const tagName = (el.tagName || '').toLowerCase();
  const role = (el.getAttribute('role') || '').toLowerCase().trim();

  switch (eventType) {
    case 'click':
      // Any HTMLElement in the DOM can legitimately receive a click event.
      return { allowed: true };

    case 'keydown': {
      // Must be focusable or an interactive element
      const isInteractiveTag = [
        'button',
        'input',
        'select',
        'textarea',
        'a',
        'summary',
        'details',
      ].includes(tagName);

      const hasTabIndex = el.hasAttribute('tabindex');
      const isContentEditable = Boolean(el.isContentEditable);

      const interactiveRoles = [
        'button',
        'switch',
        'checkbox',
        'radio',
        'textbox',
        'searchbox',
        'combobox',
        'link',
        'menuitem',
        'menuitemcheckbox',
        'menuitemradio',
        'tab',
        'slider',
        'spinbutton',
        'treeitem',
      ];
      const hasInteractiveRole = interactiveRoles.includes(role);

      if (isInteractiveTag || hasTabIndex || isContentEditable || hasInteractiveRole) {
        return { allowed: true };
      }

      return {
        allowed: false,
        reason: `Target element <${tagName}> is not focusable or interactive and cannot legitimately receive 'keydown' events.`,
      };
    }

    case 'change': {
      // Must be an input, select, textarea, or control with mutable state
      const isInputTag = ['input', 'select', 'textarea'].includes(tagName);
      const isContentEditable = Boolean(el.isContentEditable);

      const mutableRoles = [
        'switch',
        'checkbox',
        'radio',
        'combobox',
        'slider',
        'spinbutton',
        'listbox',
      ];
      const hasMutableRole = mutableRoles.includes(role);

      const hasStateAttributes =
        el.hasAttribute('aria-checked') ||
        el.hasAttribute('aria-selected') ||
        el.hasAttribute('aria-valuenow');

      if (isInputTag || isContentEditable || hasMutableRole || hasStateAttributes) {
        return { allowed: true };
      }

      return {
        allowed: false,
        reason: `Target element <${tagName}> does not possess mutable value or state and cannot legitimately receive a 'change' event.`,
      };
    }

    case 'submit': {
      // Must be a form or a form-submission mechanism
      const isFormTag = tagName === 'form';
      const isSubmitInput =
        tagName === 'input' &&
        ['submit', 'image'].includes(((el as HTMLInputElement).type || '').toLowerCase());
      const isButtonTag = tagName === 'button';
      const isButtonRole = role === 'button';
      const isInsideForm = Boolean(el.closest('form'));

      if (isFormTag || isSubmitInput || isButtonTag || isButtonRole || isInsideForm) {
        return { allowed: true };
      }

      return {
        allowed: false,
        reason: `Target element <${tagName}> is not a <form> or submission control and cannot legitimately receive a 'submit' event.`,
      };
    }

    default:
      return {
        allowed: false,
        reason: `Unsupported activation event type: '${eventType}'.`,
      };
  }
}

/**
 * Dispatches the declared event type to the target DOM element with proper event instantiation.
 */
export function dispatchDOMActivation(
  targetEl: HTMLElement,
  characteristics?: ActivationEventCharacteristics,
  win?: Window
): DOMActivationResult {
  const effectiveWin = win || (targetEl.ownerDocument?.defaultView as Window) || window;
  const eventType = characteristics?.eventType || 'click';

  // 1. Verify legitimate receipt
  const receiptCheck = canElementReceiveActivation(targetEl, eventType);
  if (!receiptCheck.allowed) {
    return {
      success: false,
      eventDispatched: false,
      eventType: eventType as any,
      reason: receiptCheck.reason,
    };
  }

  const bubbles = characteristics?.bubbles !== false;
  const cancelable = characteristics?.cancelable !== false;

  const winAny = effectiveWin as any;

  try {
    switch (eventType) {
      case 'click': {
        const MouseEventCtor = winAny.MouseEvent || MouseEvent;
        const mouseEvt = new MouseEventCtor('click', {
          bubbles,
          cancelable,
          view: effectiveWin,
        });
        targetEl.dispatchEvent(mouseEvt);
        return { success: true, eventDispatched: true, eventType: 'click' };
      }

      case 'keydown': {
        const key = characteristics?.key || 'Enter';
        const code =
          characteristics?.code ||
          (key === ' ' ? 'Space' : key === 'Enter' ? 'Enter' : `Key${key.toUpperCase()}`);
        const keyCode =
          characteristics?.keyCode ||
          (key === 'Enter' ? 13 : key === ' ' ? 32 : key.charCodeAt(0) || 0);

        if (typeof targetEl.focus === 'function') {
          try {
            targetEl.focus();
          } catch {}
        }

        const KeyboardEventCtor = winAny.KeyboardEvent || KeyboardEvent;
        const keyboardEvt = new KeyboardEventCtor('keydown', {
          key,
          code,
          keyCode,
          which: keyCode,
          bubbles,
          cancelable,
          view: effectiveWin,
        });
        targetEl.dispatchEvent(keyboardEvt);
        return { success: true, eventDispatched: true, eventType: 'keydown' };
      }

      case 'change': {
        // Toggle input checked state if it is a checkbox/radio
        if (targetEl.tagName.toLowerCase() === 'input') {
          const inputEl = targetEl as HTMLInputElement;
          if (inputEl.type === 'checkbox') {
            inputEl.checked = !inputEl.checked;
          }
        }
        const EventCtor = winAny.Event || Event;
        const changeEvt = new EventCtor('change', {
          bubbles,
          cancelable: characteristics?.cancelable ?? false,
        });
        targetEl.dispatchEvent(changeEvt);
        return { success: true, eventDispatched: true, eventType: 'change' };
      }

      case 'submit': {
        const form =
          targetEl.tagName.toLowerCase() === 'form'
            ? (targetEl as HTMLFormElement)
            : (targetEl as HTMLButtonElement).form || targetEl.closest('form');

        const EventCtor = winAny.Event || Event;
        if (form) {
          let submitEvt: Event;
          try {
            if (typeof winAny.SubmitEvent === 'function') {
              submitEvt = new winAny.SubmitEvent('submit', {
                bubbles: true,
                cancelable: true,
                submitter: targetEl,
              });
            } else {
              submitEvt = new EventCtor('submit', { bubbles: true, cancelable: true });
            }
          } catch {
            submitEvt = new EventCtor('submit', { bubbles: true, cancelable: true });
          }
          form.dispatchEvent(submitEvt);
        } else {
          // Standalone element with submit role
          const submitEvt = new EventCtor('submit', {
            bubbles,
            cancelable,
          });
          targetEl.dispatchEvent(submitEvt);
        }
        return { success: true, eventDispatched: true, eventType: 'submit' };
      }

      default:
        return {
          success: false,
          eventDispatched: false,
          eventType: eventType as any,
          reason: `Unknown event type '${eventType}'`,
        };
    }
  } catch (err: any) {
    return {
      success: false,
      eventDispatched: false,
      eventType: eventType as any,
      reason: `DOM event dispatch threw error: ${err?.message || err}`,
    };
  }
}
