import { useState } from 'react';
import { useGameStore } from '../engine/gameStore';

export function DeathModal() {
  const lastDeathInfo = useGameStore((s) => s.lastDeathInfo);
  const respawn = useGameStore((s) => s.respawn);
  const startReplay = useGameStore((s) => s.startReplay);
  const moves = useGameStore((s) => s.moves);
  const [showTimeline, setShowTimeline] = useState(false);

  if (!lastDeathInfo) return null;
  const recent = lastDeathInfo.timeline.slice(-8);

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>GAME OVER</h2>
        <p>But that's a clue. What changed?</p>
        {showTimeline && (
          <div className="timeline-list">
            {recent.map((row, i) => (
              <div className="row" key={i}>
                <span className="t mono">{(row.t / 1000).toFixed(1)}s</span>
                <span>{row.label}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn primary" onClick={respawn}>TRY AGAIN</button>
          {moves.length > 0 && (
            <button className="btn ghost" onClick={startReplay}>WATCH REPLAY</button>
          )}
          <button className="btn ghost" onClick={() => setShowTimeline((v) => !v)}>
            {showTimeline ? 'HIDE TIMELINE' : 'VIEW TIMELINE'}
          </button>
        </div>
      </div>
    </div>
  );
}
