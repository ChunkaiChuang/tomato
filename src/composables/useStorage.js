import { ref, reactive, watch } from 'vue';

const SETTINGS_KEY = 'pomodoro_settings';
const TASKS_KEY = 'pomodoro_tasks';
const ACTIVE_TASK_KEY = 'pomodoro_active_task';
const STATS_KEY = 'pomodoro_stats';

const defaultSettings = {
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

function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useStorage() {
  // 1. Settings
  const initialSettings = (() => {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? { ...defaultSettings, ...JSON.parse(data) } : { ...defaultSettings };
    } catch (e) {
      return { ...defaultSettings };
    }
  })();

  const settings = reactive(initialSettings);

  const saveSettings = (newSettings) => {
    Object.assign(settings, newSettings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {}
  };

  // 2. Stats
  const getRawStats = () => {
    try {
      const data = localStorage.getItem(STATS_KEY);
      return data ? JSON.parse(data) : { totalPomos: 0, streakDays: 0, lastActiveDate: null, history: {} };
    } catch (e) {
      return { totalPomos: 0, streakDays: 0, lastActiveDate: null, history: {} };
    }
  };

  const getStats = () => {
    const raw = getRawStats();
    const today = getTodayDateString();
    const todayData = raw.history?.[today] || { pomos: 0, minutes: 0 };
    return {
      todayPomos: todayData.pomos,
      todayMinutes: todayData.minutes,
      totalPomos: raw.totalPomos || 0,
      streakDays: raw.streakDays || 0,
      history: raw.history || {}
    };
  };

  const recordPomodoro = (durationMinutes) => {
    const today = getTodayDateString();
    const raw = getRawStats();

    if (!raw.history) raw.history = {};
    if (!raw.history[today]) raw.history[today] = { pomos: 0, minutes: 0 };

    raw.history[today].pomos += 1;
    raw.history[today].minutes += durationMinutes;
    raw.totalPomos = (raw.totalPomos || 0) + 1;

    // Streak 計算
    if (!raw.lastActiveDate) {
      raw.streakDays = 1;
    } else if (raw.lastActiveDate !== today) {
      const lastDate = new Date(raw.lastActiveDate);
      const currentDate = new Date(today);
      const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        raw.streakDays = (raw.streakDays || 0) + 1;
      } else if (diffDays > 1) {
        raw.streakDays = 1;
      }
    }
    raw.lastActiveDate = today;

    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(raw));
    } catch (e) {}

    return getStats();
  };

  const getRecent7Days = () => {
    const result = [];
    const today = new Date();
    const stats = getStats();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
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
  };

  return {
    defaultSettings,
    settings,
    saveSettings,
    getStats,
    recordPomodoro,
    getRecent7Days,
    getTodayDateString
  };
}
