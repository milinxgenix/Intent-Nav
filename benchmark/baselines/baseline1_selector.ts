/**
 * Baseline 1: Fixed Selector Replay
 * Replays hardcoded CSS/DOM selectors stored during initial recording.
 * Fails when DOM IDs, classes, or hierarchy mutate.
 */

export interface BaselineCandidate {
  id?: string;
  className?: string;
  role?: string;
  label?: string;
  candidateLabel?: string;
  targetEntity?: string;
  actionType?: string;
}

export class Baseline1SelectorReplay {
  // Stored historical selectors
  private storedSelectors: Record<string, string> = {
    CAP_DISABLE_MARKETING: '#btn-disable-marketing',
    CAP_EXPORT_DATA: '#btn-export-data',
    CAP_DISABLE_2FA: '#btn-disable-2fa',
    CAP_DEACTIVATE_ACCOUNT: '#btn-deactivate-account',
    CAP_TOGGLE_TRACKING: '#btn-toggle-tracking',
    CAP_REVOKE_SESSIONS: '#btn-revoke-sessions',
    CAP_TOGGLE_DARK_MODE: '#btn-toggle-dark-mode',
    CAP_DOWNLOAD_INVOICE: '#btn-download-invoice',
    CAP_VIEW_AUDIT_LOGS: '#btn-view-audit-logs',
  };

  public execute(capabilityId: string, candidates: BaselineCandidate[]): { success: boolean; selectedCandidateId?: string } {
    const selector = this.storedSelectors[capabilityId];
    if (!selector) return { success: false };

    // Match by ID
    const targetId = selector.replace('#', '');
    const found = candidates.find((c) => c.id === targetId);

    if (found) {
      return { success: true, selectedCandidateId: found.id };
    }
    return { success: false };
  }
}
