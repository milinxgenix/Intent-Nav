/**
 * IntentNav-SCFR: Mutation DOM Generator
 * Phase 3, Step 13 Implementation
 *
 * Deterministically applies controlled mutations to standard base DOM environments
 * (e.g. Mock Site A) in JSDOM, extracting candidate contexts without leaking
 * ground-truth target expectations to the candidates or the runtime engine.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
import { CandidateGenerator } from '../../src/core/candidate/generator';
import { CandidateEvaluationContext } from '../../src/core/invariant/engine';
import { MutationDescriptor } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MutatedDOMEnvironment {
  window: any;
  document: Document;
  dom: JSDOM;
  candidates: CandidateEvaluationContext[];
  cleanup: () => void;
  transitionHook?: (event: Event) => void;
}

function getMockSitesDir(): string {
  let curr = process.cwd();
  if (fs.existsSync(path.join(curr, 'mock-sites'))) return path.join(curr, 'mock-sites');
  curr = path.resolve(__dirname, '../../mock-sites');
  if (fs.existsSync(curr)) return curr;
  curr = path.resolve(__dirname, '../mock-sites');
  if (fs.existsSync(curr)) return curr;
  return path.resolve(process.cwd(), 'mock-sites');
}

export class MutationDOMGenerator {
  /**
   * Builds an isolated, fresh DOM environment and applies the specified mutation descriptor.
   */
  public static createMutatedEnvironment(mutation: MutationDescriptor): MutatedDOMEnvironment {
    const siteDir = mutation.baseSite.replace('Site', 'site-').toLowerCase();
    const mockSitesDir = getMockSitesDir();
    const htmlPath = path.resolve(mockSitesDir, `${siteDir}/index.html`);
    const html = fs.readFileSync(htmlPath, 'utf8');

    const dom = new JSDOM(html, {
      runScripts: 'dangerously',
      url: `http://localhost:3000/mock-sites/${siteDir}/index.html`,
    });
    const win = dom.window as any;
    const doc = win.document as Document;

    // Execute mock site application logic
    const jsPath = path.resolve(mockSitesDir, `${siteDir}/app.js`);
    if (fs.existsSync(jsPath)) {
      const js = fs.readFileSync(jsPath, 'utf8');
      win.eval(js);
    }

    // Apply the mutation configuration to the live DOM
    MutationDOMGenerator.applyMutation(doc, win, mutation);

    // Generate candidates from observable DOM semantics strictly without ground-truth leakage
    const observedAppState = win.IntentNavMockState ? { ...win.IntentNavMockState } : undefined;
    const candidates = CandidateGenerator.generateFromDOM(doc, observedAppState);

    const cleanup = () => {
      try {
        win.close();
      } catch {}
    };

    return {
      window: win,
      document: doc,
      dom,
      candidates,
      cleanup,
    };
  }

  /**
   * Applies the mutation transforms deterministically to the DOM and mock state.
   */
  private static applyMutation(doc: Document, win: any, mutation: MutationDescriptor): void {
    const originalEl = doc.getElementById(mutation.originalTargetId);
    const config = mutation.mutationConfig;

    // 1. Identifier Mutation
    if (config.idMutation && originalEl) {
      const newId = config.idMutation.newId;
      originalEl.id = newId;
    }

    // 2. Structural Mutation
    if (config.structuralMutation && originalEl) {
      const struct = config.structuralMutation;

      // Wrap in additional container layers
      if (struct.wrapperClasses && struct.wrapperClasses.length > 0) {
        for (const cls of struct.wrapperClasses) {
          const parent = originalEl.parentElement;
          if (parent) {
            const wrapper = doc.createElement(struct.wrapperTag || 'div');
            wrapper.className = cls;
            parent.insertBefore(wrapper, originalEl);
            wrapper.appendChild(originalEl);
          }
        }
      }

      // Prepend sibling decoy button
      if (struct.prependDecoySibling && originalEl.parentElement) {
        const decoy = doc.createElement('button');
        decoy.id = struct.decoyId || 'btn-decoy-sibling';
        decoy.setAttribute('role', 'button');
        decoy.textContent = struct.decoyLabel || 'Notice: promotional marketing info';
        originalEl.parentElement.insertBefore(decoy, originalEl);
      }
    }

    // 3. Presentation Mutation
    if (config.presentationMutation && originalEl) {
      const pres = config.presentationMutation;
      if (pres.newLabel) {
        originalEl.textContent = pres.newLabel;
      }
      if (pres.ariaLabelOverride) {
        originalEl.setAttribute('aria-label', pres.ariaLabelOverride);
      }
      if (pres.newClasses && pres.newClasses.length > 0) {
        originalEl.className = pres.newClasses.join(' ');
      }
      if (pres.roleOverride) {
        originalEl.setAttribute('role', pres.roleOverride);
      }
    }

    // 4. State Mutation
    if (config.stateMutation) {
      const st = config.stateMutation;
      if (st.initialAppState && win.IntentNavMockState) {
        Object.assign(win.IntentNavMockState, st.initialAppState);
        const stateEl = doc.getElementById('app-state');
        if (stateEl) {
          stateEl.setAttribute('data-state', JSON.stringify(win.IntentNavMockState));
        }
      }
      if (originalEl && st.initialAriaChecked !== undefined) {
        originalEl.setAttribute('aria-checked', st.initialAriaChecked);
      }
      if (originalEl && st.disabled) {
        (originalEl as any).disabled = true;
        originalEl.setAttribute('disabled', 'true');
        originalEl.setAttribute('aria-disabled', 'true');
        // Prevent default click handler
        originalEl.addEventListener(
          'click',
          (e: Event) => {
            e.stopImmediatePropagation();
            e.preventDefault();
          },
          true
        );
      }
      if (originalEl && st.insideClosedModal) {
        const modalContainer = doc.createElement('div');
        modalContainer.setAttribute('role', 'dialog');
        modalContainer.setAttribute('aria-hidden', 'true');
        modalContainer.style.display = 'none';

        const parent = originalEl.parentElement;
        if (parent) {
          parent.insertBefore(modalContainer, originalEl);
          modalContainer.appendChild(originalEl);
        }
      }
    }

    // 5. Transition Mutation
    if (config.transitionMutation && originalEl) {
      const trans = config.transitionMutation;
      if (trans.outcome === 'REJECTED') {
        // Intercept click and throw/prevent state mutation
        originalEl.addEventListener(
          'click',
          (e: Event) => {
            e.stopImmediatePropagation();
            // Do NOT mutate IntentNavMockState
            if (win.IntentNavMockState) {
              // Ensure marketing remains true (failed operation)
              win.IntentNavMockState.marketing_notifications_enabled = true;
              win.IntentNavMockState.marketing_emails_enabled = true;
            }
          },
          true
        );
      } else if (trans.outcome === 'UNCORRELATED_DELTA') {
        // Mutate wrong property instead of intended property
        originalEl.addEventListener(
          'click',
          (e: Event) => {
            e.stopImmediatePropagation();
            if (win.IntentNavMockState) {
              // Intended property is NOT mutated
              win.IntentNavMockState.marketing_notifications_enabled = true;
              win.IntentNavMockState.marketing_emails_enabled = true;
              // An unrelated property is mutated
              if (trans.mutatedProperty) {
                win.IntentNavMockState[trans.mutatedProperty] = trans.mutatedValue ?? false;
              }
            }
          },
          true
        );
      }
    }
  }
}
