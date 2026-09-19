import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../engine/gameStore';
import { Board } from '../game/Board';
import { HUD } from './HUD';
import { ObservationsPanel } from './ObservationsPanel';
import { DiscoveryModal } from './DiscoveryModal';
import { DeathModal } from './DeathModal';
import { ResultModal } from './ResultModal';
import { ReplayOverlay } from './ReplayOverlay';
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
  const frame = useGameStore((s) => s.frame); // subscribe so a move (engine mutated in place) still triggers a repaint
  const rafRef = useRef<number | undefined>(undefined);
  const lastRef = useRef<number>(performance.now());
  const [robotEffect, setRobotEffect] = useState<'teleport' | 'death' | null>(null);
  const lastEventCountRef = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'PLAYING') return;
      const dir = KEY_MAP[e.key];
      if (dir) {
        e.preventDefault();
        move(dir);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, phase]);

  // Watch the engine's event log for TELEPORT/DEATH events since the last frame
  // and flip a transient class on the robot so CSS can animate the moment.
  useEffect(() => {
    if (!engine) return;
    const events = engine.log.all();
    const newEvents = events.slice(lastEventCountRef.current);
    lastEventCountRef.current = events.length;
    const teleport = newEvents.some((e) => e.type === 'TELEPORT');
    const death = newEvents.some((e) => e.type === 'DEATH');
    if (teleport || death) {
      setRobotEffect(death ? 'death' : 'teleport');
      const id = window.setTimeout(() => setRobotEffect(null), 420);
      return () => window.clearTimeout(id);
    }
  }, [frame, engine]);

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
    if (phase !== 'PLAYING') return;
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
          <Board engine={engine} onTileClick={handleTileClick} robotEffect={robotEffect} />
        </div>
        <ObservationsPanel />
      </div>
      <TouchControls onMove={move} disabled={phase !== 'PLAYING'} />
      {phase === 'DISCOVERY' && <DiscoveryModal />}
      {phase === 'DEATH' && <DeathModal />}
      {phase === 'RESULT' && <ResultModal />}
      {phase === 'REPLAY' && <ReplayOverlay />}
    </div>
  );
}

function TouchControls({ onMove, disabled }: { onMove: (d: Direction) => void; disabled?: boolean }) {
  if (disabled) return null;
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
