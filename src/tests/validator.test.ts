import { describe, it, expect } from 'vitest';
import { validateLevel } from '../engine/validator';
import { LEVEL_1, CAMPAIGN_LEVELS } from '../levels/handAuthored';

describe('validateLevel', () => {
  it('confirms all three hand-authored campaign levels are solvable', () => {
    for (const level of CAMPAIGN_LEVELS) {
      const result = validateLevel(level);
      expect(result.solvable).toBe(true);
      expect(result.solutionPath).not.toBeNull();
    }
  });

  it('finds a short solution for level 1 that avoids the trap', () => {
    const result = validateLevel(LEVEL_1);
    expect(result.solvable).toBe(true);
    expect(result.solutionLength).toBeGreaterThan(0);
  });

  it('rejects a genuinely unsolvable level (exit walled off)', () => {
    const unsolvable = {
      ...LEVEL_1,
      objects: [
        { id: 'player', kind: 'PLAYER' as const, pos: { x: 0, y: 2 } },
        { id: 'exit', kind: 'EXIT' as const, pos: { x: 5, y: 2 } },
        { id: 'w1', kind: 'WALL' as const, pos: { x: 1, y: 0 } },
        { id: 'w2', kind: 'WALL' as const, pos: { x: 1, y: 1 } },
        { id: 'w3', kind: 'WALL' as const, pos: { x: 1, y: 2 } },
        { id: 'w4', kind: 'WALL' as const, pos: { x: 1, y: 3 } },
        { id: 'w5', kind: 'WALL' as const, pos: { x: 1, y: 4 } },
      ],
      rules: [],
    };
    const result = validateLevel(unsolvable);
    expect(result.solvable).toBe(false);
  });
});
