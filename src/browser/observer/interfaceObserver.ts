/**
 * IntentNav-SCFR: Browser-Side Interface Observer
 * Extracts normalized interface states, accessible properties, semantic landmarks, and debounced mutations
 * Strips data-capability-id dependency completely.
 */

import { InterfaceStateNode } from '../../types/state';
import { VolatileFeatureSuppressor } from '../../core/fingerprint/suppressor';
import { BindingHandle } from '../../types/capability';

export class InterfaceObserver {
  private mutationObserver: MutationObserver | null = null;
  private mutationDebounceTimer: number | null = null;
  private lastObservedState: InterfaceStateNode | null = null;

  /**
   * Captures the current interface state snapshot from the active DOM document
   */
  public captureInterfaceState(): InterfaceStateNode {
    const stateId = `state_${Date.now()}`;
    const urlPattern = typeof window !== 'undefined' ? window.location.pathname : '/';

    // Extract active dialogs/modals
    const activeModalsOrDialogs: string[] = [];
    const dialogs = document.querySelectorAll(
      'dialog[open], [role="dialog"], [role="alertdialog"], .modal.is-active, .modal.show'
    );
    dialogs.forEach((d) => {
      const label = d.getAttribute('aria-label') || d.getAttribute('title') || 'modal_dialog';
      activeModalsOrDialogs.push(label);
    });

    // Extract active tabs
    const activeTabs: string[] = [];
    const tabs = document.querySelectorAll('[role="tab"][aria-selected="true"], .tab.active, .tab.is-active');
    tabs.forEach((t) => {
      const label = t.getAttribute('aria-label') || (t.textContent || '').trim();
      activeTabs.push(label);
    });

    // Extract semantic landmarks
    const semanticLandmarks: string[] = [];
    const landmarks = document.querySelectorAll(
      'main, nav, header, footer, aside, section, form, [role="main"], [role="navigation"]'
    );
    landmarks.forEach((l) => {
      const role = l.getAttribute('role') || l.tagName.toLowerCase();
      const label = l.getAttribute('aria-label') || '';
      semanticLandmarks.push(`${role}${label ? `[${label}]` : ''}`);
    });

    // Compute structural hash without volatile IDs or CSS classes
    const bodyChildren = Array.from(document.body.children);
    const tagHierarchy = bodyChildren.map((c) => VolatileFeatureSuppressor.computeRelativePath(c)).join('|');
    const domStructuralHash = `hash_${this.simpleHash(tagHierarchy)}`;

    // Collect exposed candidate handles without data-capability-id
    const exposedCandidateHandles: BindingHandle[] = [];
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, [role="button"], [role="link"], [role="switch"], [role="menuitem"], [role="tab"]'
    );
    interactiveElements.forEach((el, index) => {
      const suppression = VolatileFeatureSuppressor.suppressVolatileFeatures(el);
      const label =
        el.getAttribute('aria-label') ||
        el.getAttribute('title') ||
        suppression.cleanedText ||
        el.getAttribute('name') ||
        `element_${index}`;
      const role = el.getAttribute('role') || el.tagName.toLowerCase();

      exposedCandidateHandles.push({
        handleId: `handle_${index}`,
        tagName: el.tagName.toLowerCase(),
        role,
        accessibleName: label,
        domStructuralPath: suppression.relativeStructuralPath,
        elementIndex: index,
        volatileId: el.id || undefined,
        volatileClasses: el.className && typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean) : undefined,
      });
    });

    let observedApplicationState: Record<string, unknown> | undefined;
    if (typeof document !== 'undefined') {
      const appStateEl = document.getElementById('neg-app-state') || document.getElementById('app-state');
      if (appStateEl && appStateEl.getAttribute('data-state')) {
        try {
          observedApplicationState = JSON.parse(appStateEl.getAttribute('data-state')!);
        } catch {}
      }
    }
    if (!observedApplicationState && typeof window !== 'undefined' && (window as any).IntentNavMockState) {
      observedApplicationState = { ...(window as any).IntentNavMockState };
    }

    const node: InterfaceStateNode = {
      stateId,
      stateType: activeModalsOrDialogs.length > 0 ? 'MODAL' : 'PAGE',
      urlPattern,
      domStructuralHash,
      semanticLandmarks,
      activeModalsOrDialogs,
      activeTabs,
      exposedCandidateHandles,
      observedApplicationState,
      timestamp: Date.now(),
    };

    this.lastObservedState = node;
    return node;
  }

  /**
   * Starts observing DOM mutations with debouncing and detailed mutation tracking
   */
  public observeMutations(
    onMutation: (mutations?: MutationRecord[]) => void,
    debounceMs: number = 100
  ): void {
    if (typeof MutationObserver === 'undefined') return;

    let accumulatedMutations: MutationRecord[] = [];

    this.mutationObserver = new MutationObserver((mutations) => {
      accumulatedMutations.push(...mutations);
      if (this.mutationDebounceTimer !== null) {
        clearTimeout(this.mutationDebounceTimer);
      }
      this.mutationDebounceTimer = window.setTimeout(() => {
        const batch = [...accumulatedMutations];
        accumulatedMutations = [];
        onMutation(batch);
      }, debounceMs);
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'aria-expanded', 'aria-checked', 'disabled', 'open'],
      characterData: true,
    });
  }

  public disconnect(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    if (this.mutationDebounceTimer !== null) {
      clearTimeout(this.mutationDebounceTimer);
      this.mutationDebounceTimer = null;
    }
  }

  public getLastObservedState(): InterfaceStateNode | null {
    return this.lastObservedState;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }
}
