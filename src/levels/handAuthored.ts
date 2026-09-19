import type { LevelDefinition } from '../engine/types';

/**
 * Three hand-tuned levels for the core campaign (World 01 & 02). Procedural
 * generation covers Daily Challenge and later worlds; these are curated so
 * the very first few minutes of the game are guaranteed to feel great.
 */
export const LEVEL_1: LevelDefinition = {
  id: 'w1-l1',
  seed: 100001,
  world: 1,
  name: 'First Contact',
  width: 6,
  height: 5,
  objects: [
    { id: 'player', kind: 'PLAYER', pos: { x: 0, y: 2 } },
    { id: 'blue-0', kind: 'BLUE', pos: { x: 2, y: 2 } },
    { id: 'red-0', kind: 'RED', pos: { x: 3, y: 2 } },
    { id: 'exit', kind: 'EXIT', pos: { x: 5, y: 2 } },
  ],
  rules: [
    {
      id: 'r1-danger',
      trigger: 'PLAYER_TOUCH',
      condition: { objectKind: 'BLUE' },
      target: 'RED',
      effect: 'BECOME_DANGEROUS',
      description: 'Touching blue makes red dangerous.',
    },
  ],
};

export const LEVEL_2: LevelDefinition = {
  id: 'w1-l2',
  seed: 100002,
  world: 1,
  name: 'The Green Door',
  width: 7,
  height: 5,
  objects: [
    { id: 'player', kind: 'PLAYER', pos: { x: 0, y: 2 } },
    { id: 'blue-0', kind: 'BLUE', pos: { x: 2, y: 1 } },
    { id: 'red-0', kind: 'RED', pos: { x: 2, y: 3 } },
    { id: 'green-0', kind: 'GREEN', pos: { x: 3, y: 2 }, linkTo: { x: 5, y: 0 } },
    { id: 'exit', kind: 'EXIT', pos: { x: 6, y: 2 } },
  ],
  rules: [
    {
      id: 'r2-danger',
      trigger: 'PLAYER_TOUCH',
      condition: { objectKind: 'BLUE' },
      target: 'RED',
      effect: 'BECOME_DANGEROUS',
      description: 'Touching blue makes red dangerous.',
    },
    {
      id: 'r2-teleport',
      trigger: 'PLAYER_TOUCH',
      condition: { objectKind: 'GREEN' },
      target: 'PLAYER',
      effect: 'TELEPORT_PLAYER',
      description: 'Green teleports you to a fixed location.',
    },
  ],
};

export const LEVEL_3: LevelDefinition = {
  id: 'w2-l1',
  seed: 100003,
  world: 2,
  name: 'Second Chances',
  width: 7,
  height: 6,
  objects: [
    { id: 'player', kind: 'PLAYER', pos: { x: 0, y: 3 } },
    { id: 'red-0', kind: 'RED', pos: { x: 3, y: 3 }, },
    { id: 'yellow-0', kind: 'YELLOW', pos: { x: 5, y: 1 } },
    { id: 'exit', kind: 'EXIT', pos: { x: 6, y: 3 } },
  ],
  rules: [
    {
      id: 'r3-always-dangerous',
      trigger: 'PLAYER_TOUCH',
      condition: { objectKind: 'RED' },
      target: 'RED',
      effect: 'BECOME_DANGEROUS',
      description: 'Red is dangerous from the start.',
    },
    {
      id: 'r3-gravity',
      trigger: 'DEATH_COUNT',
      condition: { count: 1 },
      target: 'PLAYER',
      effect: 'REVERSE_GRAVITY',
      description: 'Dying once reverses your vertical controls.',
    },
    {
      id: 'r3-safe-after-yellow',
      trigger: 'PLAYER_TOUCH',
      condition: { objectKind: 'YELLOW' },
      target: 'RED',
      effect: 'BECOME_SAFE',
      description: 'Touching yellow makes red safe again.',
    },
  ],
};

export const CAMPAIGN_LEVELS: LevelDefinition[] = [LEVEL_1, LEVEL_2, LEVEL_3];

export interface WorldDef {
  id: number;
  name: string;
  tagline: string;
  unlockedByDefault: boolean;
}

export const WORLDS: WorldDef[] = [
  { id: 1, name: 'First Contact', tagline: 'Basic rules. Nothing is quite what it looks like.', unlockedByDefault: true },
  { id: 2, name: 'The Shifting Grounds', tagline: 'Rules change after you act.', unlockedByDefault: false },
  { id: 3, name: 'Double Reality', tagline: 'Two rule systems, interacting.', unlockedByDefault: false },
  { id: 4, name: 'Causality', tagline: 'The past decides what happens next.', unlockedByDefault: false },
  { id: 5, name: 'Unknown', tagline: 'Everything you learned, recombined.', unlockedByDefault: false },
];
