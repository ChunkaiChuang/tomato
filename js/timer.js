/**
 * 番茄鐘核心計時器模組 (Timer Engine)
 * 結合 Web Worker 與精準時間戳，保證在瀏覽器分頁縮小/背景運作時不失準、不被節流
 */
class PomodoroTimer {
  constructor() {
    this.mode = 'pomodoro'; // 'pomodoro' | 'shortBreak' | 'longBreak'
    this.isRunning = false;
    this.remainingSeconds = 25 * 60;
    this.totalSeconds = 25 * 60;
    this.currentCycle = 1; // 1 ~ settings.longBreakInterval
    this.endTime = null;
    this.worker = null;

    // 回呼函數註冊
    this.onTick = null;
    this.onModeChange = null;
    this.onComplete = null;
    this.onStateChange = null;

    this._initWorker();
  }

  // 使用 Blob 建立獨立的 Web Worker，解決瀏覽器背景分頁 setInterval 被降速至 1 分鐘的問題
  _initWorker() {
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
      this.worker = new Worker(URL.createObjectURL(blob));
      this.worker.onmessage = () => this._handleTick();
    } catch (e) {
      console.warn('Web Worker 不可用，降級為傳統 setInterval', e);
      this.fallbackInterval = null;
    }
  }

  // 取得目前設定
  getSettings() {
    return window.storageManager ? window.storageManager.getSettings() : {
      pomodoro: 25,
      shortBreak: 5,
      longBreak: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartPomodoros: false
    };
  }

  // 切換模式
  setMode(newMode, autoStart = false) {
    this.mode = newMode;
    const settings = this.getSettings();

    let minutes = settings.pomodoro;
    if (newMode === 'shortBreak') minutes = settings.shortBreak;
    if (newMode === 'longBreak') minutes = settings.longBreak;

    this.totalSeconds = minutes * 60;
    this.remainingSeconds = this.totalSeconds;
    this.pause();

    if (this.onModeChange) {
      this.onModeChange(this.mode, this.currentCycle, settings.longBreakInterval);
    }
    this._notifyTick();

    if (autoStart) {
      this.start();
    }
  }

  // 開始倒數
  start() {
    if (this.isRunning) return;

    // 若剩餘秒數為 0，重新初始化為當前模式時長
    if (this.remainingSeconds <= 0) {
      this.remainingSeconds = this.totalSeconds;
    }

    this.isRunning = true;
    this.endTime = Date.now() + this.remainingSeconds * 1000;

    if (this.worker) {
      this.worker.postMessage('start');
    } else {
      this.fallbackInterval = setInterval(() => this._handleTick(), 250);
    }

    if (this.onStateChange) {
      this.onStateChange(true);
    }
  }

  // 暫停
  pause() {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.endTime = null;

    if (this.worker) {
      this.worker.postMessage('stop');
    }
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
    }

    if (this.onStateChange) {
      this.onStateChange(false);
    }
  }

  // 切換開始/暫停
  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  // 重置目前模式計時
  reset() {
    this.pause();
    this.remainingSeconds = this.totalSeconds;
    this._notifyTick();
  }

  // 跳過當前階段
  skip() {
    this.pause();
    this._advanceToNextMode(false);
  }

  // 內部處理每一次心跳
  _handleTick() {
    if (!this.isRunning || !this.endTime) return;

    const now = Date.now();
    const remainingMs = this.endTime - now;
    const remaining = Math.max(0, Math.ceil(remainingMs / 1000));

    if (remaining !== this.remainingSeconds) {
      this.remainingSeconds = remaining;
      this._notifyTick();
    }

    // 倒數結束
    if (remaining <= 0) {
      this._handleComplete();
    }
  }

  _notifyTick() {
    if (this.onTick) {
      const progress = this.totalSeconds > 0 
        ? (this.totalSeconds - this.remainingSeconds) / this.totalSeconds 
        : 0;
      this.onTick(this.remainingSeconds, this.totalSeconds, progress);
    }
  }

  // 當前階段結束處理
  _handleComplete() {
    this.pause();
    const previousMode = this.mode;
    const settings = this.getSettings();

    // 觸發完成事件 (供外部播放音效、桌面通知、記錄番茄數)
    if (this.onComplete) {
      this.onComplete(previousMode);
    }

    // 自動進入下一個階段
    let shouldAutoStart = false;
    if (previousMode === 'pomodoro') {
      shouldAutoStart = settings.autoStartBreaks;
    } else {
      shouldAutoStart = settings.autoStartPomodoros;
    }

    this._advanceToNextMode(shouldAutoStart);
  }

  // 切換至下個階段
  _advanceToNextMode(autoStart = false) {
    const settings = this.getSettings();

    if (this.mode === 'pomodoro') {
      if (this.currentCycle >= settings.longBreakInterval) {
        // 完成一個大循環，進入長休息
        this.currentCycle = 1;
        this.setMode('longBreak', autoStart);
      } else {
        // 進入短休息，並累加週期
        this.currentCycle += 1;
        this.setMode('shortBreak', autoStart);
      }
    } else {
      // 休息完畢，回到專注模式
      this.setMode('pomodoro', autoStart);
    }
  }

  // 更新自訂設定時長
  updateDurations() {
    const settings = this.getSettings();
    if (!this.isRunning) {
      let minutes = settings.pomodoro;
      if (this.mode === 'shortBreak') minutes = settings.shortBreak;
      if (this.mode === 'longBreak') minutes = settings.longBreak;
      
      this.totalSeconds = minutes * 60;
      this.remainingSeconds = this.totalSeconds;
      this._notifyTick();
    }
  }
}

window.pomodoroTimer = new PomodoroTimer();
