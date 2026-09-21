# Persistence Completeness & Machine-Readable Validation Audit

**Audit Date**: September 21, 2026  
**Scope**: `src/core/graph/*`, `src/core/storage/*`, `src/core/quarantine/*`, `src/core/stateMachine/*`, `src/types/*`

---

## Executive Summary
An audit of the IntentNav-SCFR persistence system reveals that while core capabilities, declarative invariant predicates, and negative evidence are successfully persisted and rehydrated across restarts, critical safety-relevant graph and route lifecycle states are currently held only in memory:
1. **Graph Edges (`GraphEdge`)**: `CapabilityGraphEngine.addEdge()` only appends to an in-memory array `this.edges`. Edges are neither written to `PersistentCapabilityStore` nor loaded during `loadFromStore()`.
2. **Quarantine State**: `RouteManager.quarantineRoute()` mutates the in-memory `RouteVersion.status = 'QUARANTINED'` and `quarantineReason`, but never persists the update via `CapabilityGraphEngine.attachRouteVersion()` or `PersistentCapabilityStore.saveRouteVersion()`.
3. **Rollback & Demotion State**: `RouteManager.demoteActiveRoute()` persists the demoted route, but fails to persist the restored `rollbackRoute` and the capability node's updated `activeRouteId`.
4. **Active Route Linkage**: Stale `activeRouteId` references can survive restart if a route was quarantined or demoted without persisting the cleared `activeRouteId: null`.
5. **Validation Record Completeness**: `createAndSaveValidationRecord()` in `IntentNavMachine` currently hardcodes `transitionSignature: null`, dropping the authoritative `TransitionSignature` generated during causal transition verification.

---

## Detailed State Persistence Matrix

| State Component | Written to Storage? | Read / Hydrated? | Restart-Safe? | Safety & Invariant Impact | Remediation Required |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Capability Nodes (`CapabilityNode`)** | Yes (`saveCapabilityNode`) | Yes (`getAllCapabilityNodes`) | Yes | Core capability identities and version registries survive. | Ensure version arrays and activeRouteId stay synchronized. |
| **Graph Edges (`GraphEdge`)** | **NO** (In-memory only: `this.edges.push(edge)`) | **NO** (`loadFromStore` ignores edges) | **NO** | **HIGH**: Inter-capability and capability-to-interface-state path routing and transitions are completely lost across service worker/process restarts. | Add `edges` to `PersistentStoreSchema`, add `saveGraphEdge`/`getAllGraphEdges` in store, call in `addEdge()` and `loadFromStore()`. |
| **Interface States (`InterfaceStateNode`)** | Yes (`saveInterfaceState`) | Yes (`getAllInterfaceStates`) | Yes | Interface state representations survive restart. | None. |
| **Route Versions (`RouteVersion`)** | Partially (`saveRouteVersion`) | Yes (`getAllRouteVersions`) | Partially | Routes created via `createProvisionalRoute` and promoted via `promoteToActive` are saved, but updates in `quarantineRoute` are omitted. | Call `attachRouteVersion` inside `quarantineRoute` and `demoteActiveRoute`. |
| **Quarantine State (`status: 'QUARANTINED'`, `quarantineReason`)** | **NO** in `quarantineRoute` | Read from stale store | **NO** | **CRITICAL**: Quarantined routes revert to prior non-quarantined status upon restart, risking unsafe re-execution or promotion. | Persist route and capability node immediately upon quarantine. |
| **Demotion State (`status: 'DEMOTED'`, `demotedRouteIds`)** | Partially | Read from store | Partially | Demoted route is saved, but capability node's cleared `activeRouteId: null` is not synchronized to store if no rollback route exists. | Ensure capability node with updated `activeRouteId` and `demotedRouteIds` is saved. |
| **Rollback Route State (`rollbackRoute.status = 'ACTIVE_VALIDATED'`)** | **NO** in `demoteActiveRoute` | Not saved | **NO** | **CRITICAL**: The newly promoted rollback route and capability's `activeRouteId` are not persisted, leaving the system in a disconnected state upon restart. | Call `attachRouteVersion(capabilityId, rollbackRoute)` and save capability node. |
| **Active Route Linkage (`activeRouteId`)** | Partially | Yes (in `loadFromStore`) | Partially | If `activeRouteId` is cleared in memory upon quarantine/demotion but not saved, restart re-links the old route. | Explicitly update capability node activeRouteId in store whenever cleared or reassigned. |
| **Validation Records (`ValidationRecord`)** | Yes (`saveValidationRecord`) | Yes (`getValidationRecords`) | Partially | Validation history is persisted, but `transitionSignature` is saved as `null`. | Populate `transitionSignature` directly from the authoritative verification result or capability transition evidence. |
| **Negative Evidence (`ContradictionEvidence`)** | Yes (`saveNegativeEvidence`) | Yes (`getNegativeEvidence`) | Yes | Contradictions and suppression records survive restart. | None. |
| **Typed Drift History** | Yes (`saveDriftRecord`) | Yes (`getDriftHistory`) | Yes | 5D drift history survives restart. | None. |

---

## Action Plan for Remediation

1. **Phase 2: Graph Edge Persistence**:
   - Extend `PersistentStoreSchema` to include `graphEdges: GraphEdge[]`.
   - Add `saveGraphEdge(edge: GraphEdge): Promise<void>` and `getAllGraphEdges(): Promise<GraphEdge[]>`.
   - Update `CapabilityGraphEngine.addEdge()` to persist edges.
   - Update `CapabilityGraphEngine.loadFromStore()` to reconstruct all edges.
   - Ensure edge schema supports: `sourceNodeId`, `targetNodeId`, `relationType`, `routeId`, `creationTimestamp`.

2. **Phase 3: Route Quarantine Persistence**:
   - Update `RouteManager.quarantineRoute()` to invoke `this.graph.attachRouteVersion(capabilityId, route)` so both the quarantined route and updated `capabilityNode` (`quarantinedRouteIds`, `activeRouteId = null`) are persisted immediately.
   - Ensure `quarantineReason`, `status = 'QUARANTINED'`, and timestamps are preserved and loaded on restart.

3. **Phase 4 & 5: Rollback, Demotion & Active Linkage Persistence**:
   - In `RouteManager.demoteActiveRoute()`:
     - Persist `demotedRoute` via `attachRouteVersion`.
     - When `rollbackRoute` is selected, persist `rollbackRoute` via `attachRouteVersion(capabilityId, rollbackRoute)`.
     - Persist capability node with cleared or newly assigned `activeRouteId`.
   - In `CapabilityGraphEngine.loadFromStore()`:
     - Ensure `node.activeRouteId` is only set if the route's status is strictly `ACTIVE_VALIDATED`.
     - If the stored `activeRouteId` refers to a route that is `QUARANTINED` or `DEMOTED`, clear it (`node.activeRouteId = null`).

4. **Phase 6 & 7: Machine-Readable Validation Record**:
   - In `IntentNavMachine.createAndSaveValidationRecord()`:
     - Populate `transitionSignature` with the authoritative `TransitionSignature` from `this.context.verificationResult?.signature` or `matchedCap.transitionEvidence`.
     - Populate `activationEvent` (`eventId`, `timestamp`, `sequenceNumber`, `targetCandidateId`).
     - Populate `transitionWitnesses` preserving observed chronology ($t_{\text{activation}}$, $t_{\text{witness}}$).
     - Populate `causalVerificationResult` and `promotionState`.

5. **Phase 8: Serialization Safety**:
   - Ensure all persisted records are strictly JSON-serializable (no closures, DOM elements, or functions).
   - Verify declarative invariant predicates continue to rehydrate into executable evaluators.

