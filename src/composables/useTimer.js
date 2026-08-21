import { ref, computed, onUnmounted } from 'vue';

export function useTimer(settings, onCompleteCallback) {
  const mode = ref('pomodoro'); // 'pomodoro' | 'shortBreak' | 'longBreak'
  const isRunning = ref(false);
  const remainingSeconds = ref(settings.pomodoro * 60);
  const totalSeconds = ref(settings.pomodoro * 60);
  const currentCycle = ref(1);

  let endTime = null;
  let worker = null;
  let fallbackInterval = null;

  // Web Worker 背景計時
  const initWorker = () => {
    try {
      const workerCode = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (timer) clearInterval(timer);
            timer = setInterval(() => {
              self.postMessage('tick');
            }, 250);
          } else if (e.data === 'stop') {
            if (timer) clearInterval(timer);
            timer = null;
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      worker = new Worker(URL.createObjectURL(blob));
      worker.onmessage = () => handleTick();
    } catch (e) {
      console.warn('Web Worker 初始化失敗，使用 fallback', e);
    }
  };

  initWorker();

  const handleTick = () => {
    if (!isRunning.value || !endTime) return;

    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));

    if (remaining !== remainingSeconds.value) {
      remainingSeconds.value = remaining;
    }

    if (remaining <= 0) {
      handleComplete();
    }
  };

  const handleComplete = () => {
    pause();
    const previousMode = mode.value;

    if (onCompleteCallback) {
      onCompleteCallback(previousMode);
    }

    let shouldAutoStart = false;
    if (previousMode === 'pomodoro') {
      shouldAutoStart = settings.autoStartBreaks;
      if (currentCycle.value >= settings.longBreakInterval) {
        currentCycle.value = 1;
        setMode('longBreak', shouldAutoStart);
      } else {
        currentCycle.value += 1;
        setMode('shortBreak', shouldAutoStart);
      }
    } else {
      shouldAutoStart = settings.autoStartPomodoros;
      setMode('pomodoro', shouldAutoStart);
    }
  };

  const setMode = (newMode, autoStart = false) => {
    mode.value = newMode;
    let minutes = settings.pomodoro;
    if (newMode === 'shortBreak') minutes = settings.shortBreak;
    if (newMode === 'longBreak') minutes = settings.longBreak;

    totalSeconds.value = minutes * 60;
    remainingSeconds.value = totalSeconds.value;
    pause();

    if (autoStart) {
      start();
    }
  };

  const start = () => {
    if (isRunning.value) return;

    if (remainingSeconds.value <= 0) {
      remainingSeconds.value = totalSeconds.value;
    }

    isRunning.value = true;
    endTime = Date.now() + remainingSeconds.value * 1000;

    if (worker) {
      worker.postMessage('start');
    } else {
      fallbackInterval = setInterval(handleTick, 250);
    }
  };

  const pause = () => {
    if (!isRunning.value) return;

    isRunning.value = false;
    endTime = null;

    if (worker) {
      worker.postMessage('stop');
    }
    if (fallbackInterval) {
      clearInterval(fallbackInterval);
      fallbackInterval = null;
    }
  };

  const toggle = () => {
    if (isRunning.value) {
      pause();
    } else {
      start();
    }
  };

  const reset = () => {
    pause();
    remainingSeconds.value = totalSeconds.value;
  };

  const skip = () => {
    pause();
    if (mode.value === 'pomodoro') {
      if (currentCycle.value >= settings.longBreakInterval) {
        currentCycle.value = 1;
        setMode('longBreak', false);
      } else {
        currentCycle.value += 1;
        setMode('shortBreak', false);
      }
    } else {
      setMode('pomodoro', false);
    }
  };

  const updateDurations = () => {
    if (!isRunning.value) {
      let minutes = settings.pomodoro;
      if (mode.value === 'shortBreak') minutes = settings.shortBreak;
      if (mode.value === 'longBreak') minutes = settings.longBreak;

      totalSeconds.value = minutes * 60;
      remainingSeconds.value = totalSeconds.value;
    }
  };

  const formattedTime = computed(() => {
    const mins = Math.floor(remainingSeconds.value / 60);
    const secs = remainingSeconds.value % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  const progress = computed(() => {
    return totalSeconds.value > 0
      ? (totalSeconds.value - remainingSeconds.value) / totalSeconds.value
      : 0;
  });

  onUnmounted(() => {
    if (worker) worker.terminate();
    if (fallbackInterval) clearInterval(fallbackInterval);
  });

  return {
    mode,
    isRunning,
    remainingSeconds,
    totalSeconds,
    currentCycle,
    formattedTime,
    progress,
    setMode,
    start,
    pause,
    toggle,
    reset,
    skip,
    updateDurations
  };
}
