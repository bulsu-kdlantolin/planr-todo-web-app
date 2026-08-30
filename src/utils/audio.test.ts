import { describe, it, expect, beforeEach } from 'vitest';
import { audioManager } from './audio';

describe('AudioManager Audio Synthesizer', () => {
  beforeEach(() => {
    audioManager.init();
    audioManager.setVolume(0.5);
  });

  it('initializes and manages volume correctly', () => {
    expect(audioManager.getVolume()).toBe(0.5);
    audioManager.setVolume(0.8);
    expect(audioManager.getVolume()).toBe(0.8);

    // Test volume boundary limits
    audioManager.setVolume(1.5);
    expect(audioManager.getVolume()).toBe(1);

    audioManager.setVolume(-0.5);
    expect(audioManager.getVolume()).toBe(0);
  });

  it('triggers playTick and playChime without throwing errors', () => {
    expect(() => audioManager.playTick()).not.toThrow();
    expect(() => audioManager.playChime()).not.toThrow();
  });

  it('starts and stops ambient soundscapes smoothly', () => {
    expect(() => audioManager.startAmbient('rain')).not.toThrow();
    expect(() => audioManager.startAmbient('forest')).not.toThrow();
    expect(() => audioManager.startAmbient('drone')).not.toThrow();
    expect(() => audioManager.startAmbient('noise')).not.toThrow();
    expect(() => audioManager.stopAmbient()).not.toThrow();
  });
});
