/**
 * IntentNav-SCFR: Capability-State Graph Engine
 * Fundamental Invariant: CAPABILITY NODES != INTERFACE-STATE NODES
 * Integrated with PersistentCapabilityStore
 */

import { CapabilityNode, InterfaceStateNode, GraphEdge, RouteVersion } from '../../types/state';
import { PersistentCapabilityStore } from '../storage/persistentStore';

export class CapabilityGraphEngine {
  private capabilityNodes: Map<string, CapabilityNode> = new Map();
  private interfaceStateNodes: Map<string, InterfaceStateNode> = new Map();
  private edges: GraphEdge[] = [];

  constructor(private store?: PersistentCapabilityStore) {}

  /**
   * Hydrates the in-memory graph from persistent storage
   */
  public async loadFromStore(): Promise<void> {
    if (!this.store) return;
    const nodes = await this.store.getAllCapabilityNodes();
    for (const [id, node] of Object.entries(nodes)) {
      this.capabilityNodes.set(id, node);
    }
    const states = await this.store.getAllInterfaceStates();
    for (const state of states) {
      this.interfaceStateNodes.set(state.stateId, state);
    }
  }

  /**
   * Registers or updates a Capability Node
   */
  public registerCapability(capabilityId: string, canonicalFunction: string): CapabilityNode {
    let node = this.capabilityNodes.get(capabilityId);
    if (!node) {
      node = {
        capabilityId,
        canonicalFunction,
        routeVersions: {},
        activeRouteId: null,
        provisionalRouteIds: [],
        quarantinedRouteIds: [],
        demotedRouteIds: [],
        creationTimestamp: Date.now(),
      };
      this.capabilityNodes.set(capabilityId, node);
      if (this.store) {
        this.store.saveCapabilityNode(node).catch(() => {});
      }
    }
    return node;
  }

  /**
   * Registers an Interface-State Node (e.g. Page, Modal, Dialog, Tab)
   */
  public registerInterfaceState(state: InterfaceStateNode): InterfaceStateNode {
    this.interfaceStateNodes.set(state.stateId, state);
    if (this.store) {
      this.store.saveInterfaceState(state).catch(() => {});
    }
    return state;
  }

  /**
   * Adds a directional graph edge
   */
  public addEdge(edge: GraphEdge): void {
    this.edges.push(edge);
  }

  /**
   * Attaches a route version to a capability node
   */
  public attachRouteVersion(capabilityId: string, route: RouteVersion): void {
    const node = this.capabilityNodes.get(capabilityId);
    if (!node) {
      throw new Error(`Capability node ${capabilityId} does not exist in graph.`);
    }

    node.routeVersions[route.routeId] = route;

    if (route.status === 'PROVISIONAL') {
      if (!node.provisionalRouteIds.includes(route.routeId)) {
        node.provisionalRouteIds.push(route.routeId);
      }
    } else if (route.status === 'ACTIVE_VALIDATED') {
      node.activeRouteId = route.routeId;
    } else if (route.status === 'QUARANTINED') {
      if (!node.quarantinedRouteIds.includes(route.routeId)) {
        node.quarantinedRouteIds.push(route.routeId);
      }
    } else if (route.status === 'DEMOTED') {
      if (!node.demotedRouteIds.includes(route.routeId)) {
        node.demotedRouteIds.push(route.routeId);
      }
    }

    if (this.store) {
      this.store.saveRouteVersion(route).catch(() => {});
      this.store.saveCapabilityNode(node).catch(() => {});
    }
  }

  public getCapability(capabilityId: string): CapabilityNode | undefined {
    return this.capabilityNodes.get(capabilityId);
  }

  public getInterfaceState(stateId: string): InterfaceStateNode | undefined {
    return this.interfaceStateNodes.get(stateId);
  }

  public getAllCapabilities(): CapabilityNode[] {
    return Array.from(this.capabilityNodes.values());
  }

  public getAllInterfaceStates(): InterfaceStateNode[] {
    return Array.from(this.interfaceStateNodes.values());
  }

  public getEdges(): GraphEdge[] {
    return [...this.edges];
  }

  /**
   * Locates routes that expose a given capability
   */
  public getRoutesForCapability(capabilityId: string): RouteVersion[] {
    const node = this.capabilityNodes.get(capabilityId);
    if (!node) return [];
    return Object.values(node.routeVersions);
  }

  /**
   * Retrieves the active validated route for a capability, or null
   */
  public getActiveRoute(capabilityId: string): RouteVersion | null {
    const node = this.capabilityNodes.get(capabilityId);
    if (!node || !node.activeRouteId) return null;
    const active = node.routeVersions[node.activeRouteId];
    return active && active.status === 'ACTIVE_VALIDATED' ? active : null;
  }
}
