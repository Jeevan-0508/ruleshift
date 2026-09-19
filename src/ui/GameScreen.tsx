import { useEffect, useRef } from 'react';
import { useGameStore } from '../engine/gameStore';
import { Board } from '../game/Board';
import { HUD } from './HUD';
import { ObservationsPanel } from './ObservationsPanel';
import { DiscoveryModal } from './DiscoveryModal';
import { DeathModal } from './DeathModal';
import { ResultModal } from './ResultModal';
import type { Direction } from '../engine/ruleEngine';

const KEY_MAP: Record<string, Direction> = {
  ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
  w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
  W: 'UP', S: 'DOWN', A: 'LEFT', D: 'RIGHT',
};

export function GameScreen() {
  const engine = useGameStore((s) => s.engine);
  const move = useGameStore((s) => s.move);
  const phase = useGameStore((s) => s.phase);
  const tick = useGameStore((s) => s.tick);
  useGameStore((s) => s.frame); // subscribe so a move (engine mutated in place) still triggers a repaint
  const rafRef = useRef<number | undefined>(undefined);
  const lastRef = useRef<number>(performance.now());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = KEY_MAP[e.key];
      if (dir) {
        e.preventDefault();
        move(dir);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move]);

  useEffect(() => {
    const loop = (now: number) => {
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      if (phase === 'PLAYING') tick(dt);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase, tick]);

  if (!engine) return null;

  const handleTileClick = (x: number, y: number) => {
    const { x: px, y: py } = engine.playerPos;
    const dx = x - px;
    const dy = y - py;
    if (dx === 0 && dy === 0) return;
    // step one tile toward the clicked tile, biasing the axis with the larger distance
    if (Math.abs(dx) >= Math.abs(dy)) {
      move(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      move(dy > 0 ? 'DOWN' : 'UP');
    }
  };

  return (
    <div className="game-screen">
      <HUD />
      <div className="game-body">
        <div className="board-wrap">
          <Board engine={engine} onTileClick={handleTileClick} />
        </div>
        <ObservationsPanel />
      </div>
      <TouchControls onMove={move} />
      {phase === 'DISCOVERY' && <DiscoveryModal />}
      {phase === 'DEATH' && <DeathModal />}
      {phase === 'RESULT' && <ResultModal />}
    </div>
  );
}

function TouchControls({ onMove }: { onMove: (d: Direction) => void }) {
  return (
    <div className="touch-controls" aria-hidden="false">
      <button className="btn ghost touch-btn up" onClick={() => onMove('UP')}>↑</button>
      <div className="touch-row">
        <button className="btn ghost touch-btn" onClick={() => onMove('LEFT')}>←</button>
        <button className="btn ghost touch-btn" onClick={() => onMove('DOWN')}>↓</button>
        <button className="btn ghost touch-btn" onClick={() => onMove('RIGHT')}>→</button>
      </div>
    </div>
  );
}
