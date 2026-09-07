// High-Fidelity Real Ambient Audio Streams & Procedural DSP Synthesizer with Spatial Depth & Zero Cutoff Glitches

// Augment Window for webkitAudioContext
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

import { ReminderSound } from '../types';

export interface AmbientMixerState {
  rain: number;
  forest: number;
  ocean: number;
  cafe: number;
  drone: number;
  noise: number;
  solfeggioFreq: 432 | 528 | 639;
}

// Public domain / CC0 high quality ambient stream sources (Google Public Actions / freesound CDNs)
const REAL_AUDIO_URLS: Record<string, string> = {
  rain: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',
  forest: 'https://actions.google.com/sounds/v1/ambiences/forest_birds_wind.ogg',
  ocean: 'https://actions.google.com/sounds/v1/water/waves_crashing.ogg',
  cafe: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg'
};

class ProceduralAudioManager {
  private ctx: AudioContext | null = null;
  private currentAmbientNode: AudioNode | AudioNode[] | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private trackedNodes: AudioNode[] = [];
  private currentAmbientType: string | null = null;
  private masterVolume: number = 0.5;
  private ambientGain: GainNode | null = null;
  private solfeggioFreq: 432 | 528 | 639 = 528;

  // Cached procedural sound buffers
  private pinkNoiseBuffer: AudioBuffer | null = null;
  private rainBuffer: AudioBuffer | null = null;
  private breezeBuffer: AudioBuffer | null = null;

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(
        this.masterVolume * 0.35,
        this.ctx.currentTime
      );
    }
    if (this.currentAudioElement) {
      this.currentAudioElement.volume = this.masterVolume * 0.5;
    }
  }

  getVolume(): number {
    return this.masterVolume;
  }

  setSolfeggioFreq(freq: 432 | 528 | 639) {
    this.solfeggioFreq = freq;
  }

  playTick() {
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(this.masterVolume * 0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Audio safety fallback
    }
  }

  playChime() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const fundamental = this.solfeggioFreq || 528;
      const freqs = [fundamental, fundamental * 1.25, fundamental * 1.5, fundamental * 2];

      freqs.forEach((f, index) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + index * 0.12);

        const noteStart = now + index * 0.12;
        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.exponentialRampToValueAtTime(this.masterVolume * 0.18, noteStart + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 1.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 1.65);
      });
    } catch {
      // Audio safety fallback
    }
  }

  playBell() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const fundamental = 440; // Warm singing bowl fundamental
      const partials = [
        { freq: fundamental, gain: 0.22, decay: 2.2 },
        { freq: fundamental * 2.01, gain: 0.1, decay: 1.6 },
        { freq: fundamental * 3.02, gain: 0.05, decay: 1.1 }
      ];

      partials.forEach(({ freq, gain, decay }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(this.masterVolume * gain, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(g);
        g.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + decay + 0.05);
      });
    } catch {
      // Audio safety fallback
    }
  }

  playMarimba() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 783.99]; // C5 then G5 pleasant interval

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteStart = now + idx * 0.1;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        g.gain.setValueAtTime(0.0001, noteStart);
        g.gain.exponentialRampToValueAtTime(this.masterVolume * 0.22, noteStart + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.45);

        osc.connect(g);
        g.connect(this.ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.5);
      });
    } catch {
      // Audio safety fallback
    }
  }

  playBeep() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const beeps = [
        { freq: 880, start: now, duration: 0.08 },
        { freq: 1174.66, start: now + 0.1, duration: 0.14 }
      ];

      beeps.forEach(({ freq, start, duration }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(this.masterVolume * 0.18, start + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        osc.connect(g);
        g.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + duration + 0.02);
      });
    } catch {
      // Audio safety fallback
    }
  }

  playHarp() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 987.77]; // C5, E5, G5, B5 arpeggio

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteStart = now + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        g.gain.setValueAtTime(0.0001, noteStart);
        g.gain.exponentialRampToValueAtTime(this.masterVolume * 0.15, noteStart + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, noteStart + 1.2);

        osc.connect(g);
        g.connect(this.ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 1.25);
      });
    } catch {
      // Audio safety fallback
    }
  }

  playReminderSound(sound: ReminderSound = 'chime') {
    switch (sound) {
      case 'bell':
        this.playBell();
        break;
      case 'marimba':
        this.playMarimba();
        break;
      case 'beep':
        this.playBeep();
        break;
      case 'harp':
        this.playHarp();
        break;
      case 'chime':
      default:
        this.playChime();
        break;
    }
  }

  startAmbient(type: string) {
    if (this.currentAmbientType === type) return;

    this.stopAmbient();
    if (type === 'none') return;

    this.init();
    this.currentAmbientType = type;

    // Check if a real audio stream URL exists for this ambient sound
    const realAudioUrl = REAL_AUDIO_URLS[type];
    if (realAudioUrl && typeof Audio !== 'undefined') {
      try {
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.src = realAudioUrl;
        audio.loop = true;
        audio.volume = this.masterVolume * 0.5;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              this.currentAudioElement = audio;
            })
            .catch(() => {
              // If network stream fails, fall back to procedural Web Audio DSP
              this.startProceduralAmbient(type);
            });
          return;
        }
      } catch {
        // Fall back to procedural
      }
    }

    this.startProceduralAmbient(type);
  }

  private startProceduralAmbient(type: string) {
    if (!this.ctx) return;

    const gain = this.ctx.createGain();
    this.ambientGain = gain;
    this.trackedNodes.push(gain);

    gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, this.masterVolume * 0.35),
      this.ctx.currentTime + 0.3
    );

    // Stereo Panner for spatial atmosphere
    if (typeof this.ctx.createStereoPanner === 'function') {
      try {
        const panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime(0, this.ctx.currentTime);
        gain.connect(panner);
        panner.connect(this.ctx.destination);
        this.trackedNodes.push(panner);
      } catch {
        gain.connect(this.ctx.destination);
      }
    } else {
      gain.connect(this.ctx.destination);
    }

    if (type === 'noise') this.playPinkNoise();
    else if (type === 'rain') this.playRain();
    else if (type === 'forest') this.playForestBreeze();
    else if (type === 'ocean') this.playOcean();
    else if (type === 'cafe') this.playPinkNoise();
    else if (type === 'drone') this.playHarmonicDrone();
  }

  stopAmbient() {
    const nodeToStop = this.currentAmbientNode;
    const gainToStop = this.ambientGain;
    const trackedToStop = [...this.trackedNodes];
    const audioToStop = this.currentAudioElement;

    // Immediately detach active references so new startAmbient calls are never affected
    this.currentAmbientNode = null;
    this.ambientGain = null;
    this.trackedNodes = [];
    this.currentAmbientType = null;
    this.currentAudioElement = null;

    if (audioToStop) {
      try {
        audioToStop.pause();
        audioToStop.currentTime = 0;
      } catch {}
    }

    if (gainToStop && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        gainToStop.gain.setValueAtTime(gainToStop.gain.value, now);
        gainToStop.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      } catch {}
    }

    setTimeout(() => {
      if (nodeToStop) {
        try {
          if (Array.isArray(nodeToStop)) {
            nodeToStop.forEach((n) => {
              if ('stop' in n && typeof (n as { stop: () => void }).stop === 'function') {
                (n as { stop: () => void }).stop();
              }
              n.disconnect();
            });
          } else {
            if ('stop' in nodeToStop && typeof (nodeToStop as { stop: () => void }).stop === 'function') {
              (nodeToStop as { stop: () => void }).stop();
            }
            nodeToStop.disconnect();
          }
        } catch {}
      }

      trackedToStop.forEach((node) => {
        try {
          node.disconnect();
        } catch {}
      });

      if (gainToStop) {
        try {
          gainToStop.disconnect();
        } catch {}
      }
    }, 280);
  }

  private getOrCreatePinkNoiseBuffer(): AudioBuffer {
    if (this.pinkNoiseBuffer) return this.pinkNoiseBuffer;
    if (!this.ctx) throw new Error('AudioContext missing');

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    this.pinkNoiseBuffer = noiseBuffer;
    return noiseBuffer;
  }

  private playPinkNoise() {
    if (!this.ctx || !this.ambientGain) return;

    const noiseBuffer = this.getOrCreatePinkNoiseBuffer();
    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(this.ambientGain);

    this.currentAmbientNode = [source, filter];
    this.trackedNodes.push(source, filter);
    source.start();
  }

  private playRain() {
    if (!this.ctx || !this.ambientGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    if (!this.rainBuffer) {
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      this.rainBuffer = noiseBuffer;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = this.rainBuffer;
    source.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1100, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(1.4, this.ctx.currentTime);

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(3200, this.ctx.currentTime);

    source.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(this.ambientGain);

    this.currentAmbientNode = [source, bandpass, lowpass];
    this.trackedNodes.push(source, bandpass, lowpass);
    source.start();
  }

  private playForestBreeze() {
    if (!this.ctx || !this.ambientGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    if (!this.breezeBuffer) {
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.4;
      }
      this.breezeBuffer = noiseBuffer;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = this.breezeBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);

    // LFO for slow wind modulation
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    source.connect(filter);
    filter.connect(this.ambientGain);

    this.currentAmbientNode = [source, filter, lfo, lfoGain];
    this.trackedNodes.push(source, filter, lfo, lfoGain);

    source.start();
    lfo.start();
  }

  private playOcean() {
    if (!this.ctx || !this.ambientGain) return;

    const pinkBuffer = this.getOrCreatePinkNoiseBuffer();
    const source = this.ctx.createBufferSource();
    source.buffer = pinkBuffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);

    // Slow wave swell modulation (0.08 Hz = ~12s wave cycle)
    const swell = this.ctx.createOscillator();
    swell.frequency.setValueAtTime(0.08, this.ctx.currentTime);
    const swellGain = this.ctx.createGain();
    swellGain.gain.setValueAtTime(250, this.ctx.currentTime);

    swell.connect(swellGain);
    swellGain.connect(filter.frequency);

    source.connect(filter);
    filter.connect(this.ambientGain);

    this.currentAmbientNode = [source, filter, swell, swellGain];
    this.trackedNodes.push(source, filter, swell, swellGain);

    source.start();
    swell.start();
  }

  private playHarmonicDrone() {
    if (!this.ctx || !this.ambientGain) return;

    const fundamental = this.solfeggioFreq || 528;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(fundamental * 0.5, this.ctx.currentTime);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(fundamental, this.ctx.currentTime);

    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(fundamental * 1.5, this.ctx.currentTime);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    osc1.connect(subGain);
    osc2.connect(subGain);
    osc3.connect(subGain);
    subGain.connect(this.ambientGain);

    this.currentAmbientNode = [osc1, osc2, osc3, subGain];
    this.trackedNodes.push(osc1, osc2, osc3, subGain);

    osc1.start();
    osc2.start();
    osc3.start();
  }

  /**
   * Release cached procedural buffers from memory when navigating away
   */
  disposeBuffers(): void {
    this.stopAmbient();
    this.pinkNoiseBuffer = null;
    this.rainBuffer = null;
    this.breezeBuffer = null;
  }
}

export const audioManager = new ProceduralAudioManager();
