import type {
  GameObject,
  LevelDefinition,
  Rule,
  Vec2,
  ObjectFlag,
} from './types';
import { EventLog } from './events';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
const DELTA: Record<Direction, Vec2> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};
const OPPOSITE: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

export type EngineOutcome = 'ALIVE' | 'DEAD' | 'GOAL';

/**
 * Runs a single level. Owns world state, applies rules, and logs every event.
 * Pure and deterministic given (level, sequence of moves) — no wall-clock
 * dependence in the simulation itself, which is what makes replay exact.
 */
export class RuleEngine {
  level: LevelDefinition;
  objects: GameObject[] = [];
  playerPos: Vec2 = { x: 0, y: 0 };
  exitPos: Vec2 = { x: 0, y: 0 };
  deaths = 0;
  moveHistory: Direction[] = [];
  gravityReversed = false;
  exitHidden = false;
  firedThisAttempt = new Set<string>();
  log = new EventLog();
  outcome: EngineOutcome = 'ALIVE';
  secondsRemaining: number;

  constructor(level: LevelDefinition) {
    this.level = level;
    this.secondsRemaining = level.timerSeconds ?? Infinity;
    this.hardReset();
  }

  /** Full reset: new level attempt, deaths counter preserved (it's cumulative by design). */
  private resetWorld(): void {
    this.objects = this.level.objects.map((o) => ({
      ...o,
      pos: { ...o.pos },
      alive: true,
      flags: new Set<ObjectFlag>(),
    }));
    const player = this.objects.find((o) => o.kind === 'PLAYER');
    const exit = this.objects.find((o) => o.kind === 'EXIT');
    if (!player || !exit) throw new Error('Level must contain PLAYER and EXIT');
    this.playerPos = { ...player.pos };
    this.exitPos = { ...exit.pos };
    this.gravityReversed = false;
    this.exitHidden = false;
    this.firedThisAttempt = new Set();
    this.moveHistory = [];
    this.outcome = 'ALIVE';
    this.secondsRemaining = this.level.timerSeconds ?? Infinity;
  }

  hardReset(): void {
    this.deaths = 0;
    this.log.start();
    this.resetWorld();
  }

  respawn(): void {
    this.resetWorld();
    this.log.push('RESPAWN', { deaths: this.deaths });
  }

  tick(dtSeconds: number): void {
    if (this.outcome !== 'ALIVE') return;
    if (this.secondsRemaining === Infinity) return;
    this.secondsRemaining = Math.max(0, this.secondsRemaining - dtSeconds);
    this.checkTimerRules();
  }

  private objectAt(pos: Vec2): GameObject | undefined {
    return this.objects.find((o) => o.alive && o.pos.x === pos.x && o.pos.y === pos.y);
  }

  private isWall(pos: Vec2): boolean {
    if (pos.x < 0 || pos.y < 0 || pos.x >= this.level.width || pos.y >= this.level.height) return true;
    const o = this.objectAt(pos);
    return !!o && o.kind === 'WALL';
  }

  private rulesFor(trigger: Rule['trigger']): Rule[] {
    return this.level.rules.filter((r) => r.trigger === trigger);
  }

  private applyEffect(rule: Rule, contextObject?: GameObject): void {
    const targets =
      rule.target === 'PLAYER' || rule.target === 'EXIT'
        ? []
        : this.objects.filter((o) => o.kind === rule.target && o.alive);

    switch (rule.effect) {
      case 'BECOME_DANGEROUS':
        targets.forEach((t) => t.flags.add('DANGEROUS'));
        break;
      case 'BECOME_SAFE':
        targets.forEach((t) => {
          t.flags.delete('DANGEROUS');
          t.flags.add('SAFE');
        });
        break;
      case 'DISAPPEAR':
        targets.forEach((t) => (t.alive = false));
        break;
      case 'TELEPORT_PLAYER': {
        const dx = rule.params?.dx ?? 0;
        const dy = rule.params?.dy ?? 0;
        const dest = contextObject?.linkTo ?? { x: this.playerPos.x + dx, y: this.playerPos.y + dy };
        this.playerPos = { ...dest };
        this.log.push('TELEPORT', { to: dest, ruleId: rule.id });
        break;
      }
      case 'REVERSE_GRAVITY':
        this.gravityReversed = !this.gravityReversed;
        this.log.push('GRAVITY_FLIP', { reversed: this.gravityReversed });
        break;
      case 'MOVE_EXIT': {
        const dx = rule.params?.dx ?? 1;
        const dy = rule.params?.dy ?? 0;
        const exitObj = this.objects.find((o) => o.kind === 'EXIT');
        if (exitObj) {
          exitObj.pos.x = Math.max(0, Math.min(this.level.width - 1, exitObj.pos.x + dx));
          exitObj.pos.y = Math.max(0, Math.min(this.level.height - 1, exitObj.pos.y + dy));
          this.exitPos = { ...exitObj.pos };
        }
        break;
      }
      case 'REVEAL_EXIT':
        this.exitHidden = false;
        break;
      case 'HIDE_EXIT':
        this.exitHidden = true;
        break;
      case 'UNLOCK':
        targets.forEach((t) => t.flags.delete('LOCKED'));
        break;
    }
    this.log.push('RULE_TRIGGER', { ruleId: rule.id, effect: rule.effect, target: rule.target });
    this.firedThisAttempt.add(rule.id);
  }

  private checkTimerRules(): void {
    this.rulesFor('TIMER_BELOW').forEach((r) => {
      const threshold = r.condition.count ?? 0;
      const key = `${r.id}`;
      if (this.secondsRemaining < threshold && !this.firedThisAttempt.has(key)) {
        this.applyEffect(r);
      }
    });
  }

  private checkDeathCountRules(): void {
    this.rulesFor('DEATH_COUNT').forEach((r) => {
      if (this.deaths >= (r.condition.count ?? 0) && !this.firedThisAttempt.has(r.id)) {
        this.applyEffect(r);
      }
    });
  }

  private checkDirectionRules(dir: Direction): void {
    this.rulesFor('MOVE_DIRECTION').forEach((r) => {
      if (r.condition.direction === dir) this.applyEffect(r);
    });
  }

  private handleTouch(obj: GameObject, depth = 0): void {
    if (depth > 8) return; // guard against pathological teleport loops
    this.log.push('TOUCH', { objectId: obj.id, kind: obj.kind });
    this.rulesFor('PLAYER_TOUCH')
      .filter((r) => r.condition.objectKind === obj.kind)
      .forEach((r) => this.applyEffect(r, obj));

    if (obj.flags.has('TELEPORTER')) {
      // position already updated by applyEffect(TELEPORT_PLAYER); re-check landing tile
      const landing = this.objectAt(this.playerPos);
      if (landing && landing.id !== obj.id) this.handleTouch(landing, depth + 1);
      return;
    }
    if (obj.flags.has('DANGEROUS')) {
      this.die();
    }
  }

  private die(): void {
    this.outcome = 'DEAD';
    this.deaths += 1;
    this.log.push('DEATH', { pos: { ...this.playerPos }, deaths: this.deaths });
  }

  /** Attempt to move the player one tile. Returns the outcome after resolving all triggered rules. */
  move(dir: Direction): EngineOutcome {
    if (this.outcome !== 'ALIVE') return this.outcome;

    const effectiveDir = this.gravityReversed && (dir === 'UP' || dir === 'DOWN') ? OPPOSITE[dir] : dir;
    const delta = DELTA[effectiveDir];
    const next: Vec2 = { x: this.playerPos.x + delta.x, y: this.playerPos.y + delta.y };

    this.moveHistory.push(dir);
    this.log.push('MOVE', { dir, from: { ...this.playerPos }, to: next });

    // "moved backwards" = immediately reversed the previous move
    const prev = this.moveHistory[this.moveHistory.length - 2];
    if (prev && OPPOSITE[prev] === dir) {
      this.rulesFor('MOVE_DIRECTION')
        .filter((r) => r.condition.direction === 'BACKWARDS')
        .forEach((r) => this.applyEffect(r));
    }
    this.checkDirectionRules(dir);

    if (this.isWall(next)) {
      return this.outcome; // bumped into a wall; no state change beyond the log
    }
    this.playerPos = next;

    if (!this.exitHidden && next.x === this.exitPos.x && next.y === this.exitPos.y) {
      const exitObj = this.objects.find((o) => o.kind === 'EXIT');
      if (!exitObj?.flags.has('LOCKED')) {
        this.outcome = 'GOAL';
        this.log.push('GOAL', { pos: { ...next } });
        return this.outcome;
      }
    }

    const obj = this.objectAt(next);
    if (obj && obj.kind !== 'EXIT') {
      this.handleTouch(obj);
    }

    if ((this.outcome as EngineOutcome) === 'DEAD') {
      this.checkDeathCountRules();
    }

    return this.outcome;
  }

  snapshot() {
    return {
      objects: this.objects.map((o) => ({ ...o, flags: new Set(o.flags) })),
      playerPos: { ...this.playerPos },
      exitPos: { ...this.exitPos },
      exitHidden: this.exitHidden,
      gravityReversed: this.gravityReversed,
      deaths: this.deaths,
      outcome: this.outcome,
      secondsRemaining: this.secondsRemaining,
    };
  }
}
