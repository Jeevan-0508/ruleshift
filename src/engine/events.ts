import type { GameEvent, GameEventType } from './types';

/** Deterministic, append-only event log. Powers replay, timeline UI, and the death-clue screen. */
export class EventLog {
  private events: GameEvent[] = [];
  private seq = 0;
  private startedAt = 0;

  start(now: number = Date.now()): void {
    this.startedAt = now;
    this.events = [];
    this.seq = 0;
  }

  push(type: GameEventType, data: Record<string, unknown>, now: number = Date.now()): GameEvent {
    const event: GameEvent = { seq: this.seq++, t: now - this.startedAt, type, data };
    this.events.push(event);
    return event;
  }

  all(): readonly GameEvent[] {
    return this.events;
  }

  since(seq: number): GameEvent[] {
    return this.events.filter((e) => e.seq >= seq);
  }

  clear(): void {
    this.events = [];
    this.seq = 0;
  }
}
