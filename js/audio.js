/**
 * DeployBirds - Web Audio API Ambient Synthesizer
 * Procedural sci-fi atmospheric soundscape & UI feedback (Zero external asset dependencies)
 */

class AmbientAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.oscillators = [];
    this.filter = null;
    this.lfo = null;
    this.initDone = false;
  }

  init() {
    if (this.initDone) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Lowpass Filter for warm cyber atmospheric tone
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(320, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(3.5, this.ctx.currentTime);
      this.filter.connect(this.masterGain);

      // Drone Oscillator 1 (Deep Sub Root)
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note

      // Drone Oscillator 2 (Harmonic Fifth)
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(82.4, this.ctx.currentTime); // E2 note

      // Drone Oscillator 3 (Octave shimmer)
      const osc3 = this.ctx.createOscillator();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(110, this.ctx.currentTime); // A2 note

      // Subtle LFO for breathing texture
      this.lfo = this.ctx.createOscillator();
      this.lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // 0.12 Hz cycle
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(120, this.ctx.currentTime);
      this.lfo.connect(lfoGain);
      lfoGain.connect(this.filter.frequency);

      // Individual Osc Gains
      const g1 = this.ctx.createGain(); g1.gain.value = 0.35;
      const g2 = this.ctx.createGain(); g2.gain.value = 0.5;
      const g3 = this.ctx.createGain(); g3.gain.value = 0.2;

      osc1.connect(g1); g1.connect(this.filter);
      osc2.connect(g2); g2.connect(this.filter);
      osc3.connect(g3); g3.connect(this.filter);

      osc1.start();
      osc2.start();
      osc3.start();
      this.lfo.start();

      this.oscillators = [osc1, osc2, osc3];
      this.initDone = true;
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  toggle() {
    if (!this.initDone) this.init();
    if (!this.ctx) return false;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    if (this.isPlaying) {
      // Fade out
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      this.isPlaying = false;
    } else {
      // Fade in gently
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(0.0001, now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.18, now + 1.8);
      this.isPlaying = true;
    }

    return this.isPlaying;
  }

  // Play subtle futuristic blip on interaction
  playBlip(freq = 880, dur = 0.08) {
    if (!this.initDone || !this.isPlaying || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + dur);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + dur);
    } catch (e) {}
  }
}

window.ambientAudio = new AmbientAudioEngine();
