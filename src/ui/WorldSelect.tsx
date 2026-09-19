import { useGameStore } from '../engine/gameStore';
import { WORLDS } from '../levels/handAuthored';

export function WorldSelect() {
  const save = useGameStore((s) => s.save);
  const startCampaignLevel = useGameStore((s) => s.startCampaignLevel);
  const goToMenu = useGameStore((s) => s.goToMenu);

  return (
    <div className="menu-screen">
      <div className="wordmark" style={{ fontSize: 36, marginBottom: 6 }}>WORLDS</div>
      <div className="world-list">
        {WORLDS.map((w) => {
          const unlocked = save.unlockedWorlds.includes(w.id) || w.unlockedByDefault;
          return (
            <div key={w.id} className={`world-card ${unlocked ? '' : 'locked'}`}>
              <div>
                <div className="name">WORLD {String(w.id).padStart(2, '0')} — {w.name}</div>
                <div className="tag">{w.tagline}</div>
              </div>
              <button
                className="btn ghost"
                disabled={!unlocked}
                onClick={() => startCampaignLevel(0)}
              >
                {unlocked ? 'ENTER' : 'LOCKED'}
              </button>
            </div>
          );
        })}
      </div>
      <button className="btn ghost" style={{ marginTop: 20 }} onClick={goToMenu}>BACK</button>
    </div>
  );
}
