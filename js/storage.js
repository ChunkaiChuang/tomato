/**
 * LocalStorage 資料存取與統計管理模組
 */
class StorageManager {
  constructor() {
    this.SETTINGS_KEY = 'pomodoro_settings';
    this.TASKS_KEY = 'pomodoro_tasks';
    this.ACTIVE_TASK_KEY = 'pomodoro_active_task';
    this.STATS_KEY = 'pomodoro_stats';

    this.defaultSettings = {
      pomodoro: 25,
      shortBreak: 5,
      longBreak: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      soundType: 'bell',
      soundVolume: 100,
      ambientSound: 'none',
      ambientVolume: 60,
      theme: 'tomato'
    };
  }

  // 取得今天日期字串 (YYYY-MM-DD)
  getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 讀取設定
  getSettings() {
    try {
      const data = localStorage.getItem(this.SETTINGS_KEY);
      return data ? { ...this.defaultSettings, ...JSON.parse(data) } : { ...this.defaultSettings };
    } catch (e) {
      console.error('讀取設定失敗，使用預設值', e);
      return { ...this.defaultSettings };
    }
  }

  // 儲存設定
  saveSettings(settings) {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('儲存設定失敗', e);
    }
  }

  // 讀取任務清單
  getTasks() {
    try {
      const data = localStorage.getItem(this.TASKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('讀取任務失敗', e);
      return [];
    }
  }

  // 儲存任務清單
  saveTasks(tasks) {
    try {
      localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('儲存任務失敗', e);
    }
  }

  // 讀取目前焦點任務 ID
  getActiveTaskId() {
    return localStorage.getItem(this.ACTIVE_TASK_KEY) || null;
  }

  // 設定目前焦點任務 ID
  setActiveTaskId(id) {
    if (id) {
      localStorage.setItem(this.ACTIVE_TASK_KEY, id);
    } else {
      localStorage.removeItem(this.ACTIVE_TASK_KEY);
    }
  }

  // 讀取統計資料
  getStats() {
    const today = this.getTodayDateString();
    let stats = {
      totalPomos: 0,
      streakDays: 0,
      lastActiveDate: null,
      history: {} // { '2026-08-20': { pomos: 3, minutes: 75 } }
    };

    try {
      const data = localStorage.getItem(this.STATS_KEY);
      if (data) {
        stats = { ...stats, ...JSON.parse(data) };
      }
    } catch (e) {
      console.error('讀取統計資料失敗', e);
    }

    // 計算連續天數 (Streak)
    this._updateStreak(stats, today);

    // 今日紀錄
    const todayData = stats.history[today] || { pomos: 0, minutes: 0 };

    return {
      todayPomos: todayData.pomos,
      todayMinutes: todayData.minutes,
      totalPomos: stats.totalPomos,
      streakDays: stats.streakDays,
      history: stats.history
    };
  }

  // 記錄完成一次番茄鐘
  recordCompletedPomodoro(durationMinutes) {
    const today = this.getTodayDateString();
    let stats = {
      totalPomos: 0,
      streakDays: 0,
      lastActiveDate: null,
      history: {}
    };

    try {
      const data = localStorage.getItem(this.STATS_KEY);
      if (data) {
        stats = { ...stats, ...JSON.parse(data) };
      }
    } catch (e) {}

    // 更新連續天數
    this._updateStreak(stats, today);

    // 累加今日與歷史
    if (!stats.history[today]) {
      stats.history[today] = { pomos: 0, minutes: 0 };
    }
    stats.history[today].pomos += 1;
    stats.history[today].minutes += durationMinutes;
    stats.totalPomos += 1;
    stats.lastActiveDate = today;

    try {
      localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      console.error('儲存統計資料失敗', e);
    }

    return this.getStats();
  }

  // 連續專注天數計算內部邏輯
  _updateStreak(stats, today) {
    if (!stats.lastActiveDate) {
      stats.streakDays = stats.history[today]?.pomos > 0 ? 1 : 0;
      return;
    }

    if (stats.lastActiveDate === today) {
      // 今天已經有活動，保持當前 streak
      return;
    }

    const lastDate = new Date(stats.lastActiveDate);
    const currentDate = new Date(today);
    const diffTime = currentDate.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 1) {
      // 昨天有專注，若今天也完成則持續
      // 保持不變，待記錄今日 pomodoro 時 streak 不會中斷
    } else if (diffDays > 1) {
      // 中斷了
      stats.streakDays = 0;
    }
  }

  // 取得最近 7 天的歷史數據
  getRecent7Days() {
    const result = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const stats = this.getStats();
      const dayData = stats.history[dateStr] || { pomos: 0, minutes: 0 };
      
      const dayName = i === 0 ? '今日' : `${d.getMonth() + 1}/${d.getDate()}`;

      result.push({
        date: dateStr,
        label: dayName,
        pomos: dayData.pomos,
        minutes: dayData.minutes
      });
    }

    return result;
  }
}

// 暴露單例物件
window.storageManager = new StorageManager();
