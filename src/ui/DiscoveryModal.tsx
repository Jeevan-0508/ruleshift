import { useGameStore } from '../engine/gameStore';

export function DiscoveryModal() {
  const discoveryQueue = useGameStore((s) => s.discoveryQueue);
  const acknowledgeDiscovery = useGameStore((s) => s.acknowledgeDiscovery);
  const obs = discoveryQueue[0];
  if (!obs) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>RULE DISCOVERED</h2>
        <p>{obs.text}</p>
        <div className="evidence-bar"><div className="fill" style={{ width: '100%' }} /></div>
        <button className="btn primary" onClick={acknowledgeDiscovery}>CONTINUE</button>
      </div>
    </div>
  );
}
