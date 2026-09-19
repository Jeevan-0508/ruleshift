import { describe, it, expect } from 'vitest';
import { SeededRandom, seedFromString, dailySeed } from '../engine/seededRandom';

describe('SeededRandom', () => {
  it('produces identical sequences for the same seed', () => {
    const a = new SeededRandom(1234);
    const b = new SeededRandom(1234);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = new SeededRandom(1);
    const b = new SeededRandom(2);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it('int() stays within bounds inclusive', () => {
    const r = new SeededRandom(42);
    for (let i = 0; i < 500; i++) {
      const v = r.int(3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
    }
  });

  it('seedFromString is deterministic', () => {
    expect(seedFromString('hello')).toBe(seedFromString('hello'));
    expect(seedFromString('hello')).not.toBe(seedFromString('world'));
  });

  it('dailySeed is stable for the same UTC date', () => {
    const d1 = dailySeed(new Date('2026-09-19T01:00:00Z'));
    const d2 = dailySeed(new Date('2026-09-19T23:00:00Z'));
    expect(d1.seed).toBe(d2.seed);
    expect(d1.label).toBe('2026-09-19');
  });

  it('dailySeed differs across dates', () => {
    const d1 = dailySeed(new Date('2026-09-19T01:00:00Z'));
    const d2 = dailySeed(new Date('2026-09-20T01:00:00Z'));
    expect(d1.seed).not.toBe(d2.seed);
  });
});
