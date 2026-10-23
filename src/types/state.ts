/**
 * IntentNav-SCFR: Interface-State and Capability Graph Types
 * Enforces: CAPABILITY NODES != INTERFACE-STATE NODES
 */

import { BindingHandle } from './capability';
import { TransitionSignature } from './transition';

export type InterfaceStateType =
  | 'PAGE'
  | 'DIALOG'
  | 'MODAL'
  | 'PANEL'
  | 'TAB'
  | 'DRAWER'
  | 'APPLICATION_STATE';

export interface InterfaceStateNode {
  stateId: string;
  stateType: InterfaceStateType;
  urlPattern: string;
  domStructuralHash: string;
  semanticLandmarks: string[];
  activeModalsOrDialogs: string[];
  activeTabs: string[];
  exposedCandidateHandles?: BindingHandle[];
  observedApplicationState?: Record<string, unknown>;
  timestamp: number;
}

// Alias for first-class InterfaceState entity
export type InterfaceState = InterfaceStateNode;

export type EdgeType =
  | 'NAVIGATE'
  | 'INTERACT'
  | 'EXPOSES_CAPABILITY'
  | 'TRANSITION';

export interface GraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: EdgeType;
  actionRequired?: string;
  weight: number;
  routeId?: string;
  version?: number | string;
  timestamp?: number;
  transitionSignature?: TransitionSignature;
  validationStatus?: string;
}

export interface RouteStep {
  stepIndex: number;
  fromStateId: string;
  toStateId: string;
  actionDescription: string;
  targetRole?: string;
  targetAccessibleName?: string;
  bindingHandle?: BindingHandle;
  transitionSignature?: TransitionSignature;
  expectedTransitionDelta?: Record<string, unknown>;
}

export type RouteLifecycleState =
  | 'DISCOVERED'
  | 'CANDIDATE'
  | 'INVARIANT_VALIDATED'
  | 'PROVISIONAL'
  | 'TRANSITION_VERIFIED'
  | 'ACTIVE_VALIDATED'
  | 'DEMOTED'
  | 'QUARANTINED'
  | 'ABSTAINED';

export interface RouteVersion {
  routeId: string;
  capabilityId: string;
  versionNumber: number;
  status: RouteLifecycleState;
  steps: RouteStep[];
  creationTimestamp: number;
  lastValidatedTimestamp?: number;
  quarantineReason?: string;
  demotionReason?: string;
  confidenceScore: number;
  pathCost: number;
}

// Alias for first-class CapabilityRoute entity
export type CapabilityRoute = RouteVersion;

export interface CapabilityNode {
  capabilityId: string;
  canonicalFunction: string;
  routeVersions: Record<string, RouteVersion>; // routeId -> RouteVersion
  activeRouteId: string | null;
  provisionalRouteIds: string[];
  quarantinedRouteIds: string[];
  demotedRouteIds: string[];
  creationTimestamp: number;
  lastUsedTimestamp?: number;
}

export type RoutePlanningFailureReason =
  | 'NO_PATH'
  | 'DEPTH_EXHAUSTED'
  | 'CYCLE_DETECTED'
  | 'FORBIDDEN_STATE_ENCOUNTERED'
  | 'STALE_EDGE'
  | 'INTERMEDIATE_PRECONDITION_FAILED'
  | 'AMBIGUOUS_ROUTE';

export interface RoutePlanningQuery {
  initialStateId: string;
  targetCapabilityId: string;
  targetStateId?: string;
  maxDepth?: number;
  maxPathCost?: number;
  forbiddenStateIds?: string[];
  context?: Record<string, unknown>;
}

export interface RoutePlanResult {
  success: boolean;
  route?: RouteVersion;
  exploredNodesCount: number;
  planningLatencyMs: number;
  failureReason?: RoutePlanningFailureReason;
  explanation: string;
  stepsCount: number;
}

export interface MultiStepExecutionProgress {
  totalSteps: number;
  completedSteps: number;
  currentStepIndex: number;
  failedStepIndex?: number;
  stepResults: Array<{
    stepIndex: number;
    fromStateId: string;
    toStateId: string;
    success: boolean;
    reason?: string;
    activationEventId?: string;
    witnessCount?: number;
  }>;
}
