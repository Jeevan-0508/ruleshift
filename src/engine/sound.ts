// ============================================================================
// Lightweight procedural sound — no audio assets, everything is a synthesized
// Web Audio tone. Deliberately does not import gameStore (avoid a circular
// import); callers pass `muted` explicitly.
// ============================================================================

export type SoundKind = 'MOVE' | 'TOUCH' | 'TELEPORT' | 'DEATH' | 'GOAL' | 'RULE_TRIGGER';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(
  audio: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  opts: { type?: OscillatorType; gain?: number; glideTo?: number } = {},
): void {
  const { type = 'sine', gain = 0.08, glideTo } = opts;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  const t0 = audio.currentTime + startOffset;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t0 + duration);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function playSound(kind: SoundKind, muted: boolean): void {
  if (muted) return;
  const audio = getCtx();
  if (!audio) return;
  switch (kind) {
    case 'MOVE':
      tone(audio, 340, 0, 0.05, { type: 'square', gain: 0.03 });
      break;
    case 'TOUCH':
      tone(audio, 520, 0, 0.09, { type: 'triangle', gain: 0.06 });
      break;
    case 'TELEPORT':
      tone(audio, 220, 0, 0.28, { type: 'sawtooth', gain: 0.05, glideTo: 900 });
      break;
    case 'DEATH':
      tone(audio, 220, 0, 0.35, { type: 'sawtooth', gain: 0.09, glideTo: 40 });
      tone(audio, 110, 0.03, 0.4, { type: 'square', gain: 0.07, glideTo: 30 });
      break;
    case 'GOAL':
      tone(audio, 523.25, 0, 0.16, { type: 'triangle', gain: 0.07 });
      tone(audio, 659.25, 0.1, 0.16, { type: 'triangle', gain: 0.07 });
      tone(audio, 783.99, 0.2, 0.28, { type: 'triangle', gain: 0.08 });
      break;
    case 'RULE_TRIGGER':
      tone(audio, 660, 0, 0.12, { type: 'sine', gain: 0.05, glideTo: 880 });
      break;
  }
}
