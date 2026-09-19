import { describe, it, expect } from 'vitest';
import { RuleEngine } from '../engine/ruleEngine';
import { LEVEL_1, LEVEL_2, LEVEL_3 } from '../levels/handAuthored';

describe('RuleEngine — level 1 (blue makes red dangerous)', () => {
  it('lets the player walk past red safely if blue was never touched', () => {
    const engine = new RuleEngine(LEVEL_1);
    // go around via the top row, never touching blue or red
    ['UP', 'UP', 'RIGHT', 'RIGHT', 'RIGHT', 'RIGHT', 'RIGHT', 'DOWN', 'DOWN'].forEach((d) =>
      engine.move(d as any),
    );
    expect(engine.outcome).toBe('GOAL');
  });

  it('kills the player who touches blue then walks straight into red', () => {
    const engine = new RuleEngine(LEVEL_1);
    engine.move('RIGHT'); // touch blue at (2,2)... player starts (0,2), first move to (1,2)
    engine.move('RIGHT'); // now at blue (2,2)
    engine.move('RIGHT'); // now at red (3,2) -> should be dangerous now
    expect(engine.outcome).toBe('DEAD');
    expect(engine.deaths).toBe(1);
  });

  it('is deterministic: same moves always produce the same outcome and event log shape', () => {
    const run = () => {
      const engine = new RuleEngine(LEVEL_1);
      const moves = ['RIGHT', 'RIGHT', 'RIGHT'] as const;
      moves.forEach((m) => engine.move(m));
      return { outcome: engine.outcome, events: engine.log.all().map((e) => e.type) };
    };
    const a = run();
    const b = run();
    expect(a).toEqual(b);
  });

  it('respawn resets the world but keeps the cumulative death count', () => {
    const engine = new RuleEngine(LEVEL_1);
    engine.move('RIGHT');
    engine.move('RIGHT');
    engine.move('RIGHT'); // dies
    expect(engine.deaths).toBe(1);
    engine.respawn();
    expect(engine.playerPos).toEqual({ x: 0, y: 2 });
    expect(engine.deaths).toBe(1); // not reset
    const redObj = engine.objects.find((o) => o.id === 'red-0')!;
    expect(redObj.flags.has('DANGEROUS')).toBe(false); // world flags DID reset
  });

  it('bumping into a wall does not move the player', () => {
    const engine = new RuleEngine(LEVEL_1);
    const before = { ...engine.playerPos };
    engine.move('LEFT'); // off the left edge
    expect(engine.playerPos).toEqual(before);
  });
});

describe('RuleEngine — level 2 (teleport)', () => {
  it('teleports the player to the linked destination on touching green', () => {
    const engine = new RuleEngine(LEVEL_2);
    // player (0,2) -> green (3,2): RIGHT x3
    engine.move('RIGHT');
    engine.move('RIGHT');
    engine.move('RIGHT');
    expect(engine.playerPos).toEqual({ x: 5, y: 0 });
  });
});

describe('RuleEngine — level 3 (death count reverses gravity)', () => {
  it('reverses gravity after the first death', () => {
    const engine = new RuleEngine(LEVEL_3);
    engine.move('RIGHT');
    engine.move('RIGHT');
    engine.move('RIGHT'); // walks into red at (3,3) -> dies
    expect(engine.outcome).toBe('DEAD');
    expect(engine.gravityReversed).toBe(true);
  });
});
