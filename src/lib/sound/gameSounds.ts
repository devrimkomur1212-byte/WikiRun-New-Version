/**
 * Synthesized game sounds via the Web Audio API — no audio files needed.
 *
 * The AudioContext is created lazily on first play. Browsers allow audio
 * once the page has had any user interaction; clicking "Find Match" counts,
 * so the match-found chime works even if the tab has been sitting in the
 * background while the player waits in queue.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

interface ToneOptions {
  /** Seconds from now to start */
  at?: number;
  duration?: number;
  type?: OscillatorType;
  volume?: number;
}

function playTone(freq: number, opts: ToneOptions = {}) {
  const ctx = getCtx();
  if (!ctx) return;

  const { at = 0, duration = 0.15, type = "sine", volume = 0.18 } = opts;
  const start = ctx.currentTime + at;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);

  // Quick attack, exponential decay — avoids clicks at both ends
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** Ascending three-note chime — designed to cut through background listening */
export function playMatchFoundSound() {
  playTone(523.25, { at: 0, duration: 0.18 }); // C5
  playTone(659.25, { at: 0.14, duration: 0.18 }); // E5
  playTone(783.99, { at: 0.28, duration: 0.32, volume: 0.22 }); // G5
}

/** Short tick for each countdown second (3… 2… 1…) */
export function playCountdownTickSound() {
  playTone(880, { duration: 0.09, type: "square", volume: 0.08 });
}

/** Higher, longer "go!" tone when the race starts */
export function playGoSound() {
  playTone(1318.51, { duration: 0.35, type: "square", volume: 0.1 }); // E6
}
