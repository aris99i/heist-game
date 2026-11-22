// audio.js — all sound is synthesized with WebAudio: no audio files, no
// network, just short oscillator blips. Created lazily on the first user
// gesture, so browsers never complain about autoplay.

export function createAudio() {
  let ctx = null;
  let enabled = true;

  function ensure() {
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function blip(freq, dur, type, vol, slideTo) {
    if (!enabled) return;
    const ac = ensure();
    if (!ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol || 0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  return {
    unlock() {
      ensure();
    },
    pickup() {
      blip(660, 0.09, 'sine', 0.07);
      setTimeout(() => blip(990, 0.12, 'sine', 0.06), 70);
    },
    gem() {
      blip(520, 0.1, 'triangle', 0.08);
      setTimeout(() => blip(780, 0.1, 'triangle', 0.07), 80);
      setTimeout(() => blip(1040, 0.16, 'triangle', 0.06), 160);
    },
    crack() {
      blip(180, 0.3, 'sawtooth', 0.05, 90);
    },
    alarmTick() {
      blip(880, 0.08, 'square', 0.035);
    },
    smoke() {
      blip(300, 0.35, 'sine', 0.06, 90);
    },
    coin() {
      blip(1200, 0.07, 'square', 0.04);
      setTimeout(() => blip(900, 0.09, 'square', 0.035), 90);
    },
    caught() {
      blip(220, 0.5, 'sawtooth', 0.09, 55);
      setTimeout(() => blip(165, 0.6, 'sawtooth', 0.08, 40), 200);
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'triangle', 0.08), i * 130));
    },
    toggle() {
      enabled = !enabled;
      return enabled;
    },
  };
}
