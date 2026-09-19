import { useGameStore } from '../engine/gameStore';
import { dailySeed } from '../engine/seededRandom';

export function Menu() {
  const startCampaignLevel = useGameStore((s) => s.startCampaignLevel);
  const goToWorldSelect = useGameStore((s) => s.goToWorldSelect);
  const { seed } = dailySeed();

  return (
    <div className="menu-screen">
      <div className="menu-bg">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="frag"
            style={{
              width: 40 + (i * 17) % 80,
              height: 40 + (i * 23) % 70,
              left: `${(i * 37) % 90}%`,
              top: `${(i * 53) % 80}%`,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
      </div>
      <div className="wordmark">
        <span className="rule">RULE</span><span className="shift">SHIFT</span>
      </div>
      <div className="tagline">The world has rules. You just don't know them yet.</div>
      <div className="menu-actions">
        <button className="btn primary" onClick={() => startCampaignLevel(0)}>PLAY</button>
        <button className="btn" onClick={() => useGameStore.getState().startDaily()}>
          DAILY CHALLENGE
        </button>
        <button className="btn ghost" onClick={goToWorldSelect}>WORLDS</button>
        <button className="btn ghost" onClick={() => useGameStore.getState().toggleMute()}>
          {useGameStore.getState().save.muted ? 'UNMUTE' : 'MUTE'}
        </button>
      </div>
      <div className="seed-label mono">Today's seed: {seed}</div>
    </div>
  );
}
