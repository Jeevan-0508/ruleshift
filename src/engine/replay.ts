import type { GameEvent, LevelDefinition } from './types';
import { RuleEngine, type Direction } from './ruleEngine';

export interface ReplayData {
  level: LevelDefinition;
  moves: Direction[];
  events: GameEvent[];
}

/** Re-simulates a recorded run from scratch and returns the resulting engine + events. */
export function replayRun(data: ReplayData): { engine: RuleEngine; events: readonly GameEvent[] } {
  const engine = new RuleEngine(data.level);
  for (const move of data.moves) {
    const outcome = engine.move(move);
    if (outcome === 'GOAL' || outcome === 'DEAD') break;
  }
  return { engine, events: engine.log.all() };
}

/** Verifies that replaying `moves` against a fresh engine reproduces the exact same event log. */
export function verifyReplayDeterminism(level: LevelDefinition, moves: Direction[], originalEvents: readonly GameEvent[]): boolean {
  const { events } = replayRun({ level, moves, events: [] });
  if (events.length !== originalEvents.length) return false;
  return events.every((e, i) => e.type === originalEvents[i].type && e.seq === originalEvents[i].seq);
}
