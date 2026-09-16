/**
 * IntentNav-SCFR: Immutable Append-Only Audit Logger
 * Records complete evidence traces for patent reproducibility and scientific auditing
 */

import { AuditRecord, AuditLogExport } from '../../types/audit';

export class AuditLogger {
  private records: AuditRecord[] = [];
  private sessionId: string;

  constructor(sessionId?: string) {
    this.sessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Appends an immutable audit record
   */
  public log(record: Omit<AuditRecord, 'recordId' | 'sessionId' | 'timestamp'>): AuditRecord {
    const fullRecord: AuditRecord = {
      ...record,
      recordId: `rec_${Date.now()}_${this.records.length + 1}`,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    };

    // Store a frozen copy to ensure immutability
    this.records.push(Object.freeze(JSON.parse(JSON.stringify(fullRecord))));
    return fullRecord;
  }

  /**
   * Returns all audit records
   */
  public getRecords(): readonly AuditRecord[] {
    return this.records;
  }

  /**
   * Exports full audit log as structured JSON
   */
  public exportLog(systemVersion: string = '1.0.0'): AuditLogExport {
    return {
      exportId: `export_${Date.now()}`,
      exportedAt: Date.now(),
      systemVersion,
      recordsCount: this.records.length,
      records: [...this.records],
    };
  }

  /**
   * Clears logs (for test harnesses)
   */
  public clear(): void {
    this.records = [];
  }
}

