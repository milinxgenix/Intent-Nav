/**
 * IntentNav-SCFR: Real Browser-Local Persistent Capability Store
 *
 * Implements persistent storage for capabilities, graph nodes, interface states,
 * route versions, validation history, negative evidence, and drift records.
 * Uses chrome.storage.local with a fallback adapter for Node/Vitest environments.
 * Survives popup closing, service worker restarts, and extension reloads.
 */

import { FunctionalCapabilityFingerprint } from '../../types/capability';
import { CapabilityNode, InterfaceStateNode, RouteVersion } from '../../types/state';
import { ContradictionEvidence } from '../../types/negativeEvidence';
import { ValidationRecord } from '../../types/transition';
import { TypedDriftVector } from '../../types/drift';

export const CURRENT_SCHEMA_VERSION = 1;

export interface PersistentStoreSchema {
  schemaVersion: number;
  capabilities: Record<string, FunctionalCapabilityFingerprint>;
  capabilityNodes: Record<string, CapabilityNode>;
  interfaceStates: Record<string, InterfaceStateNode>;
  routeVersions: Record<string, RouteVersion>;
  validationRecords: ValidationRecord[];
  negativeEvidence: ContradictionEvidence[];
  driftHistory: Array<{ capabilityId: string; timestamp: number; driftVector: TypedDriftVector }>;
  metadata: {
    lastUpdated: number;
    extensionVersion: string;
  };
}

export class PersistentCapabilityStore {
  private inMemoryCache: PersistentStoreSchema;
  private isInitialized = false;

  constructor(private storageKey: string = 'intentnav_persistent_store') {
    this.inMemoryCache = this.getDefaultSchema();
  }

  private getDefaultSchema(): PersistentStoreSchema {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      capabilities: {},
      capabilityNodes: {},
      interfaceStates: {},
      routeVersions: {},
      validationRecords: [],
      negativeEvidence: [],
      driftHistory: [],
      metadata: {
        lastUpdated: Date.now(),
        extensionVersion: '1.0.0',
      },
    };
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get(this.storageKey);
      if (data && data[this.storageKey]) {
        this.inMemoryCache = data[this.storageKey] as PersistentStoreSchema;
        await this.checkAndMigrateSchema();
      } else {
        this.inMemoryCache = this.getDefaultSchema();
        await this.persist();
      }
    } else if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        try {
          this.inMemoryCache = JSON.parse(raw);
          await this.checkAndMigrateSchema();
        } catch {
          this.inMemoryCache = this.getDefaultSchema();
        }
      } else {
        this.inMemoryCache = this.getDefaultSchema();
        await this.persist();
      }
    }

    this.isInitialized = true;
  }

  private async checkAndMigrateSchema(): Promise<void> {
    if (this.inMemoryCache.schemaVersion < CURRENT_SCHEMA_VERSION) {
      await this.migrateSchema(this.inMemoryCache.schemaVersion, CURRENT_SCHEMA_VERSION);
    }
  }

  public async migrateSchema(fromVersion: number, toVersion: number): Promise<void> {
    // Migration framework
    if (fromVersion < 1) {
      this.inMemoryCache.schemaVersion = 1;
    }
    this.inMemoryCache.schemaVersion = toVersion;
    this.inMemoryCache.metadata.lastUpdated = Date.now();
    await this.persist();
  }

  private async persist(): Promise<void> {
    this.inMemoryCache.metadata.lastUpdated = Date.now();
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [this.storageKey]: this.inMemoryCache });
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(this.inMemoryCache));
    }
  }

  // --- Capabilities ---
  public async saveCapability(cap: FunctionalCapabilityFingerprint): Promise<void> {
    await this.init();
    this.inMemoryCache.capabilities[cap.capabilityId] = cap;
    await this.persist();
  }

  public async getCapability(capabilityId: string): Promise<FunctionalCapabilityFingerprint | null> {
    await this.init();
    return this.inMemoryCache.capabilities[capabilityId] || null;
  }

  public async getAllCapabilities(): Promise<FunctionalCapabilityFingerprint[]> {
    await this.init();
    return Object.values(this.inMemoryCache.capabilities);
  }

  // --- Capability Nodes & Graph ---
  public async saveCapabilityNode(node: CapabilityNode): Promise<void> {
    await this.init();
    this.inMemoryCache.capabilityNodes[node.capabilityId] = node;
    await this.persist();
  }

  public async getCapabilityNode(capabilityId: string): Promise<CapabilityNode | null> {
    await this.init();
    return this.inMemoryCache.capabilityNodes[capabilityId] || null;
  }

  public async getAllCapabilityNodes(): Promise<Record<string, CapabilityNode>> {
    await this.init();
    return { ...this.inMemoryCache.capabilityNodes };
  }

  // --- Interface States ---
  public async saveInterfaceState(state: InterfaceStateNode): Promise<void> {
    await this.init();
    this.inMemoryCache.interfaceStates[state.stateId] = state;
    await this.persist();
  }

  public async getInterfaceState(stateId: string): Promise<InterfaceStateNode | null> {
    await this.init();
    return this.inMemoryCache.interfaceStates[stateId] || null;
  }

  public async getAllInterfaceStates(): Promise<InterfaceStateNode[]> {
    await this.init();
    return Object.values(this.inMemoryCache.interfaceStates);
  }

  // --- Route Versions ---
  public async saveRouteVersion(route: RouteVersion): Promise<void> {
    await this.init();
    this.inMemoryCache.routeVersions[route.routeId] = route;
    // Also update capability node if present
    const node = this.inMemoryCache.capabilityNodes[route.capabilityId];
    if (node) {
      node.routeVersions[route.routeId] = route;
      if (route.status === 'ACTIVE_VALIDATED') {
        node.activeRouteId = route.routeId;
      }
    }
    await this.persist();
  }

  public async getRouteVersion(routeId: string): Promise<RouteVersion | null> {
    await this.init();
    return this.inMemoryCache.routeVersions[routeId] || null;
  }

  public async getAllRouteVersions(capabilityId?: string): Promise<RouteVersion[]> {
    await this.init();
    const all = Object.values(this.inMemoryCache.routeVersions);
    return capabilityId ? all.filter((r) => r.capabilityId === capabilityId) : all;
  }

  // --- Validation History ---
  public async saveValidationRecord(record: ValidationRecord): Promise<void> {
    await this.init();
    this.inMemoryCache.validationRecords.push(record);
    await this.persist();
  }

  public async getValidationRecords(capabilityId?: string): Promise<ValidationRecord[]> {
    await this.init();
    if (!capabilityId) return [...this.inMemoryCache.validationRecords];
    return this.inMemoryCache.validationRecords.filter((r) => r.capabilityId === capabilityId);
  }

  // --- Negative Evidence ---
  public async saveNegativeEvidence(evidence: ContradictionEvidence): Promise<void> {
    await this.init();
    this.inMemoryCache.negativeEvidence.push(evidence);
    await this.persist();
  }

  public async getNegativeEvidence(capabilityId?: string): Promise<ContradictionEvidence[]> {
    await this.init();
    if (!capabilityId) return [...this.inMemoryCache.negativeEvidence];
    return this.inMemoryCache.negativeEvidence.filter((e) => e.capabilityId === capabilityId);
  }

  // --- Drift History ---
  public async saveDriftRecord(record: {
    capabilityId: string;
    timestamp: number;
    driftVector: TypedDriftVector;
  }): Promise<void> {
    await this.init();
    this.inMemoryCache.driftHistory.push(record);
    await this.persist();
  }

  public async getDriftHistory(capabilityId?: string): Promise<Array<{
    capabilityId: string;
    timestamp: number;
    driftVector: TypedDriftVector;
  }>> {
    await this.init();
    if (!capabilityId) return [...this.inMemoryCache.driftHistory];
    return this.inMemoryCache.driftHistory.filter((d) => d.capabilityId === capabilityId);
  }

  // --- Export & Clear ---
  public async exportFullDump(): Promise<string> {
    await this.init();
    return JSON.stringify(this.inMemoryCache, null, 2);
  }

  public async clear(): Promise<void> {
    this.inMemoryCache = this.getDefaultSchema();
    await this.persist();
  }
}
