"use strict";
(() => {
  // src/core/fingerprint/suppressor.ts
  var VOLATILE_ID_PATTERNS = [
    /^react-aria-/,
    /^ember\d+/,
    /^_ngcontent-/,
    /^vue-/,
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
    // UUID
    /^[a-f0-9]{16,}$/i,
    // Long hex hashes
    /^gen_\d+/,
    /^dyn-id-/,
    /:r[0-9a-z]+:/i,
    // React 18 useId format: :r1:, :r2:
    /-\d{5,}$/
    // Ending in random numbers
  ];
  var VOLATILE_CLASS_PATTERNS = [
    /^css-[a-z0-9]+/i,
    // Emotion / styled
    /^sc-[a-zA-Z0-9]+/i,
    // styled-components
    /^jsx-[0-9]+/i,
    // styled-jsx
    /^_[a-z0-9]{5,}$/i,
    // CSS modules random hash
    /^(p|m|px|py|pt|pb|pl|pr|w|h|text|bg|border|flex|grid|col|row|gap)-/i,
    // Tailwind / utility CSS
    /^(items|justify|content|self)-/i,
    // Flex alignment utilities
    /^(flex|grid|block|inline|hidden|relative|absolute|fixed)$/i,
    // Layout utilities
    /^[a-z]-\d+/i,
    // Atomic shorthand: x-19, y-20
    /^(hover:|focus:|active:|disabled:|dark:)/i,
    // Pseudo-class utilities
    /^(is-|has-)/i
    // State toggles
  ];
  var VolatileFeatureSuppressor = class {
    /**
     * Checks if a DOM ID is volatile/transient
     */
    static isVolatileId(id) {
      if (!id || typeof id !== "string") return true;
      const trimmed = id.trim();
      if (trimmed.length === 0) return true;
      return VOLATILE_ID_PATTERNS.some((pattern) => pattern.test(trimmed));
    }
    /**
     * Cleans CSS class string, removing styling and transient utility classes
     */
    static sanitizeClasses(classString) {
      if (!classString || typeof classString !== "string") return [];
      const classes = classString.split(/\s+/).filter(Boolean);
      return classes.filter((cls) => {
        return !VOLATILE_CLASS_PATTERNS.some((pattern) => pattern.test(cls));
      });
    }
    /**
     * Computes a stable relative structural path rather than absolute coordinates
     */
    static computeRelativePath(element) {
      const segments = [];
      let curr = element;
      let depth = 0;
      while (curr && curr.tagName.toLowerCase() !== "body" && depth < 6) {
        const tag = curr.tagName.toLowerCase();
        const role = curr.getAttribute("role");
        const ariaLabel = curr.getAttribute("aria-label");
        const testId = curr.getAttribute("data-testid") || curr.getAttribute("data-capability");
        let descriptor = tag;
        if (testId) {
          descriptor += `[data-key="${testId}"]`;
        } else if (role) {
          descriptor += `[role="${role}"]`;
        } else if (ariaLabel) {
          descriptor += `[aria-label="${ariaLabel.slice(0, 20)}"]`;
        }
        let siblingIndex = 1;
        let prev = curr.previousElementSibling;
        while (prev) {
          if (prev.tagName.toLowerCase() === tag) {
            siblingIndex++;
          }
          prev = prev.previousElementSibling;
        }
        descriptor += `:nth-of-type(${siblingIndex})`;
        segments.unshift(descriptor);
        curr = curr.parentElement;
        depth++;
      }
      return segments.join(" > ");
    }
    /**
     * Evaluates and suppresses an element's features, returning normalized invariant properties
     */
    static suppressVolatileFeatures(element) {
      const rawId = element.getAttribute("id") || "";
      const rawClass = element.getAttribute("class") || "";
      const role = element.getAttribute("role") || element.tagName.toLowerCase();
      const visibleText = (element.textContent || "").trim().replace(/\s+/g, " ");
      const isSuppressedId = this.isVolatileId(rawId);
      const sanitizedClasses = this.sanitizeClasses(rawClass);
      const relativePath = this.computeRelativePath(element);
      const sanitizedAttributes = {};
      if (!isSuppressedId && rawId.length > 0) {
        sanitizedAttributes["id"] = rawId;
      }
      if (sanitizedClasses.length > 0) {
        sanitizedAttributes["semantic-class"] = sanitizedClasses.join(" ");
      }
      const ariaRole = element.getAttribute("role");
      if (ariaRole) sanitizedAttributes["role"] = ariaRole;
      const ariaLabel = element.getAttribute("aria-label");
      if (ariaLabel) sanitizedAttributes["aria-label"] = ariaLabel;
      const ariaExpanded = element.getAttribute("aria-expanded");
      if (ariaExpanded !== null) sanitizedAttributes["aria-expanded"] = ariaExpanded;
      const ariaChecked = element.getAttribute("aria-checked");
      if (ariaChecked !== null) sanitizedAttributes["aria-checked"] = ariaChecked;
      return {
        cleanedText: visibleText,
        cleanedRole: role,
        sanitizedAttributes,
        isSuppressedId,
        isSuppressedClass: sanitizedClasses.length === 0 && rawClass.length > 0,
        relativeStructuralPath: relativePath,
        featureWeights: {
          functionalRoleWeight: 0.95,
          canonicalSemanticWeight: 0.9,
          relativeHierarchyWeight: 0.7,
          attributeWeight: 0.4,
          presentationWeight: 0.02
          // Extremely low weight for presentation / IDs / CSS
        }
      };
    }
  };

  // src/browser/observer/interfaceObserver.ts
  var InterfaceObserver = class {
    mutationObserver = null;
    mutationDebounceTimer = null;
    lastObservedState = null;
    /**
     * Captures the current interface state snapshot from the active DOM document
     */
    captureInterfaceState() {
      const stateId = `state_${Date.now()}`;
      const urlPattern = typeof window !== "undefined" ? window.location.pathname : "/";
      const activeModalsOrDialogs = [];
      const dialogs = document.querySelectorAll(
        'dialog[open], [role="dialog"], [role="alertdialog"], .modal.is-active, .modal.show'
      );
      dialogs.forEach((d) => {
        const label = d.getAttribute("aria-label") || d.getAttribute("title") || "modal_dialog";
        activeModalsOrDialogs.push(label);
      });
      const activeTabs = [];
      const tabs = document.querySelectorAll('[role="tab"][aria-selected="true"], .tab.active, .tab.is-active');
      tabs.forEach((t) => {
        const label = t.getAttribute("aria-label") || (t.textContent || "").trim();
        activeTabs.push(label);
      });
      const semanticLandmarks = [];
      const landmarks = document.querySelectorAll(
        'main, nav, header, footer, aside, section, form, [role="main"], [role="navigation"]'
      );
      landmarks.forEach((l) => {
        const role = l.getAttribute("role") || l.tagName.toLowerCase();
        const label = l.getAttribute("aria-label") || "";
        semanticLandmarks.push(`${role}${label ? `[${label}]` : ""}`);
      });
      const bodyChildren = Array.from(document.body.children);
      const tagHierarchy = bodyChildren.map((c) => VolatileFeatureSuppressor.computeRelativePath(c)).join("|");
      const domStructuralHash = `hash_${this.simpleHash(tagHierarchy)}`;
      const exposedCandidateHandles = [];
      const interactiveElements = document.querySelectorAll(
        'button, a, input, select, [role="button"], [role="link"], [role="switch"], [role="menuitem"], [role="tab"]'
      );
      interactiveElements.forEach((el, index) => {
        const suppression = VolatileFeatureSuppressor.suppressVolatileFeatures(el);
        const label = el.getAttribute("aria-label") || el.getAttribute("title") || suppression.cleanedText || el.getAttribute("name") || `element_${index}`;
        const role = el.getAttribute("role") || el.tagName.toLowerCase();
        exposedCandidateHandles.push({
          handleId: `handle_${index}`,
          tagName: el.tagName.toLowerCase(),
          role,
          accessibleName: label,
          domStructuralPath: suppression.relativeStructuralPath,
          elementIndex: index,
          volatileId: el.id || void 0,
          volatileClasses: el.className && typeof el.className === "string" ? el.className.split(/\s+/).filter(Boolean) : void 0
        });
      });
      let observedApplicationState;
      if (typeof document !== "undefined") {
        const appStateEl = document.getElementById("neg-app-state") || document.getElementById("app-state");
        if (appStateEl && appStateEl.getAttribute("data-state")) {
          try {
            observedApplicationState = JSON.parse(appStateEl.getAttribute("data-state"));
          } catch {
          }
        }
      }
      if (!observedApplicationState && typeof window !== "undefined" && window.IntentNavMockState) {
        observedApplicationState = { ...window.IntentNavMockState };
      }
      const node = {
        stateId,
        stateType: activeModalsOrDialogs.length > 0 ? "MODAL" : "PAGE",
        urlPattern,
        domStructuralHash,
        semanticLandmarks,
        activeModalsOrDialogs,
        activeTabs,
        exposedCandidateHandles,
        observedApplicationState,
        timestamp: Date.now()
      };
      this.lastObservedState = node;
      return node;
    }
    /**
     * Starts observing DOM mutations with debouncing and detailed mutation tracking
     */
    observeMutations(onMutation, debounceMs = 100) {
      if (typeof MutationObserver === "undefined") return;
      let accumulatedMutations = [];
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
        attributeFilter: ["class", "style", "aria-expanded", "aria-checked", "disabled", "open"],
        characterData: true
      });
    }
    disconnect() {
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }
      if (this.mutationDebounceTimer !== null) {
        clearTimeout(this.mutationDebounceTimer);
        this.mutationDebounceTimer = null;
      }
    }
    getLastObservedState() {
      return this.lastObservedState;
    }
    simpleHash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash).toString(36);
    }
  };

  // src/core/fingerprint/constructor.ts
  var FingerprintConstructor = class {
    /**
     * Generates a deterministic hash from functional evidence only.
     * Volatile presentation features (labels, IDs, classes, coordinates) are strictly excluded.
     */
    static computeFingerprintHash(fingerprint) {
      const parts = [
        fingerprint.canonicalFunction.trim().toLowerCase(),
        fingerprint.actionType.trim().toUpperCase(),
        fingerprint.targetEntity.trim().toUpperCase(),
        fingerprint.role.trim().toLowerCase()
      ];
      if (fingerprint.riskClass) {
        parts.push(`risk:${fingerprint.riskClass.trim().toUpperCase()}`);
      }
      if (fingerprint.mandatoryPreStatePredicates && fingerprint.mandatoryPreStatePredicates.length > 0) {
        const preds = fingerprint.mandatoryPreStatePredicates.map((p) => (p.id || p.name || "").trim()).filter(Boolean).sort();
        if (preds.length > 0) {
          parts.push(`pre:${preds.join(",")}`);
        }
      }
      if (fingerprint.allowedStateDelta && fingerprint.allowedStateDelta.length > 0) {
        const deltas = fingerprint.allowedStateDelta.map((d) => `${d.property}:${d.expectedChange || ""}`.trim()).sort();
        if (deltas.length > 0) {
          parts.push(`delta:${deltas.join(",")}`);
        }
      }
      if (fingerprint.expectedPostState && fingerprint.expectedPostState.length > 0) {
        const post = fingerprint.expectedPostState.map((p) => `${p.property}:${String(p.expectedValue)}`.trim()).sort();
        if (post.length > 0) {
          parts.push(`post:${post.join(",")}`);
        }
      }
      if (fingerprint.requiredContextPredicates && fingerprint.requiredContextPredicates.length > 0) {
        const reqCtx = fingerprint.requiredContextPredicates.map((c) => `${c.target || ""}:${c.pattern || ""}`.trim()).sort();
        if (reqCtx.length > 0) {
          parts.push(`reqCtx:${reqCtx.join(",")}`);
        }
      }
      if (fingerprint.forbiddenContextPredicates && fingerprint.forbiddenContextPredicates.length > 0) {
        const forbCtx = fingerprint.forbiddenContextPredicates.map((c) => `${c.target || ""}:${c.pattern || ""}`.trim()).sort();
        if (forbCtx.length > 0) {
          parts.push(`forbCtx:${forbCtx.join(",")}`);
        }
      }
      const raw = parts.join("|");
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
    static fromElement(element, options) {
      const suppression = VolatileFeatureSuppressor.suppressVolatileFeatures(element);
      const ancestorRelationships = [];
      const containerSemantics = [];
      let parent = element.parentElement;
      let depth = 0;
      while (parent && depth < 4) {
        const parentRole = parent.getAttribute("role") || parent.tagName.toLowerCase();
        const parentLabel = parent.getAttribute("aria-label") || "";
        ancestorRelationships.push(`${parentRole}${parentLabel ? `[${parentLabel}]` : ""}`);
        if (["section", "nav", "main", "form", "dialog", "aside"].includes(parent.tagName.toLowerCase()) || parentRole) {
          containerSemantics.push(parentRole);
        }
        parent = parent.parentElement;
        depth++;
      }
      const nearbyText = [];
      const prev = element.previousElementSibling;
      if (prev && prev.textContent) nearbyText.push(prev.textContent.trim().slice(0, 100));
      const next = element.nextElementSibling;
      if (next && next.textContent) nearbyText.push(next.textContent.trim().slice(0, 100));
      const accessibleName = element.getAttribute("aria-label") || element.getAttribute("aria-labelledby") || element.getAttribute("title") || element.getAttribute("placeholder") || suppression.cleanedText || "";
      const visibleLabel = suppression.cleanedText;
      const role = element.getAttribute("role") || element.tagName.toLowerCase();
      const riskClass = options.riskClass || (options.actionType === "DELETE" || options.actionType === "DEACTIVATE_ACCOUNT" ? "DESTRUCTIVE" : options.actionType === "REVOKE_ACCESS" || options.actionType === "AUTHENTICATE" ? "SECURITY_SENSITIVE" : options.actionType === "MODIFY_PREFERENCE" || options.actionType === "TOGGLE" ? "REVERSIBLE" : "READ_ONLY");
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
        forbiddenContextPredicates: options.forbiddenContextPredicates
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
          sectionMeaning: containerSemantics.join(" > "),
          actionDescription: `${options.actionType} on ${options.targetEntity}`
        },
        contextEvidence: {
          ancestorRelationships,
          nearbyText,
          surroundingLabels: nearbyText,
          containerSemantics,
          menuPanelRelationships: containerSemantics,
          relativeStructuralRelationships: [suppression.relativeStructuralPath],
          urlSemantics: options.urlSemantics || (typeof window !== "undefined" ? window.location.pathname : "")
        },
        transitionEvidence: {
          preStateFingerprint: "STATE_PRE_INITIAL",
          activationEventCharacteristics: {
            eventType: "click",
            bubbles: true,
            cancelable: true
          },
          expectedDelta: {},
          postStateFingerprint: "STATE_POST_EXPECTED",
          historicalTransitionObservations: 0,
          witnessClasses: ["DOM_MUTATION", "ACCESSIBILITY_STATE_MUTATION"],
          verificationWindowMs: 1500
        },
        riskMetadata: {
          riskClass,
          reversible: riskClass === "READ_ONLY" || riskClass === "REVERSIBLE",
          financial: riskClass === "FINANCIAL",
          security: riskClass === "SECURITY_SENSITIVE",
          destructive: riskClass === "DESTRUCTIVE" || riskClass === "IRREVERSIBLE",
          requiresConfirmation: ["SECURITY_SENSITIVE", "DESTRUCTIVE", "FINANCIAL", "IRREVERSIBLE"].includes(riskClass)
        },
        provenance: {
          source: "DISCOVERED",
          creationTimestamp: Date.now(),
          validationTimestamp: 0,
          routeVersion: "v1.0.0",
          validationHistory: []
        },
        confidence: {
          capabilityConfidence: 0.85,
          routeConfidence: 0.7
        },
        negativeEvidence: {
          rejectedCandidateIdentities: [],
          contradictionPredicates: [],
          failedInvariantPredicates: [],
          failedTransitionWitnesses: [],
          decoyRelationships: [],
          rejectionReasons: []
        }
      };
    }
  };

  // src/core/candidate/generator.ts
  var CandidateGenerator = class {
    static simpleHash(str) {
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
    static generateFromDOM(container) {
      const candidates = [];
      const selector = 'button, a, input, select, [role="button"], [role="link"], [role="switch"], [role="menuitem"], [role="tab"]';
      const elements = Array.from(container.querySelectorAll(selector));
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const inputType = (el.getAttribute("type") || "").toLowerCase();
        const autocomplete = (el.getAttribute("autocomplete") || "").toLowerCase();
        if (inputType === "password" || autocomplete.includes("password") || autocomplete.includes("cc-") || autocomplete.includes("credit-card") || autocomplete.includes("one-time-code")) {
          continue;
        }
        const suppression = VolatileFeatureSuppressor.suppressVolatileFeatures(el);
        const accessibleName = el.getAttribute("aria-label") || el.getAttribute("title") || suppression.cleanedText || el.getAttribute("name") || el.placeholder || `element_${i}`;
        const role = el.getAttribute("role") || el.tagName.toLowerCase();
        const nearbyTexts = [];
        const parentEl = el.parentElement;
        if (parentEl) {
          const textElements = parentEl.querySelectorAll("p, span, strong, label, h1, h2, h3, h4");
          textElements.forEach((t) => {
            if (t !== el) {
              const text = (t.textContent || "").trim().replace(/\s+/g, " ");
              if (text.length > 0 && text.length < 150) {
                nearbyTexts.push(text);
              }
            }
          });
        }
        const containerSemantics = [];
        const ancestorDescriptions = [];
        let currentParent = el.parentElement;
        let depth = 0;
        while (currentParent && currentParent.tagName.toLowerCase() !== "body" && depth < 6) {
          const pTag = currentParent.tagName.toLowerCase();
          const pRole = currentParent.getAttribute("role") || pTag;
          const pLabel = currentParent.getAttribute("aria-label") || "";
          const heading = currentParent.querySelector("h1, h2, h3, h4");
          const headingText = heading ? (heading.textContent || "").trim() : "";
          if (["section", "nav", "main", "form", "dialog", "aside", "header"].includes(pTag) || currentParent.getAttribute("role")) {
            containerSemantics.push(pRole);
            if (pLabel) containerSemantics.push(pLabel.toLowerCase());
            if (headingText) containerSemantics.push(headingText.toLowerCase());
          }
          ancestorDescriptions.push(`${pRole}${pLabel ? `[${pLabel}]` : ""}`);
          currentParent = currentParent.parentElement;
          depth++;
        }
        const combinedContext = `${accessibleName} ${nearbyTexts.join(" ")} ${containerSemantics.join(" ")}`.toLowerCase();
        let observedActionType = "VIEW";
        const isSwitch = role === "switch" || el.getAttribute("type") === "checkbox";
        const isButton = role === "button" || el.tagName.toLowerCase() === "button";
        const isLink = role === "link" || el.tagName.toLowerCase() === "a";
        if (isSwitch) {
          observedActionType = "MODIFY_PREFERENCE";
        } else if (isButton) {
          if (/delete|remove|erase|purge|destroy|wipe/i.test(accessibleName) && !/2fa|two[-\s]*factor|mfa/i.test(accessibleName)) {
            observedActionType = "DELETE";
          } else if (/export|download|archive|receipt|invoice/i.test(accessibleName)) {
            observedActionType = "EXPORT_DATA";
          } else if (/pause|deactivate|suspend|close account|break|hibernate/i.test(accessibleName)) {
            observedActionType = "DEACTIVATE_ACCOUNT";
          } else if (/(turn off|disable|remove|revoke|disconnect|sign out).*?(2fa|two[-\s]*factor|mfa|session|device)/i.test(accessibleName) || /turn off 2fa|disable 2fa|remove 2fa|disable mfa|revoke/i.test(accessibleName)) {
            observedActionType = "REVOKE_ACCESS";
          } else if (/(turn on|enable|setup|enroll).*?(2fa|two[-\s]*factor|mfa)/i.test(accessibleName) || /turn on 2fa|enable 2fa|setup 2fa|enroll/i.test(accessibleName)) {
            observedActionType = "AUTHENTICATE";
          } else if (/audit|log|view|show|display|trail/i.test(accessibleName)) {
            observedActionType = "VIEW";
          } else if (/submit|save|update|confirm/i.test(accessibleName)) {
            observedActionType = "SUBMIT";
          } else {
            observedActionType = "MODIFY_PREFERENCE";
          }
        } else if (isLink) {
          if (/audit|log|view|show|display|trail/i.test(accessibleName)) {
            observedActionType = "VIEW";
          } else {
            observedActionType = "NAVIGATE";
          }
        }
        let observedTargetEntity = "UNKNOWN";
        if (/all notification|global alert|every alert|indiscriminately|entire platform|all account notification/i.test(combinedContext)) {
          observedTargetEntity = "ALL_NOTIFICATIONS";
        } else if (/all security|entire security|wipe security|all account security/i.test(combinedContext)) {
          observedTargetEntity = "ALL_SECURITY";
        } else if (/all data|wipe all|erase all personal/i.test(combinedContext)) {
          observedTargetEntity = "ALL_DATA";
        } else if (/organization|all org members|entire org/i.test(combinedContext)) {
          observedTargetEntity = "ORGANIZATION_USERS";
        } else if (/invoice|receipt|billing|payment/i.test(combinedContext)) {
          observedTargetEntity = "BILLING_PREFERENCES";
        } else if (/audit|sign-in log|access ledger|activity trail|audit trail|security event/i.test(combinedContext)) {
          observedTargetEntity = "SECURITY_SETTINGS";
        } else if (/session|device|disconnect|sign out all/i.test(combinedContext)) {
          observedTargetEntity = "SECURITY_SETTINGS";
        } else if (/theme|dark mode|night mode|display|contrast/i.test(combinedContext)) {
          observedTargetEntity = "UI_THEME";
        } else if (/marketing|promot|newsletter|campaign|bulletin/i.test(combinedContext)) {
          observedTargetEntity = "MARKETING_NOTIFICATIONS";
        } else if (/export|download.*?(data|record|archive|information)|my data|gdpr|personal (data|record|archive|information)/i.test(combinedContext)) {
          observedTargetEntity = "PERSONAL_DATA_EXPORT";
        } else if (/2fa|two-factor|two step|mfa|authenticat|security code/i.test(combinedContext)) {
          observedTargetEntity = "TWO_FACTOR_AUTH";
        } else if (/tracking|cookie|telemetry|analytics|behavioral/i.test(combinedContext)) {
          observedTargetEntity = "PRIVACY_SETTINGS";
        } else if (/deactivate|pause account|suspend profile|close account|membership hiatus|hibernate/i.test(combinedContext)) {
          observedTargetEntity = "ACCOUNT_STATUS";
        } else if (/security|password|credential/i.test(combinedContext)) {
          observedTargetEntity = "SECURITY_SETTINGS";
        }
        const domStructuralPath = VolatileFeatureSuppressor.computeRelativePath(el);
        const bindingHandle = {
          handleId: `handle_${i}_${Date.now()}`,
          tagName: el.tagName.toLowerCase(),
          role,
          accessibleName,
          domStructuralPath,
          elementIndex: i,
          volatileId: el.id ? el.id : void 0,
          volatileClasses: el.className && typeof el.className === "string" ? el.className.split(/\s+/).filter(Boolean) : void 0
        };
        const candidateId = `cand_${i}_${this.simpleHash(accessibleName + "_" + role + "_" + domStructuralPath)}`;
        const candidateFingerprintHash = FingerprintConstructor.computeFingerprintHash({
          canonicalFunction: `func_${observedActionType.toLowerCase()}_${observedTargetEntity.toLowerCase()}`,
          actionType: observedActionType,
          targetEntity: observedTargetEntity,
          role
        });
        const docView = container.defaultView || container.ownerDocument?.defaultView || (typeof window !== "undefined" ? window : null);
        const appState = docView?.IntentNavMockState || {};
        const defaultAppState = {
          marketing_notifications_enabled: true,
          marketing_emails_enabled: true,
          two_factor_enabled: true,
          export_download_initiated: false,
          account_deactivated: false,
          account_active: true,
          analytics_tracking_enabled: true,
          active_session_count: 3,
          dark_mode_enabled: false,
          invoice_available: true,
          invoice_download_triggered: false,
          audit_logs_available: true,
          audit_logs_visible: false
        };
        candidates.push({
          candidateId,
          candidateLabel: accessibleName,
          observedActionType,
          observedTargetEntity,
          observedRole: role,
          containerSemantics,
          ancestors: ancestorDescriptions,
          nearbyText: nearbyTexts,
          observedState: {
            ...defaultAppState,
            ...appState,
            disabled: el.disabled ?? false,
            checked: el.getAttribute("aria-checked") !== null ? el.getAttribute("aria-checked") === "true" : el.checked ?? false,
            expanded: el.getAttribute("aria-expanded") === "true"
          },
          bindingHandle,
          candidateFingerprintHash
        });
      }
      return candidates;
    }
  };

  // src/browser/contentScript.ts
  var observer = new InterfaceObserver();
  var witnessSequenceCounter = 0;
  var capturedWitnesses = [];
  var currentCorrelatedActivationId = null;
  var currentActivationTimestamp = null;
  function recordWitness(witnessClass, observedDelta, source = "MutationObserver", explicitTimestamp) {
    witnessSequenceCounter++;
    const now = typeof explicitTimestamp === "number" ? explicitTimestamp : Date.now();
    capturedWitnesses.push({
      witnessId: `wit_${now}_${witnessSequenceCounter}`,
      witnessClass,
      sequenceNumber: witnessSequenceCounter,
      timestamp: now,
      observedDelta,
      correlatedActivationEventId: currentCorrelatedActivationId,
      temporalDeltaMs: currentActivationTimestamp !== null ? Math.max(0, now - currentActivationTimestamp) : 0,
      isCausallyCorrelated: false,
      // Determined by the causal verifier downstream
      correlationExplanation: `Observed ${witnessClass} at ${now}`,
      source
    });
  }
  if (typeof window !== "undefined" && window.history) {
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      const res = originalPushState.apply(this, args);
      recordWitness("HISTORY_STATE_MUTATION", { path: window.location.pathname, state: args[0] }, "History:pushState");
      return res;
    };
    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = function(...args) {
      const res = originalReplaceState.apply(this, args);
      recordWitness("HISTORY_STATE_MUTATION", { path: window.location.pathname, state: args[0] }, "History:replaceState");
      return res;
    };
    window.addEventListener("popstate", (e) => {
      recordWitness("HISTORY_STATE_MUTATION", { path: window.location.pathname, state: e.state }, "History:popstate");
    });
    window.addEventListener("intentnav:mock-state-change", (e) => {
      const customEvt = e;
      const delta = customEvt.detail?.fullState || customEvt.detail || {};
      const explicitTime = typeof customEvt.detail?.timestamp === "number" ? customEvt.detail.timestamp : void 0;
      recordWitness("APPLICATION_STATE_MUTATION", delta, "CustomEvent:intentnav:mock-state-change", explicitTime);
    });
    window.addEventListener("intentnav:client-route-change", (e) => {
      const customEvt = e;
      const detail = customEvt.detail || {};
      recordWitness("CLIENT_ROUTE_MUTATION", {
        routeBefore: detail.routeBefore || window.location.pathname,
        routeAfter: detail.routeAfter || detail.route || window.location.pathname,
        source: detail.source || "SPA_ROUTER",
        outletChanged: true,
        timestamp: detail.timestamp || Date.now()
      }, "CustomEvent:intentnav:client-route-change");
    });
    window.addEventListener("intentnav:async-ack", (e) => {
      const customEvt = e;
      const detail = customEvt.detail || {};
      recordWitness("ASYNC_ACKNOWLEDGEMENT", {
        operation: detail.operation || "async_operation",
        status: detail.status || "COMPLETED",
        export_download_initiated: true,
        timestamp: detail.timestamp || Date.now()
      }, "CustomEvent:intentnav:async-ack");
    });
  }
  if (typeof window !== "undefined") {
    observer.observeMutations((mutations) => {
      if (!mutations || mutations.length === 0) {
        recordWitness("DOM_MUTATION", { url: window.location.pathname, title: document.title });
        return;
      }
      mutations.forEach((m) => {
        if (m.type === "attributes") {
          const target = m.target;
          const attrName = m.attributeName || "";
          const attrValue = target.getAttribute(attrName);
          const delta = {
            attribute: attrName,
            value: attrValue,
            targetTag: target.tagName.toLowerCase()
          };
          if (attrName === "aria-checked") {
            delta["checked"] = attrValue === "true";
            delta["marketing_emails_enabled"] = attrValue === "true";
            delta["marketing_notifications_enabled"] = attrValue === "true";
            delta["analytics_tracking_enabled"] = attrValue === "true";
            recordWitness("ACCESSIBILITY_STATE_MUTATION", delta, "MutationObserver:attributes:aria-checked");
          } else if (attrName === "aria-expanded") {
            delta["expanded"] = attrValue === "true";
            recordWitness("ACCESSIBILITY_STATE_MUTATION", delta, "MutationObserver:attributes:aria-expanded");
          } else if (attrName === "disabled") {
            delta["disabled"] = target.hasAttribute("disabled");
            recordWitness("ACCESSIBILITY_STATE_MUTATION", delta, "MutationObserver:attributes:disabled");
          } else {
            recordWitness("DOM_MUTATION", delta, `MutationObserver:attributes:${attrName}`);
          }
        } else if (m.type === "childList") {
          recordWitness("DOM_MUTATION", {
            addedNodes: m.addedNodes.length,
            removedNodes: m.removedNodes.length,
            targetTag: m.target.tagName?.toLowerCase() || "unknown"
          }, "MutationObserver:childList");
        }
      });
    }, 50);
  }
  function resolveBindingHandle(handle) {
    if (handle.domStructuralPath) {
      try {
        const el = document.querySelector(handle.domStructuralPath);
        if (el) return el;
      } catch {
      }
    }
    const selector = `[role="${handle.role}"], ${handle.tagName}`;
    const candidates = Array.from(document.querySelectorAll(selector));
    const targetLabel = (handle.accessibleName || "").toLowerCase().trim();
    for (const c of candidates) {
      const aria = (c.getAttribute("aria-label") || c.getAttribute("title") || c.textContent || "").toLowerCase().trim();
      if (targetLabel && aria && (aria.includes(targetLabel) || targetLabel.includes(aria))) {
        return c;
      }
    }
    return null;
  }
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      (async () => {
        switch (message.type) {
          case "OBSERVE_INTERFACE_REQUEST": {
            const stateNode = observer.captureInterfaceState();
            const candidates = CandidateGenerator.generateFromDOM(document);
            sendResponse({
              stateNode,
              candidates,
              capturedWitnesses: [...capturedWitnesses]
            });
            break;
          }
          case "DISPATCH_ACTIVATION_EVENT": {
            const payload = message.payload;
            currentCorrelatedActivationId = payload.activationEventId;
            const targetEl = resolveBindingHandle(payload.bindingHandle);
            if (!targetEl) {
              sendResponse({
                success: false,
                reason: `Target element could not be resolved from BindingHandle '${payload.bindingHandle.accessibleName}'`
              });
              break;
            }
            const actTimestamp = payload.activationTimestamp || message.timestamp || Date.now();
            currentActivationTimestamp = actTimestamp;
            capturedWitnesses.length = 0;
            if (Date.now() <= actTimestamp) {
              await new Promise((resolve) => setTimeout(resolve, 2));
            }
            const eventType = payload.eventType || "click";
            const activationEvent = {
              eventId: payload.activationEventId,
              sequenceNumber: 1,
              timestamp: actTimestamp,
              targetCandidateId: payload.bindingHandle.handleId,
              eventType,
              bindingHandle: payload.bindingHandle,
              initiatingCapabilityId: payload.capabilityId
            };
            const clickEvent = new MouseEvent("click", {
              bubbles: true,
              cancelable: true,
              view: window
            });
            targetEl.dispatchEvent(clickEvent);
            sendResponse({
              success: true,
              activationEvent,
              timestamp: actTimestamp
            });
            break;
          }
          case "COLLECT_WITNESSES": {
            sendResponse({ witnesses: [...capturedWitnesses] });
            capturedWitnesses.length = 0;
            break;
          }
          case "OBSERVE_POST_STATE": {
            const stateNode = observer.captureInterfaceState();
            sendResponse({
              success: true,
              stateNode,
              timestamp: Date.now()
            });
            break;
          }
          default:
            sendResponse({ unhandled: true });
            break;
        }
      })();
      return true;
    });
  }
})();
