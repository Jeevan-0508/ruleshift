import type { ReactElement } from 'react';
import type { RuleEngine } from '../engine/ruleEngine';
import type { GameObject } from '../engine/types';

const TILE = 64;
const GAP = 6;
const PAD = 16;
const ROBOT = 40;
const ROBOT_OFFSET = (TILE - ROBOT) / 2;

/** Renders the current world state. Pure presentational — no game logic here. */
export function Board({
  engine,
  onTileClick,
  robotEffect,
}: {
  engine: RuleEngine;
  onTileClick?: (x: number, y: number) => void;
  /** Transient visual flag driven by the caller watching recent engine events. */
  robotEffect?: 'teleport' | 'death' | null;
}) {
  const { level } = engine;
  const cells: ReactElement[] = [];

  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      const obj = engine.objects.find((o) => o.alive && o.pos.x === x && o.pos.y === y && o.kind !== 'PLAYER');
      const isExit = engine.exitPos.x === x && engine.exitPos.y === y;

      let content: ReactElement | null = null;
      if (isExit) {
        content = <div className={`exit-portal ${engine.exitHidden ? 'hidden' : ''}`} aria-label="exit" />;
      } else if (obj) {
        content = renderObject(obj);
      }

      cells.push(
        <div
          key={`${x},${y}`}
          className={`tile ${obj?.kind === 'WALL' ? 'wall' : ''}`}
          onClick={onTileClick ? () => onTileClick(x, y) : undefined}
          role={onTileClick ? 'button' : undefined}
        >
          {content}
        </div>,
      );
    }
  }

  const robotLeft = PAD + engine.playerPos.x * (TILE + GAP) + ROBOT_OFFSET;
  const robotTop = PAD + engine.playerPos.y * (TILE + GAP) + ROBOT_OFFSET;
  const robotClass = [
    'robot',
    engine.outcome === 'DEAD' ? 'dead' : '',
    robotEffect === 'teleport' ? 'teleporting' : '',
    robotEffect === 'death' ? 'shake' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className="board"
      style={{ gridTemplateColumns: `repeat(${level.width}, ${TILE}px)`, position: 'relative' }}
    >
      {cells}
      <div
        className={robotClass}
        style={{ position: 'absolute', left: robotLeft, top: robotTop }}
        role="img"
        aria-label="robot"
      >
        <div className="body">
          <div className="eyes">
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}

function renderObject(obj: GameObject | undefined) {
  if (!obj) return null;
  switch (obj.kind) {
    case 'BLUE':
      return <div className="orb blue" aria-label="blue" />;
    case 'RED':
      return <div className={`orb red ${obj.flags.has('DANGEROUS') ? 'danger' : ''}`} aria-label="red" />;
    case 'GREEN':
      return <div className="orb green" aria-label="green" />;
    case 'YELLOW':
      return <div className="orb yellow" aria-label="yellow" />;
    case 'WALL':
      return null;
    default:
      return null;
  }
}
