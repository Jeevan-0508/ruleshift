import type { LevelDefinition, ObjectKind, Rule } from './types';
import { SeededRandom } from './seededRandom';
import { validateLevel } from './validator';

export interface GenerationParams {
  seed: number;
  world: number;
  difficulty: number; // 1..5
  ruleCount: number; // desired hidden-rule count
}

const RULE_KINDS: ObjectKind[] = ['BLUE', 'RED', 'GREEN', 'YELLOW'];

/** Rule templates. The generator instantiates a subset of these per seed. */
function buildRuleCandidates(rng: SeededRandom, kinds: ObjectKind[]): Rule[] {
  const [a, b, c, d] = kinds;
  const pool: Rule[] = [
    {
      id: 'r-danger',
      trigger: 'PLAYER_TOUCH',
      condition: { objectKind: a },
      target: b,
      effect: 'BECOME_DANGEROUS',
      description: `Touching ${a} makes ${b} dangerous.`,
    },
    {
      id: 'r-teleport',
      trigger: 'PLAYER_TOUCH',
      condition: { objectKind: c },
      target: 'PLAYER',
      effect: 'TELEPORT_PLAYER',
      description: `${c} teleports the player.`,
    },
    {
      id: 'r-gravity',
      trigger: 'DEATH_COUNT',
      condition: { count: 2 },
      target: 'PLAYER',
      effect: 'REVERSE_GRAVITY',
      description: 'Dying twice reverses gravity.',
    },
    {
      id: 'r-exit-move',
      trigger: 'TIMER_BELOW',
      condition: { count: 10 },
      target: 'EXIT',
      effect: 'MOVE_EXIT',
      params: { dx: 1, dy: 0 },
      description: 'When time runs low, the exit moves.',
    },
    {
      id: 'r-safe-after-touch',
      trigger: 'PLAYER_TOUCH',
      condition: { objectKind: d },
      target: a,
      effect: 'BECOME_SAFE',
      description: `Touching ${d} makes ${a} safe.`,
    },
    {
      id: 'r-backwards-reveal',
      trigger: 'MOVE_DIRECTION',
      condition: { direction: 'BACKWARDS' },
      target: 'EXIT',
      effect: 'REVEAL_EXIT',
      description: 'Moving backwards reveals the exit.',
    },
  ];
  return rng.shuffle(pool);
}

/** Deterministically builds a level from a seed. Rejects & retries on unsolvable output. */
export function generateLevel(params: GenerationParams): LevelDefinition {
  const width = 6 + Math.min(2, Math.floor(params.difficulty / 2));
  const height = 5 + Math.min(2, Math.floor(params.difficulty / 3));

  for (let attempt = 0; attempt < 25; attempt++) {
    const rng = new SeededRandom(params.seed + attempt * 7919);
    const kinds = rng.shuffle(RULE_KINDS);
    const candidates = buildRuleCandidates(rng, kinds);
    const rules = candidates.slice(0, Math.max(1, Math.min(params.ruleCount, candidates.length)));

    const occupied = new Set<string>();
    const key = (x: number, y: number) => `${x},${y}`;

    const placeRandom = (): { x: number; y: number } => {
      let x = 0;
      let y = 0;
      do {
        x = rng.int(0, width - 1);
        y = rng.int(0, height - 1);
      } while (occupied.has(key(x, y)));
      occupied.add(key(x, y));
      return { x, y };
    };

    const playerPos = { x: 0, y: Math.floor(height / 2) };
    occupied.add(key(playerPos.x, playerPos.y));
    const exitPos = { x: width - 1, y: Math.floor(height / 2) };
    occupied.add(key(exitPos.x, exitPos.y));

    const objects: LevelDefinition['objects'] = [
      { id: 'player', kind: 'PLAYER', pos: playerPos },
      { id: 'exit', kind: 'EXIT', pos: exitPos },
    ];

    const usedKinds = new Set(rules.flatMap((r) => [r.condition.objectKind, r.target]).filter(Boolean));
    let teleportSourceId: string | undefined;
    let teleportDestPos: { x: number; y: number } | undefined;

    kinds.forEach((kind, i) => {
      if (!usedKinds.has(kind)) return;
      const pos = placeRandom();
      const id = `${kind.toLowerCase()}-${i}`;
      objects.push({ id, kind, pos });
      if (rules.some((r) => r.effect === 'TELEPORT_PLAYER' && r.condition.objectKind === kind)) {
        teleportSourceId = id;
      }
    });

    if (teleportSourceId) {
      teleportDestPos = placeRandom();
      const obj = objects.find((o) => o.id === teleportSourceId)!;
      (obj as any).linkTo = teleportDestPos;
    }

    // sprinkle a couple of walls for spatial texture (never blocking every path)
    const wallCount = Math.min(3, params.difficulty);
    for (let i = 0; i < wallCount; i++) {
      const pos = placeRandom();
      objects.push({ id: `wall-${i}`, kind: 'WALL', pos });
    }

    const level: LevelDefinition = {
      id: `gen-${params.seed}`,
      seed: params.seed,
      world: params.world,
      name: `Sector ${params.seed % 1000}`,
      width,
      height,
      objects,
      rules,
      timerSeconds: rules.some((r) => r.trigger === 'TIMER_BELOW') ? 45 : undefined,
    };

    const result = validateLevel(level);
    if (result.solvable) return level;
  }

  // Deterministic fallback: a trivially solvable, still rule-bearing level.
  return fallbackLevel(params.seed, params.world);
}

function fallbackLevel(seed: number, world: number): LevelDefinition {
  return {
    id: `gen-${seed}-fallback`,
    seed,
    world,
    name: `Sector ${seed % 1000}`,
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
        id: 'r-danger',
        trigger: 'PLAYER_TOUCH',
        condition: { objectKind: 'BLUE' },
        target: 'RED',
        effect: 'BECOME_DANGEROUS',
        description: 'Touching blue makes red dangerous.',
      },
    ],
  };
}
