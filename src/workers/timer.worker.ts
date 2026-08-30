let timerId: number | null = null;
let targetEndTime: number | null = null;

self.onmessage = (e: MessageEvent<{ type: 'START' | 'PAUSE' | 'RESET'; targetEndTime?: number }>) => {
  const { type, targetEndTime: newTargetEndTime } = e.data;

  if (type === 'START' && newTargetEndTime) {
    targetEndTime = newTargetEndTime;
    if (timerId !== null) clearInterval(timerId);

    timerId = self.setInterval(() => {
      if (!targetEndTime) return;
      const diff = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000));
      self.postMessage({ type: 'TICK', remainingSec: diff });

      if (diff <= 0) {
        if (timerId !== null) clearInterval(timerId);
        timerId = null;
        targetEndTime = null;
        self.postMessage({ type: 'COMPLETE' });
      }
    }, 250);
  } else if (type === 'PAUSE' || type === 'RESET') {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
    targetEndTime = null;
  }
};

export {};
