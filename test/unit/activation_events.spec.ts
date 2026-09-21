/**
 * IntentNav-SCFR: Browser Activation Event Types & Dispatch Verification Suite
 *
 * Verifies Prompt 8 Requirements:
 * 1. Resolves event type from capability / activation definition.
 * 2. Dispatches correct DOM event class (MouseEvent, KeyboardEvent, change Event, SubmitEvent).
 * 3. Enforces legitimate receipt rules (no arbitrary events to ineligible elements).
 * 4. Includes activation event type in transition signature and validation record.
 * 5. Causal verifier enforces event type matching.
 * 6. Preserves existing click behavior as default.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  canElementReceiveActivation,
  dispatchDOMActivation,
} from '../../src/browser/eventDispatcher';
import { IntentNavMachine, ExecutionDispatcher } from '../../src/core/stateMachine/machine';
import { FunctionalCapabilityFingerprint } from '../../src/types/capability';
import { CandidateEvaluationContext } from '../../src/core/invariant/engine';
import { CausalTransitionVerifier } from '../../src/core/causal/verifier';
import { TransitionSignature, ActivationEventRecord } from '../../src/types/transition';

describe('Prompt 8: Browser Activation Event Types & Dispatcher Verification', () => {
  let dom: JSDOM;
  let window: any;
  let document: Document;

  beforeEach(() => {
    dom = new JSDOM(
      `<!DOCTYPE html>
      <html>
        <body>
          <button id="btn-toggle" role="switch" aria-checked="true">Disable Notifications</button>
          <input type="checkbox" id="chk-optin" checked />
          <input type="text" id="txt-input" value="hello" />
          <form id="frm-settings" action="/submit">
            <input type="text" name="setting" value="val" />
            <button type="submit" id="btn-submit-form">Save Changes</button>
          </form>
          <div id="static-div">Static Container</div>
          <p id="static-p">Static Paragraph</p>
          <a href="#test" id="link-nav">Navigate</a>
        </body>
      </html>`,
      { url: 'http://localhost:3000/' }
    );
    window = dom.window;
    document = dom.window.document;
  });

  describe('Part 1: Legitimate Target Receipt Gating', () => {
    it('allows click on any HTMLElement', () => {
      const btn = document.getElementById('btn-toggle')!;
      const div = document.getElementById('static-div')!;
      expect(canElementReceiveActivation(btn, 'click').allowed).toBe(true);
      expect(canElementReceiveActivation(div, 'click').allowed).toBe(true);
    });

    it('allows keydown on interactive, focusable, or control elements, rejects static div', () => {
      const btn = document.getElementById('btn-toggle')!;
      const link = document.getElementById('link-nav')!;
      const input = document.getElementById('txt-input')!;
      const div = document.getElementById('static-div')!;

      expect(canElementReceiveActivation(btn, 'keydown').allowed).toBe(true);
      expect(canElementReceiveActivation(link, 'keydown').allowed).toBe(true);
      expect(canElementReceiveActivation(input, 'keydown').allowed).toBe(true);

      const divCheck = canElementReceiveActivation(div, 'keydown');
      expect(divCheck.allowed).toBe(false);
      expect(divCheck.reason).toContain('not focusable or interactive');
    });

    it('allows change on input, select, textarea, or elements with mutable state / aria-checked, rejects static div', () => {
      const chk = document.getElementById('chk-optin')!;
      const txt = document.getElementById('txt-input')!;
      const sw = document.getElementById('btn-toggle')!; // role="switch", aria-checked
      const div = document.getElementById('static-div')!;

      expect(canElementReceiveActivation(chk, 'change').allowed).toBe(true);
      expect(canElementReceiveActivation(txt, 'change').allowed).toBe(true);
      expect(canElementReceiveActivation(sw, 'change').allowed).toBe(true);

      const divCheck = canElementReceiveActivation(div, 'change');
      expect(divCheck.allowed).toBe(false);
      expect(divCheck.reason).toContain('does not possess mutable value or state');
    });

    it('allows submit on form or submit buttons, rejects non-form elements', () => {
      const form = document.getElementById('frm-settings')!;
      const submitBtn = document.getElementById('btn-submit-form')!;
      const p = document.getElementById('static-p')!;

      expect(canElementReceiveActivation(form, 'submit').allowed).toBe(true);
      expect(canElementReceiveActivation(submitBtn, 'submit').allowed).toBe(true);

      const pCheck = canElementReceiveActivation(p, 'submit');
      expect(pCheck.allowed).toBe(false);
      expect(pCheck.reason).toContain('not a <form> or submission control');
    });

    it('rejects unsupported event types', () => {
      const btn = document.getElementById('btn-toggle')!;
      const check = canElementReceiveActivation(btn, 'wheel');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('Unsupported activation event type');
    });
  });

  describe('Part 2: DOM Event Class & Attribute Instantiation', () => {
    it('dispatches MouseEvent for eventType="click"', () => {
      const btn = document.getElementById('btn-toggle')!;
      let receivedEvent: any = null;
      btn.addEventListener('click', (e) => {
        receivedEvent = e;
      });

      const res = dispatchDOMActivation(btn, { eventType: 'click', bubbles: true, cancelable: true }, window);
      expect(res.success).toBe(true);
      expect(res.eventDispatched).toBe(true);
      expect(res.eventType).toBe('click');
      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent instanceof window.MouseEvent).toBe(true);
      expect(receivedEvent.type).toBe('click');
      expect(receivedEvent.bubbles).toBe(true);
    });

    it('dispatches KeyboardEvent with declared key and code for eventType="keydown"', () => {
      const btn = document.getElementById('btn-toggle')!;
      let receivedEvent: any = null;
      btn.addEventListener('keydown', (e) => {
        receivedEvent = e;
      });

      const res = dispatchDOMActivation(
        btn,
        {
          eventType: 'keydown',
          bubbles: true,
          cancelable: true,
          key: ' ',
          code: 'Space',
          keyCode: 32,
        },
        window
      );

      expect(res.success).toBe(true);
      expect(res.eventDispatched).toBe(true);
      expect(res.eventType).toBe('keydown');
      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent instanceof window.KeyboardEvent).toBe(true);
      expect(receivedEvent.type).toBe('keydown');
      expect(receivedEvent.key).toBe(' ');
      expect(receivedEvent.code).toBe('Space');
    });

    it('dispatches Event("change") and toggles checkbox for eventType="change"', () => {
      const chk = document.getElementById('chk-optin') as HTMLInputElement;
      expect(chk.checked).toBe(true);

      let receivedEvent: any = null;
      chk.addEventListener('change', (e) => {
        receivedEvent = e;
      });

      const res = dispatchDOMActivation(chk, { eventType: 'change', bubbles: true, cancelable: false }, window);
      expect(res.success).toBe(true);
      expect(res.eventDispatched).toBe(true);
      expect(res.eventType).toBe('change');
      expect(chk.checked).toBe(false); // Checkbox state toggled
      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent.type).toBe('change');
      expect(receivedEvent.bubbles).toBe(true);
    });

    it('dispatches submit event on form when activated via form or submit button', () => {
      const form = document.getElementById('frm-settings') as HTMLFormElement;
      const submitBtn = document.getElementById('btn-submit-form')!;
      let submitFired = false;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitFired = true;
      });

      const res = dispatchDOMActivation(submitBtn, { eventType: 'submit', bubbles: true, cancelable: true }, window);
      expect(res.success).toBe(true);
      expect(res.eventDispatched).toBe(true);
      expect(res.eventType).toBe('submit');
      expect(submitFired).toBe(true);
    });

    it('refuses to dispatch change on static paragraph', () => {
      const p = document.getElementById('static-p')!;
      const res = dispatchDOMActivation(p, { eventType: 'change', bubbles: true, cancelable: false }, window);
      expect(res.success).toBe(false);
      expect(res.eventDispatched).toBe(false);
      expect(res.reason).toContain('does not possess mutable value or state');
    });
  });

  describe('Part 3: Transition Signature & Machine Integration', () => {
    it('populates transitionSignature.activationEventExpected with declared event type (keydown)', async () => {
      const machine = new IntentNavMachine();

      const keydownCap: FunctionalCapabilityFingerprint = {
        capabilityId: 'CAP_KEYBOARD_TOGGLE',
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        mandatoryPreStatePredicates: [],
        allowedStateDelta: [
          { property: 'notifications_enabled', expectedChange: 'ENABLED_TO_DISABLED' },
        ],
        expectedPostState: [
          { property: 'notifications_enabled', expectedValue: false },
        ],
        requiredContextPredicates: [],
        forbiddenContextPredicates: [],
        semanticEvidence: {
          canonicalLabel: 'Disable Notifications',
          semanticSynonyms: ['turn off notifications', 'turn off promotional emails'],
          accessibleName: 'Disable Notifications',
          role: 'switch',
          visibleLabel: 'Disable Notifications',
          sectionMeaning: 'Notifications',
          actionDescription: 'Toggle notifications via space',
        },
        contextEvidence: {
          ancestorRelationships: [],
          nearbyText: [],
          surroundingLabels: [],
          containerSemantics: ['notifications'],
          menuPanelRelationships: [],
          relativeStructuralRelationships: [],
        },
        transitionEvidence: {
          preStateFingerprint: 'PRE_HASH_1',
          activationEventCharacteristics: {
            eventType: 'keydown',
            bubbles: true,
            cancelable: true,
            key: ' ',
            code: 'Space',
            keyCode: 32,
          },
          expectedDelta: { notifications_enabled: false },
          postStateFingerprint: 'POST_HASH_2',
          historicalTransitionObservations: 5,
          witnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
          verificationWindowMs: 1500,
        },
        riskMetadata: {
          riskClass: 'REVERSIBLE',
          reversible: true,
          financial: false,
          security: false,
          destructive: false,
          requiresConfirmation: false,
        },
        provenance: {
          source: 'INITIAL_SPEC',
          creationTimestamp: Date.now(),
          validationTimestamp: Date.now(),
          routeVersion: 'v1.0.0',
          validationHistory: [],
        },
        confidence: { capabilityConfidence: 0.98, routeConfidence: 0.95 },
        negativeEvidence: {
          rejectedCandidateIdentities: [],
          contradictionPredicates: [],
          failedInvariantPredicates: [],
          failedTransitionWitnesses: [],
          decoyRelationships: [],
          rejectionReasons: [],
        },
      };

      machine.registerCapability(keydownCap);

      const btn = document.getElementById('btn-toggle')!;
      let receivedDispatchedType = '';
      let lastActId = '';
      let actTime = 0;

      const dispatcher: ExecutionDispatcher = {
        async dispatchActivation(actId, candidate, capId, actCharacteristics) {
          lastActId = actId;
          actTime = Date.now();
          receivedDispatchedType = actCharacteristics?.eventType || 'unknown';
          const dispatchRes = dispatchDOMActivation(btn, actCharacteristics, window);
          return {
            success: dispatchRes.success,
            elementFound: true,
            eventDispatched: dispatchRes.eventDispatched,
            activationEvent: {
              eventId: actId,
              sequenceNumber: 1,
              timestamp: actTime,
              targetCandidateId: candidate.candidateId,
              eventType: dispatchRes.eventType,
              initiatingCapabilityId: capId,
              key: actCharacteristics?.key,
              code: actCharacteristics?.code,
            },
          };
        },
        async collectWitnesses() {
          const now = actTime + 10;
          return [
            {
              witnessId: 'wit_1',
              witnessClass: 'DOM_MUTATION',
              sequenceNumber: 1,
              timestamp: now,
              observedDelta: { notifications_enabled: false },
              correlatedActivationEventId: lastActId,
              temporalDeltaMs: 10,
              isCausallyCorrelated: true,
              correlationExplanation: 'DOM mutation observed',
            },
            {
              witnessId: 'wit_2',
              witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
              sequenceNumber: 2,
              timestamp: now + 5,
              observedDelta: { notifications_enabled: false },
              correlatedActivationEventId: lastActId,
              temporalDeltaMs: 15,
              isCausallyCorrelated: true,
              correlationExplanation: 'A11y state mutation observed',
            },
          ];
        },
      };

      const candidate: CandidateEvaluationContext = {
        candidateId: 'btn-toggle',
        candidateLabel: 'Disable Notifications',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'MARKETING_NOTIFICATIONS',
        observedRole: 'switch',
        bindingHandle: {
          handleId: 'btn-toggle',
          tagName: 'button',
          role: 'switch',
          accessibleName: 'Disable Notifications',
          domStructuralPath: 'button#btn-toggle',
          elementIndex: 0,
        },
        containerSemantics: ['notifications'],
        observedState: { notifications_enabled: true },
      };

      const ctx = await machine.processIntent(
        'turn off notifications',
        { tag: 'button', observedPreState: candidate.observedState },
        [candidate],
        false,
        dispatcher
      );

      // Verify dispatcher received 'keydown'
      expect(receivedDispatchedType).toBe('keydown');

      // Verify activationEvent in context has 'keydown'
      expect(ctx.activationEvent?.eventType).toBe('keydown');
      expect(ctx.activationEvent?.key).toBe(' ');

      // Verify causal verification result signature has 'keydown'
      expect(ctx.verificationResult?.signature.activationEventExpected.eventType).toBe('keydown');
      expect(ctx.verificationResult?.signature.activationEventExpected.key).toBe(' ');

      // Verify machine executed successfully
      expect(ctx.currentState).toBe('EXECUTED');
    });
  });

  describe('Part 4: Causal Verifier Event Type Gating', () => {
    it('fails causal verification if dispatched event type mismatches expected signature event type', () => {
      const verifier = new CausalTransitionVerifier();

      const signature: TransitionSignature = {
        preStateFingerprint: 'PRE_HASH',
        activationEventExpected: { eventType: 'keydown', key: 'Enter' },
        expectedStateDelta: { submitted: true },
        verificationWindowMs: 1500,
        postStateFingerprint: 'POST_HASH',
      };

      // Dispatched event was 'click' instead of 'keydown'
      const mismatchedEvent: ActivationEventRecord = {
        eventId: 'act_001',
        sequenceNumber: 1,
        timestamp: 1000,
        targetCandidateId: 'btn_1',
        eventType: 'click', // MISMATCH!
        initiatingCapabilityId: 'CAP_TEST',
      };

      const witnesses = [
        {
          witnessId: 'w1',
          witnessClass: 'DOM_MUTATION' as const,
          sequenceNumber: 1,
          timestamp: 1050,
          observedDelta: { submitted: true },
          correlatedActivationEventId: 'act_001',
          temporalDeltaMs: 50,
          isCausallyCorrelated: true,
          correlationExplanation: 'DOM delta',
        },
        {
          witnessId: 'w2',
          witnessClass: 'ACCESSIBILITY_STATE_MUTATION' as const,
          sequenceNumber: 2,
          timestamp: 1060,
          observedDelta: { submitted: true },
          correlatedActivationEventId: 'act_001',
          temporalDeltaMs: 60,
          isCausallyCorrelated: true,
          correlationExplanation: 'A11y delta',
        },
      ];

      const result = verifier.verifyTransition(signature, mismatchedEvent, witnesses, 'POST_HASH');
      expect(result.causallyVerified).toBe(false);
      expect(result.status).toBe('FAILED_WRONG_STATE_DELTA');
      expect(result.failureReason).toBe('invalid_transition');
      expect(result.explanation).toContain("does not match expected signature event type 'keydown'");
    });
  });
});
