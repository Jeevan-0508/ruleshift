import type { LevelDefinition } from './types';
import { RuleEngine, type Direction } from './ruleEngine';

const DIRS: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

/**
 * Brute-force BFS over the *actual* RuleEngine to prove a level is solvable.
 * State signature includes player position, deaths, gravity, exit position,
 * and which objects are alive/dangerous — so it correctly accounts for rules
 * that change the world as you play, not just static geometry.
 */
export interface ValidationResult {
  solvable: boolean;
  solutionLength: number | null;
  solutionPath: Direction[] | null;
  statesExplored: number;
}

export function validateLevel(level: LevelDefinition, maxStates = 60000, maxDeaths = 6): ValidationResult {
  const start = new RuleEngine(level);

  type Frame = { engine: RuleEngine; path: Direction[] };
  const seen = new Set<string>();
  const queue: Frame[] = [{ engine: start, path: [] }];
  let statesExplored = 0;

  const signature = (e: RuleEngine): string => {
    const objSig = e.objects
      .map((o) => `${o.id}:${o.alive ? 1 : 0}:${[...o.flags].sort().join(',')}:${o.pos.x},${o.pos.y}`)
      .join('|');
    return `${e.playerPos.x},${e.playerPos.y}|${e.deaths}|${e.gravityReversed}|${e.exitHidden}|${objSig}`;
  };

  while (queue.length > 0) {
    const { engine, path } = queue.shift()!;
    statesExplored++;
    if (statesExplored > maxStates) {
      return { solvable: false, solutionLength: null, solutionPath: null, statesExplored };
    }
    if (path.length > 200) continue;

    for (const dir of DIRS) {
      const clone = cloneEngine(engine);
      const outcome = clone.move(dir);
      const nextPath = [...path, dir];

      if (outcome === 'GOAL') {
        return { solvable: true, solutionLength: nextPath.length, solutionPath: nextPath, statesExplored };
      }
      if (outcome === 'DEAD') {
        if (clone.deaths > maxDeaths) continue;
        clone.respawn();
      }
      const sig = signature(clone);
      if (seen.has(sig)) continue;
      seen.add(sig);
      queue.push({ engine: clone, path: nextPath });
    }
  }
  return { solvable: false, solutionLength: null, solutionPath: null, statesExplored };
}

function cloneEngine(e: RuleEngine): RuleEngine {
  const clone = new RuleEngine(e.level);
  clone.objects = e.objects.map((o) => ({ ...o, pos: { ...o.pos }, flags: new Set(o.flags) }));
  clone.playerPos = { ...e.playerPos };
  clone.exitPos = { ...e.exitPos };
  clone.deaths = e.deaths;
  clone.moveHistory = [...e.moveHistory];
  clone.gravityReversed = e.gravityReversed;
  clone.exitHidden = e.exitHidden;
  clone.firedThisAttempt = new Set(e.firedThisAttempt);
  clone.outcome = e.outcome;
  clone.secondsRemaining = e.secondsRemaining;
  return clone;
}
