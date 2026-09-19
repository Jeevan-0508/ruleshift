import { useGameStore } from '../engine/gameStore';

export function ObservationsPanel() {
  const observations = useGameStore((s) => s.observations);
  const level = useGameStore((s) => s.level);

  return (
    <div className="sidebar">
      <div>
        <h3>Your Observations</h3>
        <div className="obs-list">
          {observations.length === 0 && (
            <div className="obs-item pending"><span className="mark">?</span> Nothing observed yet. Try touching something.</div>
          )}
          {observations.map((o) => (
            <div key={o.id} className={`obs-item ${o.confirmed ? 'confirmed' : 'pending'}`}>
              <span className="mark">{o.confirmed ? '✓' : '?'}</span>
              <span>{o.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="tip-box">
        <strong style={{ color: '#8a92b2', fontSize: 11, letterSpacing: '0.08em' }}>TIP</strong>
        <div style={{ marginTop: 6 }}>
          Rules may depend on your actions, your history, or even your deaths. Reach the exit at{' '}
          <span className="mono">({level?.width ? level.width - 1 : 0}, ...)</span> — but don't trust anything until you've tested it twice.
        </div>
      </div>
    </div>
  );
}
