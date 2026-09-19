import { describe, it, expect } from 'vitest';
import { RuleEngine } from '../engine/ruleEngine';
import { replayRun, verifyReplayDeterminism } from '../engine/replay';
import { LEVEL_1 } from '../levels/handAuthored';

describe('replay', () => {
  it('replays a recorded run and reaches the same final outcome', () => {
    const engine = new RuleEngine(LEVEL_1);
    const moves = ['UP', 'UP', 'RIGHT', 'RIGHT', 'RIGHT', 'RIGHT', 'RIGHT', 'DOWN', 'DOWN'] as const;
    moves.forEach((m) => engine.move(m));
    expect(engine.outcome).toBe('GOAL');

    const { engine: replayed } = replayRun({ level: LEVEL_1, moves: [...moves], events: [] });
    expect(replayed.outcome).toBe('GOAL');
  });

  it('produces an identical event log type-sequence on replay', () => {
    const engine = new RuleEngine(LEVEL_1);
    const moves = ['RIGHT', 'RIGHT', 'RIGHT'] as const; // dies
    moves.forEach((m) => engine.move(m));
    const original = engine.log.all();
    const ok = verifyReplayDeterminism(LEVEL_1, [...moves], original);
    expect(ok).toBe(true);
  });
});
