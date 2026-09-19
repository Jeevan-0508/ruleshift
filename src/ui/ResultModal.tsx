import { useGameStore } from '../engine/gameStore';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ResultModal() {
  const phase = useGameStore((s) => s.phase);
  const elapsedMs = useGameStore((s) => s.elapsedMs);
  const observations = useGameStore((s) => s.observations);
  const engine = useGameStore((s) => s.engine);
  const attempts = useGameStore((s) => s.attempts);
  const moves = useGameStore((s) => s.moves);
  const level = useGameStore((s) => s.level);
  const nextLevel = useGameStore((s) => s.nextLevel);
  const restartLevel = useGameStore((s) => s.restartLevel);
  const goToMenu = useGameStore((s) => s.goToMenu);

  if (phase !== 'RESULT') return null;

  const confirmedCount = observations.filter((o) => o.confirmed).length;
  const totalRules = level?.rules.length ?? 0;
  const efficiency = moves.length > 0 ? Math.round((100 * (level?.width ?? 1)) / moves.length) : 0;

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ width: 460 }}>
        <h2>LEVEL COMPLETE</h2>
        <div className="mono" style={{ fontSize: 28, color: '#34e7e4' }}>{formatTime(elapsedMs)}</div>
        <div className="result-grid">
          <div className="result-stat"><div className="n">{confirmedCount}/{totalRules}</div><div className="l">Rules Found</div></div>
          <div className="result-stat"><div className="n">{engine?.deaths ?? 0}</div><div className="l">Deaths</div></div>
          <div className="result-stat"><div className="n">{attempts}</div><div className="l">Experiments</div></div>
          <div className="result-stat"><div className="n">{Math.min(100, efficiency)}%</div><div className="l">Efficiency</div></div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn primary" onClick={nextLevel}>NEXT LEVEL</button>
          <button className="btn ghost" onClick={restartLevel}>TRY AGAIN</button>
          <button className="btn ghost" onClick={goToMenu}>MENU</button>
        </div>
      </div>
    </div>
  );
}
