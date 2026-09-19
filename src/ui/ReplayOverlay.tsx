import { useEffect } from 'react';
import { useGameStore } from '../engine/gameStore';
import { Board } from '../game/Board';

const STEP_MS = 350;

export function ReplayOverlay() {
  const phase = useGameStore((s) => s.phase);
  const replayEngine = useGameStore((s) => s.replayEngine);
  const replayStepIndex = useGameStore((s) => s.replayStepIndex);
  const replayDone = useGameStore((s) => s.replayDone);
  const moves = useGameStore((s) => s.moves);
  const advanceReplay = useGameStore((s) => s.advanceReplay);
  const stopReplay = useGameStore((s) => s.stopReplay);
  useGameStore((s) => s.frame);

  useEffect(() => {
    if (phase !== 'REPLAY' || replayDone) return;
    const id = window.setTimeout(() => advanceReplay(), STEP_MS);
    return () => window.clearTimeout(id);
  }, [phase, replayDone, replayStepIndex, advanceReplay]);

  if (phase !== 'REPLAY' || !replayEngine) return null;

  const skipToEnd = () => {
    let guard = 0;
    while (!useGameStore.getState().replayDone && guard < 10000) {
      useGameStore.getState().advanceReplay();
      guard += 1;
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ width: 'min(94vw, 560px)' }}>
        <h2>WATCH REPLAY</h2>
        <div className="board-wrap" style={{ padding: 0, margin: '8px 0' }}>
          <Board engine={replayEngine} />
        </div>
        <div className="mono" style={{ textAlign: 'center', color: 'var(--ink-dim)', marginBottom: 12 }}>
          step {Math.min(replayStepIndex, moves.length)} / {moves.length}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {!replayDone && (
            <button className="btn ghost" onClick={skipToEnd}>SKIP TO END</button>
          )}
          <button className="btn primary" onClick={stopReplay}>CLOSE</button>
        </div>
      </div>
    </div>
  );
}
