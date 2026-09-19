// ============================================================================
// RULESHIFT core types. The rule grammar is data, not code — this is what
// makes levels composable, generatable, and testable.
// ============================================================================

export type Vec2 = { x: number; y: number };

export type ObjectKind =
  | 'PLAYER'
  | 'EXIT'
  | 'WALL'
  | 'BLUE'
  | 'RED'
  | 'GREEN'
  | 'YELLOW'
  | 'KEY'
  | 'PORTAL_A'
  | 'PORTAL_B';

/** Dynamic flags an object can carry. These are what rules toggle. */
export type ObjectFlag = 'DANGEROUS' | 'SAFE' | 'TELEPORTER' | 'HIDDEN' | 'LOCKED';

export interface GameObject {
  id: string;
  kind: ObjectKind;
  pos: Vec2;
  alive: boolean;
  flags: Set<ObjectFlag>;
  /** Where this object leads to, if it's a teleporter/portal. */
  linkTo?: Vec2;
}

// ---- Rule grammar ---------------------------------------------------------

export type TriggerType =
  | 'PLAYER_TOUCH' // player enters a tile occupied by an object of `objectKind`
  | 'OBJECT_TOUCH' // one non-player object enters another's tile
  | 'DEATH_COUNT' // player has died >= `count` times
  | 'TIMER_BELOW' // remaining seconds < `count`
  | 'MOVE_DIRECTION' // player's last move matched `direction`
  | 'RULE_FIRED'; // another rule (by id) already fired this run

export type EffectType =
  | 'BECOME_DANGEROUS'
  | 'BECOME_SAFE'
  | 'TELEPORT_PLAYER'
  | 'DISAPPEAR'
  | 'REVERSE_GRAVITY'
  | 'MOVE_EXIT'
  | 'REVEAL_EXIT'
  | 'HIDE_EXIT'
  | 'UNLOCK';

export interface RuleCondition {
  objectKind?: ObjectKind;
  count?: number;
  direction?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'BACKWARDS';
  ruleId?: string;
}

export interface Rule {
  id: string;
  trigger: TriggerType;
  condition: RuleCondition;
  /** What the effect applies to. A kind (all objects of that kind), or PLAYER/EXIT. */
  target: ObjectKind | 'PLAYER' | 'EXIT';
  effect: EffectType;
  /** Free-form effect parameters, e.g. teleport destination or exit offset. */
  params?: Record<string, number>;
  /** Human-readable description, only shown once discovered. */
  description: string;
}

// ---- World / level ---------------------------------------------------------

export interface LevelDefinition {
  id: string;
  seed: number;
  world: number;
  name: string;
  width: number;
  height: number;
  objects: Omit<GameObject, 'alive' | 'flags'>[];
  rules: Rule[];
  maxAttemptsHint?: number;
  timerSeconds?: number;
}

// ---- Events -----------------------------------------------------------------

export type GameEventType =
  | 'MOVE'
  | 'TOUCH'
  | 'RULE_TRIGGER'
  | 'TELEPORT'
  | 'DEATH'
  | 'RESPAWN'
  | 'GOAL'
  | 'GRAVITY_FLIP';

export interface GameEvent {
  seq: number;
  t: number; // ms since level start
  type: GameEventType;
  data: Record<string, unknown>;
}

// ---- Game state machine ------------------------------------------------------

export type GamePhase =
  | 'MENU'
  | 'WORLD_SELECT'
  | 'LEVEL_INTRO'
  | 'PLAYING'
  | 'DISCOVERY'
  | 'SUCCESS'
  | 'DEATH'
  | 'RESULT'
  | 'REPLAY';

export interface Observation {
  id: string;
  text: string;
  confirmed: boolean; // true once evidence is strong enough to call it a discovery
  evidenceCount: number;
  relatedRuleId?: string;
}

export interface Hypothesis {
  id: string;
  text: string;
  status: 'unknown' | 'supported' | 'contradicted';
}
