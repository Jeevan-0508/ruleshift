import { useGameStore } from '../engine/gameStore';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function HUD() {
  const level = useGameStore((s) => s.level);
  const attempts = useGameStore((s) => s.attempts);
  const elapsedMs = useGameStore((s) => s.elapsedMs);
  const isDaily = useGameStore((s) => s.isDaily);
  const goToMenu = useGameStore((s) => s.goToMenu);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const muted = useGameStore((s) => s.save.muted);

  return (
    <div className="topbar">
      <span className="title">RULESHIFT</span>
      <span className="stat">{isDaily ? 'DAILY' : `WORLD ${level?.world ?? 1}`} <b>{level?.name}</b></span>
      <span className="stat">ATTEMPTS <b>{attempts}</b></span>
      <span className="stat mono">{formatTime(elapsedMs)}</span>
      <span className="spacer" />
      <button className="btn ghost" onClick={toggleMute}>{muted ? '🔇' : '🔊'}</button>
      <button className="btn ghost" onClick={goToMenu}>PAUSE</button>
    </div>
  );
}
