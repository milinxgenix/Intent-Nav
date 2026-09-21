/**
 * IntentNav-SCFR: Witness Collector
 * Collects runtime events across independent witness classes:
 * 1. DOM_MUTATION
 * 2. ACCESSIBILITY_STATE_MUTATION
 * 3. HISTORY_STATE_MUTATION
 * 4. CLIENT_ROUTE_MUTATION
 * 5. APPLICATION_STATE_MUTATION
 * 6. ASYNC_ACKNOWLEDGEMENT
 */

import {
  TransitionWitness,
  WitnessClass,
  ActivationEventRecord,
} from '../../types/transition';

export class WitnessCollector {
  private witnesses: TransitionWitness[] = [];
  private sequenceCounter = 0;
  private activeActivationEvent: ActivationEventRecord | null = null;

  /**
   * Registers the active candidate activation event (with timestamp and sequence)
   */
  public registerActivationEvent(event: ActivationEventRecord): void {
    this.activeActivationEvent = event;
  }

  /**
   * Records an observed witness event
   */
  public recordWitness(
    witnessClass: WitnessClass,
    observedDelta: Record<string, unknown>,
    timestamp: number = Date.now()
  ): TransitionWitness {
    this.sequenceCounter++;
    const witnessId = `wit_${this.sequenceCounter}_${witnessClass}_${timestamp}`;

    let isCausallyCorrelated = false;
    let correlatedActivationEventId: string | null = null;
    let temporalDeltaMs = -1;
    let correlationExplanation = '';

    if (this.activeActivationEvent) {
      temporalDeltaMs = timestamp - this.activeActivationEvent.timestamp;

      // Strict temporal precedence: witness MUST occur strictly AFTER activation event (t_act < t_witness)
      if (temporalDeltaMs > 0) {
        correlatedActivationEventId = this.activeActivationEvent.eventId;
        isCausallyCorrelated = true;
        correlationExplanation = `Correlated with activation event ${this.activeActivationEvent.eventId} (+${temporalDeltaMs}ms)`;
      } else {
        correlationExplanation = `REJECTED: Pre-existing or concurrent event occurred before or at activation (${temporalDeltaMs}ms)`;
      }
    } else {
      correlationExplanation = 'REJECTED: Unrelated event observed without prior activation event';
    }

    const witness: TransitionWitness = {
      witnessId,
      witnessClass,
      sequenceNumber: this.sequenceCounter,
      timestamp,
      observedDelta,
      correlatedActivationEventId,
      temporalDeltaMs,
      isCausallyCorrelated,
      correlationExplanation,
    };

    this.witnesses.push(witness);
    return witness;
  }

  public getWitnesses(): TransitionWitness[] {
    return [...this.witnesses];
  }

  public clear(): void {
    this.witnesses = [];
    this.activeActivationEvent = null;
    this.sequenceCounter = 0;
  }
}

