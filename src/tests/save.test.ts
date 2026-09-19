import { describe, it, expect, beforeEach } from 'vitest';
import { loadSave, writeSave, defaultSave } from '../engine/save';

describe('save/load', () => {
  beforeEach(() => localStorage.clear());

  it('returns defaults when nothing is saved', () => {
    expect(loadSave()).toEqual(defaultSave());
  });

  it('round-trips a written save', () => {
    const data = { ...defaultSave(), unlockedWorlds: [1, 2, 3] };
    writeSave(data);
    expect(loadSave().unlockedWorlds).toEqual([1, 2, 3]);
  });

  it('falls back to defaults on corrupted storage instead of crashing', () => {
    localStorage.setItem('ruleshift:save:v1', '{not valid json');
    expect(loadSave()).toEqual(defaultSave());
  });
});
