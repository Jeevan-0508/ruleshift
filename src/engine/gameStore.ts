import { create } from 'zustand';
import type { GamePhase, LevelDefinition, Observation } from './types';
import { RuleEngine, type Direction } from './ruleEngine';
import { InferenceEngine } from './inferenceEngine';
import { loadSave, writeSave, type SaveData } from './save';
import { dailySeed } from './seededRandom';
import { generateLevel } from './levelGenerator';
import { CAMPAIGN_LEVELS } from '../levels/handAuthored';

export interface DeathInfo {
  timeline: { t: number; label: string }[];
}

interface StoreState {
  phase: GamePhase;
  level: LevelDefinition | null;
  engine: RuleEngine | null;
  inference: InferenceEngine;
  observations: Observation[];
  moves: Direction[];
  campaignIndex: number;
  attempts: number;
  levelStartMs: number;
  elapsedMs: number;
  lastDeathInfo: DeathInfo | null;
  discoveryQueue: Observation[];
  save: SaveData;
  isDaily: boolean;
  /** Bumped on every engine mutation so components re-render even when the engine
   *  object reference itself (mutated in place, not replaced) doesn't change. */
  frame: number;

  startCampaignLevel: (index: number) => void;
  startDaily: () => void;
  move: (dir: Direction) => void;
  tick: (dtSeconds: number) => void;
  acknowledgeDiscovery: () => void;
  respawn: () => void;
  restartLevel: () => void;
  nextLevel: () => void;
  goToMenu: () => void;
  goToWorldSelect: () => void;
  setPhase: (phase: GamePhase) => void;
  toggleMute: () => void;
}

function timelineFromEngine(engine: RuleEngine): DeathInfo {
  const events = engine.log.all();
  const labelFor = (e: (typeof events)[number]): string => {
    switch (e.type) {
      case 'MOVE':
        return `moved ${e.data.dir}`;
      case 'TOUCH':
        return `touched ${e.data.kind}`;
      case 'RULE_TRIGGER':
        return `rule fired: ${e.data.effect} on ${e.data.target}`;
      case 'TELEPORT':
        return 'teleported';
      case 'DEATH':
        return 'destroyed';
      case 'GRAVITY_FLIP':
        return 'gravity reversed';
      default:
        return e.type.toLowerCase();
    }
  };
  return { timeline: events.map((e) => ({ t: e.t, label: labelFor(e) })) };
}

export const useGameStore = create<StoreState>((set, get) => ({
  phase: 'MENU',
  level: null,
  engine: null,
  inference: new InferenceEngine(),
  observations: [],
  moves: [],
  campaignIndex: 0,
  attempts: 0,
  levelStartMs: 0,
  elapsedMs: 0,
  lastDeathInfo: null,
  discoveryQueue: [],
  save: loadSave(),
  isDaily: false,
  frame: 0,

  startCampaignLevel: (index) => {
    const level = CAMPAIGN_LEVELS[index];
    if (!level) return;
    const engine = new RuleEngine(level);
    get().inference.reset();
    set({
      phase: 'PLAYING',
      level,
      engine,
      observations: [],
      moves: [],
      campaignIndex: index,
      attempts: 1,
      levelStartMs: Date.now(),
      elapsedMs: 0,
      isDaily: false,
      lastDeathInfo: null,
    });
  },

  startDaily: () => {
    const { seed } = dailySeed();
    const level = generateLevel({ seed, world: 1, difficulty: 3, ruleCount: 3 });
    const engine = new RuleEngine(level);
    get().inference.reset();
    set({
      phase: 'PLAYING',
      level,
      engine,
      observations: [],
      moves: [],
      attempts: 1,
      levelStartMs: Date.now(),
      elapsedMs: 0,
      isDaily: true,
      lastDeathInfo: null,
    });
  },

  move: (dir) => {
    const { engine, inference, moves } = get();
    if (!engine || get().phase !== 'PLAYING') return;
    const outcome = engine.move(dir);
    const newMoves = [...moves, dir];
    const newlyConfirmed = inference.ingest(engine.log.all());
    const observations = inference.all();

    if (outcome === 'DEAD') {
      const deathInfo = timelineFromEngine(engine);
      set({ moves: newMoves, observations, lastDeathInfo: deathInfo, phase: 'DEATH', attempts: get().attempts + 1, frame: get().frame + 1 });
      return;
    }
    if (outcome === 'GOAL') {
      const timeMs = Date.now() - get().levelStartMs;
      const { level, isDaily, save } = get();
      const key = isDaily ? `daily:${dailySeed().label}` : level!.id;
      const nextSave: SaveData = {
        ...save,
        bestTimesMs: {
          ...save.bestTimesMs,
          [key]: Math.min(save.bestTimesMs[key] ?? Infinity, timeMs),
        },
      };
      if (isDaily) {
        nextSave.dailyResults[dailySeed().label] = {
          seed: level!.seed,
          timeMs,
          deaths: engine.deaths,
          rulesFound: observations.filter((o) => o.confirmed).length,
        };
      }
      writeSave(nextSave);
      set({ moves: newMoves, observations, phase: 'RESULT', elapsedMs: timeMs, save: nextSave, frame: get().frame + 1 });
      return;
    }
    if (newlyConfirmed.length > 0) {
      set({ moves: newMoves, observations, discoveryQueue: newlyConfirmed, phase: 'DISCOVERY', frame: get().frame + 1 });
      return;
    }
    set({ moves: newMoves, observations, frame: get().frame + 1 });
  },

  tick: (dtSeconds) => {
    const { engine, phase } = get();
    if (!engine || phase !== 'PLAYING') return;
    engine.tick(dtSeconds);
    set({ elapsedMs: Date.now() - get().levelStartMs });
  },

  acknowledgeDiscovery: () => set({ phase: 'PLAYING', discoveryQueue: [] }),

  respawn: () => {
    const { engine } = get();
    if (!engine) return;
    engine.respawn();
    set({ phase: 'PLAYING', frame: get().frame + 1 });
  },

  restartLevel: () => {
    const { level, isDaily } = get();
    if (!level) return;
    if (isDaily) get().startDaily();
    else get().startCampaignLevel(get().campaignIndex);
  },

  nextLevel: () => {
    const nextIndex = get().campaignIndex + 1;
    if (nextIndex < CAMPAIGN_LEVELS.length) {
      get().startCampaignLevel(nextIndex);
    } else {
      set({ phase: 'WORLD_SELECT' });
    }
  },

  goToMenu: () => set({ phase: 'MENU' }),
  goToWorldSelect: () => set({ phase: 'WORLD_SELECT' }),
  setPhase: (phase) => set({ phase }),
  toggleMute: () => {
    const save = { ...get().save, muted: !get().save.muted };
    writeSave(save);
    set({ save });
  },
}));
