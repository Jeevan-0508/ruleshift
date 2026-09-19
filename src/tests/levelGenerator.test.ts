import { describe, it, expect } from 'vitest';
import { generateLevel } from '../engine/levelGenerator';
import { validateLevel } from '../engine/validator';

describe('generateLevel', () => {
  it('is deterministic: same seed produces an identical level', () => {
    const a = generateLevel({ seed: 847291, world: 1, difficulty: 3, ruleCount: 3 });
    const b = generateLevel({ seed: 847291, world: 1, difficulty: 3, ruleCount: 3 });
    expect(a).toEqual(b);
  });

  it('produces different levels for different seeds', () => {
    const a = generateLevel({ seed: 1, world: 1, difficulty: 2, ruleCount: 2 });
    const b = generateLevel({ seed: 2, world: 1, difficulty: 2, ruleCount: 2 });
    expect(a).not.toEqual(b);
  });

  it('every generated level (several seeds) is validated solvable', () => {
    const seeds = [1, 42, 847291, 555555, 99];
    for (const seed of seeds) {
      const level = generateLevel({ seed, world: 1, difficulty: 3, ruleCount: 3 });
      const result = validateLevel(level);
      expect(result.solvable).toBe(true);
    }
  });

  it('always includes exactly one PLAYER and one EXIT', () => {
    const level = generateLevel({ seed: 777, world: 2, difficulty: 4, ruleCount: 3 });
    expect(level.objects.filter((o) => o.kind === 'PLAYER')).toHaveLength(1);
    expect(level.objects.filter((o) => o.kind === 'EXIT')).toHaveLength(1);
  });
});
