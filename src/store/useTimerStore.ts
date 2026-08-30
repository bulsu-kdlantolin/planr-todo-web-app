import { create } from 'zustand';
import { FocusSession } from '../types';
import { dbPutFocusSession } from '../db/indexedDB';
import { audioManager } from '../utils/audio';
import { sendBrowserNotification } from '../utils/notifications';
import { generateUUID } from '../utils/id';

export type PresetType = 'pomodoro' | 'deep' | 'short' | 'long' | 'custom';
export type AmbientType = 'none' | 'rain' | 'forest' | 'ocean' | 'cafe' | 'drone' | 'noise';

interface TimerState {
  currentPreset: PresetType;
  durationSec: number;
  remainingSec: number;
  isRunning: boolean;
  selectedTaskId: string | null;
  ambientType: AmbientType;
  focusSessions: FocusSession[];

  setFocusSessions: (sessions: FocusSession[]) => void;
  setSelectedTaskId: (id: string | null) => void;
  setPreset: (preset: PresetType, mins: number) => void;
  setAmbientType: (type: AmbientType) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  tick: (remaining: number) => void;
  completeSession: (taskTitle?: string) => Promise<FocusSession>;
}

let worker: Worker | null = null;

function getWorker(): Worker | null {
  if (typeof window === 'undefined') return null;
  if (!worker) {
    try {
      worker = new Worker(new URL('../workers/timer.worker.ts', import.meta.url), {
        type: 'module'
      });
    } catch {
      worker = null;
    }
  }
  return worker;
}

export const useTimerStore = create<TimerState>((set, get) => {
  const w = getWorker();
  if (w) {
    w.onmessage = (e: MessageEvent<{ type: 'TICK' | 'COMPLETE'; remainingSec?: number }>) => {
      if (e.data.type === 'TICK' && typeof e.data.remainingSec === 'number') {
        get().tick(e.data.remainingSec);
      } else if (e.data.type === 'COMPLETE') {
        get().completeSession();
      }
    };
  }

  return {
    currentPreset: 'pomodoro',
    durationSec: 25 * 60,
    remainingSec: 25 * 60,
    isRunning: false,
    selectedTaskId: null,
    ambientType: 'none',
    focusSessions: [],

    setFocusSessions: (focusSessions) => set({ focusSessions }),
    setSelectedTaskId: (selectedTaskId) => set({ selectedTaskId }),

    setPreset: (currentPreset, mins) => {
      const w = getWorker();
      if (w) w.postMessage({ type: 'RESET' });
      const secs = mins * 60;
      set({
        currentPreset,
        durationSec: secs,
        remainingSec: secs,
        isRunning: false
      });
    },

    setAmbientType: (ambientType) => {
      set({ ambientType });
      if (ambientType === 'none') {
        audioManager.stopAmbient();
      } else {
        audioManager.startAmbient(ambientType);
      }
    },

    startTimer: () => {
      audioManager.init();
      const state = get();
      const targetEndTime = Date.now() + state.remainingSec * 1000;
      const w = getWorker();
      if (w) {
        w.postMessage({ type: 'START', targetEndTime });
      }

      if (state.ambientType !== 'none') {
        audioManager.startAmbient(state.ambientType);
      }
      set({ isRunning: true });
    },

    pauseTimer: () => {
      const w = getWorker();
      if (w) w.postMessage({ type: 'PAUSE' });
      set({ isRunning: false });
    },

    toggleTimer: () => {
      if (get().isRunning) {
        get().pauseTimer();
      } else {
        get().startTimer();
      }
    },

    resetTimer: () => {
      const w = getWorker();
      if (w) w.postMessage({ type: 'RESET' });
      set((state) => ({
        isRunning: false,
        remainingSec: state.durationSec
      }));
    },

    tick: (remainingSec) => {
      set({ remainingSec });
    },

    completeSession: async (taskTitle = 'Deep Work Session') => {
      const state = get();
      const durationMin = Math.round(state.durationSec / 60);

      const newSession: FocusSession = {
        id: generateUUID('foc'),
        taskId: state.selectedTaskId,
        taskTitle,
        durationMinutes: durationMin,
        completedAt: new Date().toISOString(),
        type: state.currentPreset === 'short' || state.currentPreset === 'long' ? 'break' : 'focus'
      };

      set((s) => ({
        isRunning: false,
        remainingSec: s.durationSec,
        focusSessions: [newSession, ...s.focusSessions]
      }));

      await dbPutFocusSession(newSession);

      audioManager.playChime();
      sendBrowserNotification('Focus Block Complete', {
        body: `You completed ${durationMin} minutes of deep focus.`
      });

      return newSession;
    }
  };
});
