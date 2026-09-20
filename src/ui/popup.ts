/**
 * IntentNav-SCFR: Popup UI Controller
 * Provides dual modes: Normal User Mode & Research / Debug Evidence Mode
 */

import { StateMachineContext } from '../core/stateMachine/machine';
import { TypedDriftVector } from '../types/drift';

document.addEventListener('DOMContentLoaded', () => {
  const intentInput = document.getElementById('intentInput') as HTMLInputElement;
  const navigateBtn = document.getElementById('navigateBtn') as HTMLButtonElement;
  const researchModeCheckbox = document.getElementById('researchModeCheckbox') as HTMLInputElement;
  const researchPanel = document.getElementById('researchPanel') as HTMLElement;

  const statusBanner = document.getElementById('statusBanner') as HTMLElement;
  const statusIcon = document.getElementById('statusIcon') as HTMLElement;
  const statusText = document.getElementById('statusText') as HTMLElement;

  const confirmationCard = document.getElementById('confirmationCard') as HTMLElement;
  const confirmationMessage = document.getElementById('confirmationMessage') as HTMLElement;
  const confirmActionBtn = document.getElementById('confirmActionBtn') as HTMLButtonElement;
  const cancelActionBtn = document.getElementById('cancelActionBtn') as HTMLButtonElement;

  const summaryCap = document.getElementById('summaryCap') as HTMLElement;
  const summaryRoute = document.getElementById('summaryRoute') as HTMLElement;
  const summaryRisk = document.getElementById('summaryRisk') as HTMLElement;
  const summaryAuth = document.getElementById('summaryAuth') as HTMLElement;

  const normalizedIntentCode = document.getElementById('normalizedIntentCode') as HTMLElement;
  const driftBars = document.getElementById('driftBars') as HTMLElement;
  const driftExplanation = document.getElementById('driftExplanation') as HTMLElement;
  const candidateGatesList = document.getElementById('candidateGatesList') as HTMLElement;
  const transitionVerificationBox = document.getElementById('transitionVerificationBox') as HTMLElement;
  const quorumBox = document.getElementById('quorumBox') as HTMLElement;
  const exportAuditBtn = document.getElementById('exportAuditBtn') as HTMLButtonElement;
  const auditLogContainer = document.getElementById('auditLogContainer') as HTMLElement;

  // Mode Toggle
  researchModeCheckbox.addEventListener('change', () => {
    if (researchModeCheckbox.checked) {
      researchPanel.classList.remove('hidden');
    } else {
      researchPanel.classList.add('hidden');
    }
  });

  // Quick Chips
  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', (e) => {
      const intent = (e.currentTarget as HTMLElement).getAttribute('data-intent');
      if (intent) {
        intentInput.value = intent;
        handleExecute(false);
      }
    });
  });

  // Execute button
  navigateBtn.addEventListener('click', () => {
    handleExecute(false);
  });

  // High risk confirmation
  confirmActionBtn.addEventListener('click', () => {
    handleExecute(true);
  });

  cancelActionBtn.addEventListener('click', () => {
    confirmationCard.classList.add('hidden');
    updateStatus('warning', 'Action cancelled by user');
  });

  // Export audit log
  exportAuditBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'EXPORT_AUDIT_LOG', payload: {}, timestamp: Date.now(), messageId: `exp_${Date.now()}` }, (resp) => {
        if (resp && resp.logExport) {
          const blob = new Blob([JSON.stringify(resp.logExport, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `intentnav_audit_evidence_${Date.now()}.json`;
          a.click();
        }
      });
    }
  });

  function handleExecute(userConfirmationGranted: boolean) {
    const goal = intentInput.value.trim();
    if (!goal) return;

    updateStatus('idle', 'Observing interface and normalizing functional intent...');

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(
        {
          type: 'PROCESS_INTENT',
          payload: { goal, userConfirmationGranted },
          timestamp: Date.now(),
          messageId: `msg_${Date.now()}`,
        },
        (response) => {
          if (response && response.context) {
            renderContext(response.context);
          } else {
            updateStatus('error', 'Execution failed or extension backend unresponsive');
          }
        }
      );
    }
  }

  function updateStatus(type: 'idle' | 'success' | 'warning' | 'error', message: string) {
    statusBanner.className = `status-banner status-${type}`;
    statusIcon.textContent = type === 'success' ? '🟢' : type === 'warning' ? '🟡' : type === 'error' ? '🔴' : '⚪';
    statusText.textContent = message;
  }

  function renderContext(ctx: StateMachineContext) {
    // 1. Normal Summary
    if (ctx.resolvedCapability) {
      summaryCap.textContent = ctx.resolvedCapability.canonicalFunction;
    }
    if (ctx.activeRoute) {
      summaryRoute.textContent = `${ctx.activeRoute.routeId} (${ctx.activeRoute.status})`;
    }
    if (ctx.authorizationDecision) {
      summaryRisk.textContent = ctx.authorizationDecision.riskClass;
      summaryRisk.className = `badge badge-${ctx.authorizationDecision.riskClass === 'SECURITY_SENSITIVE' || ctx.authorizationDecision.riskClass === 'DESTRUCTIVE' ? 'high' : 'low'}`;

      summaryAuth.textContent = ctx.authorizationDecision.status;
      summaryAuth.className = `badge badge-${ctx.authorizationDecision.status === 'AUTHORIZED' ? 'low' : 'high'}`;
    }

    // Check if confirmation card needed
    if (ctx.currentState === 'CONFIRMATION_PENDING') {
      confirmationCard.classList.remove('hidden');
      confirmationMessage.textContent = ctx.authorizationDecision?.policyReason || 'High-risk security action requires user confirmation';
      updateStatus('warning', 'Awaiting manual confirmation for high-risk action');
    } else {
      confirmationCard.classList.add('hidden');
      if (ctx.currentState === 'EXECUTED') {
        updateStatus('success', 'Execution Completed: Causal transition verified & authorized');
      } else if (ctx.currentState === 'ABSTAINED') {
        updateStatus('warning', 'System Abstained: Confidence low or invariants unfulfilled');
      } else if (ctx.currentState === 'QUARANTINED') {
        updateStatus('error', 'Route Quarantined: Causal transition verification failed');
      }
    }

    // 2. Research Panels
    if (ctx.normalizedIntent) {
      normalizedIntentCode.textContent = JSON.stringify(ctx.normalizedIntent, null, 2);
    }

    if (ctx.driftVector) {
      renderDriftBars(ctx.driftVector);
      driftExplanation.textContent = ctx.driftResult?.explanation || '';
    }

    if (ctx.invariantResults) {
      renderCandidateGates(ctx.invariantResults, ctx.selectedCandidate?.candidateId);
    }

    if (ctx.verificationResult) {
      transitionVerificationBox.innerHTML = `
        <div style="font-size:11px;">
          <div><strong>Status:</strong> <span style="color:${ctx.verificationResult.causallyVerified ? '#16a34a' : '#dc2626'}">${ctx.verificationResult.status}</span></div>
          <div><strong>Verified Witnesses:</strong> ${ctx.verificationResult.verifiedWitnessClasses.join(', ') || 'None'}</div>
          <div><strong>Explanation:</strong> ${ctx.verificationResult.explanation}</div>
        </div>
      `;
    }

    if (ctx.authorizationDecision) {
      const q = ctx.authorizationDecision.evidenceQuorum;
      quorumBox.innerHTML = `
        <div style="font-size:11px;">
          <div>Semantic Evidence: ${q.hasSemanticEvidence ? '✅' : '❌'}</div>
          <div>Functional Invariant Evidence: ${q.hasFunctionalInvariantEvidence ? '✅' : '❌'}</div>
          <div>Transition State Evidence: ${q.hasTransitionStateEvidence ? '✅' : '❌'}</div>
          <div><strong>Quorum Satisfied:</strong> ${q.quorumSatisfied ? '✅ YES' : '❌ NO'}</div>
          <div style="margin-top:4px;"><strong>Policy Note:</strong> ${ctx.authorizationDecision.policyReason}</div>
        </div>
      `;
    }

    auditLogContainer.innerHTML = `<div>Last state: ${ctx.currentState} | Timestamp: ${Date.now()}</div>`;
  }

  function renderDriftBars(v: TypedDriftVector) {
    const dimensions: Array<{ key: keyof TypedDriftVector; label: string }> = [
      { key: 'presentation', label: 'Presentation' },
      { key: 'context', label: 'Context' },
      { key: 'structure', label: 'Structure' },
      { key: 'capability', label: 'Capability' },
      { key: 'transition', label: 'Transition' },
    ];

    driftBars.innerHTML = dimensions
      .map((d) => {
        const val = v[d.key];
        const pct = Math.round(val * 100);
        const cls = val > 0.4 ? (val > 0.7 ? 'danger' : 'warn') : '';
        return `
        <div class="drift-bar-row">
          <span class="drift-bar-label">${d.label}</span>
          <div class="drift-bar-track">
            <div class="drift-bar-fill ${cls}" style="width: ${pct}%"></div>
          </div>
          <span style="width:30px;text-align:right;">${val.toFixed(2)}</span>
        </div>
      `;
      })
      .join('');
  }

  function renderCandidateGates(results: Record<string, any>, winnerId?: string) {
    candidateGatesList.innerHTML = Object.entries(results)
      .map(([candId, res]) => {
        const isWinner = candId === winnerId;
        const statusCls =
          res.status === 'PASS'
            ? 'candidate-pass'
            : res.status === 'CONTRADICTED'
            ? 'candidate-contradicted'
            : 'candidate-fail';
        return `
        <div class="candidate-item">
          <div class="candidate-header">
            <span>${candId} ${isWinner ? '⭐ [WINNER]' : ''}</span>
            <span class="${statusCls}">${res.status}</span>
          </div>
          <div style="color:#64748b;">${res.rejectionReason || 'Passed all mandatory invariants'}</div>
        </div>
      `;
      })
      .join('');
  }
});

