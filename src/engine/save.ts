export interface SaveData {
  unlockedWorlds: number[];
  bestTimesMs: Record<string, number>; // levelId/dailyDate -> ms
  discoveredRuleIds: string[];
  dailyResults: Record<string, { seed: number; timeMs: number; deaths: number; rulesFound: number }>;
  muted: boolean;
  reducedMotion: boolean;
}

const KEY = 'ruleshift:save:v1';

export function defaultSave(): SaveData {
  return {
    unlockedWorlds: [1],
    bestTimesMs: {},
    discoveredRuleIds: [],
    dailyResults: {},
    muted: false,
    reducedMotion: false,
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    // shallow-merge over defaults so a partially-corrupt or older save never crashes the app
    return { ...defaultSave(), ...parsed };
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // storage unavailable (private mode / quota) — fail silently, game still playable
  }
}
