import type { GameEvent, Observation } from './types';

/**
 * Deterministic, non-LLM inference layer. Turns the raw event log into
 * human-readable observations, and tracks confidence until a discovery
 * is "confirmed" (evidence-gated, never revealed just because the player died).
 */
const CONFIRM_THRESHOLD = 2; // repeated evidence needed before we call it confirmed

export class InferenceEngine {
  private observations = new Map<string, Observation>();

  reset(): void {
    this.observations.clear();
  }

  /** Feed a batch of new events (since the last processed seq) and update observations. */
  ingest(events: readonly GameEvent[]): Observation[] {
    const newlyConfirmed: Observation[] = [];
    let lastTouchKind: string | null = null;

    for (const e of events) {
      if (e.type === 'TOUCH') {
        lastTouchKind = String(e.data.kind);
      }
      if (e.type === 'RULE_TRIGGER' && lastTouchKind) {
        const id = `${lastTouchKind}->${e.data.effect}`;
        const obs = this.observations.get(id) ?? {
          id,
          text: describeEffect(lastTouchKind, String(e.data.effect), String(e.data.target)),
          confirmed: false,
          evidenceCount: 0,
          relatedRuleId: String(e.data.ruleId),
        };
        obs.evidenceCount += 1;
        if (!obs.confirmed && obs.evidenceCount >= CONFIRM_THRESHOLD) {
          obs.confirmed = true;
          newlyConfirmed.push(obs);
        }
        this.observations.set(id, obs);
      }
      if (e.type === 'GRAVITY_FLIP') {
        const id = 'deaths->gravity';
        const obs = this.observations.get(id) ?? {
          id,
          text: 'Dying repeatedly seems to reverse gravity.',
          confirmed: false,
          evidenceCount: 0,
        };
        obs.evidenceCount += 1;
        obs.confirmed = true;
        this.observations.set(id, obs);
        newlyConfirmed.push(obs);
      }
    }
    return newlyConfirmed;
  }

  all(): Observation[] {
    return [...this.observations.values()].sort((a, b) => b.evidenceCount - a.evidenceCount);
  }

  confidence(id: string): number {
    const obs = this.observations.get(id);
    if (!obs) return 0;
    return Math.min(1, obs.evidenceCount / CONFIRM_THRESHOLD);
  }
}

function describeEffect(sourceKind: string, effect: string, target: string): string {
  const src = sourceKind.charAt(0) + sourceKind.slice(1).toLowerCase();
  switch (effect) {
    case 'BECOME_DANGEROUS':
      return `Touching ${src} seems to make ${target.toLowerCase()} dangerous.`;
    case 'BECOME_SAFE':
      return `Touching ${src} seems to make ${target.toLowerCase()} safe.`;
    case 'TELEPORT_PLAYER':
      return `Touching ${src} seems to teleport you.`;
    case 'DISAPPEAR':
      return `Touching ${src} makes something disappear.`;
    case 'MOVE_EXIT':
      return `Something about ${src} seems to move the exit.`;
    case 'REVEAL_EXIT':
      return `Something about ${src} reveals the exit.`;
    default:
      return `Touching ${src} triggers a change (${effect}).`;
  }
}
