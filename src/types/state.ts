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
