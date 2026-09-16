/**
 * IntentNav-SCFR: Browser Extension IPC Message Protocols
 */

import { NormalizedIntent } from './intent';
import { RouteLifecycleState } from './state';
import { TypedDriftVector } from './drift';
import { ExecutionAuthorizationDecision } from './authorization';

export type ExtensionMessageType =
  | 'PROCESS_INTENT'
  | 'OBSERVE_INTERFACE_REQUEST'
  | 'INTERFACE_OBSERVATION_RESULT'
  | 'DISPATCH_ACTIVATION_EVENT'
  | 'ACTIVATION_EVENT_DISPATCHED'
  | 'COLLECT_WITNESSES'
  | 'WITNESSES_COLLECTED'
  | 'CONFIRM_HIGH_RISK_ACTION'
  | 'GET_SYSTEM_STATE'
  | 'SYSTEM_STATE_UPDATE'
  | 'EXPORT_AUDIT_LOG'
  | 'AUDIT_LOG_DATA';

export interface ExtensionMessage<T = unknown> {
  type: ExtensionMessageType;
  payload: T;
  timestamp: number;
  messageId: string;
}

export interface SystemStateSnapshot {
  activeCapabilityId: string | null;
  activeRouteId: string | null;
  routeLifecycleState: RouteLifecycleState;
  normalizedIntent: NormalizedIntent | null;
  latestDriftVector: TypedDriftVector | null;
  latestAuthorization: ExecutionAuthorizationDecision | null;
  auditRecordCount: number;
  isResearchMode: boolean;
  quarantinedRoutesCount: number;
  negativeEvidenceCount: number;
}

