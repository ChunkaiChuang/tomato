<template>
  <div class="app-wrapper">
    <!-- 背景流體光暈裝飾 -->
    <div class="bg-glow bg-glow-1"></div>
    <div class="bg-glow bg-glow-2"></div>

    <div class="app-container">
      <!-- 頂部導航欄 -->
      <HeaderNav 
        :ambient-type="currentAmbient" 
        @open-ambient="isAmbientOpen = true"
        @open-stats="isStatsOpen = true"
        @open-settings="isSettingsOpen = true"
      />

      <!-- 主計時器卡片 -->
      <TimerCard 
        :mode="timer.mode.value"
        :is-running="timer.isRunning.value"
        :formatted-time="timer.formattedTime.value"
        :progress="timer.progress.value"
        :current-cycle="timer.currentCycle.value"
        :max-cycle="storage.settings.longBreakInterval"
        :active-task="tasks.activeTask.value"
        @change-mode="(m) => { sound.playClick(); timer.setMode(m, false); }"
        @toggle="handleToggle"
        @reset="() => { sound.playClick(); timer.reset(); }"
        @skip="() => { sound.playClick(); timer.skip(); }"
        @clear-focus="() => { if (tasks.activeTask.value) tasks.setActiveTask(tasks.activeTask.value.id); }"
      />

      <!-- 任務清單區域 -->
      <TaskList 
        :tasks="tasks.tasks.value"
        :active-task-id="tasks.activeTaskId.value"
        :summary="tasks.summary.value"
        @add-task="tasks.addTask"
        @toggle-task="tasks.toggleTask"
        @delete-task="tasks.deleteTask"
        @select-task="tasks.setActiveTask"
        @clear-completed="tasks.clearCompleted"
      />

      <!-- 頁尾快速鍵提示 -->
      <footer class="app-footer">
        <div class="shortcuts-hint">
          <span><kbd>Space</kbd> 開始/暫停</span>
          <span><kbd>S</kbd> 跳過</span>
          <span><kbd>R</kbd> 重置</span>
        </div>
      </footer>
    </div>

    <!-- 彈窗群組 -->
    <StatsModal 
      :is-open="isStatsOpen" 
      :stats="currentStats" 
      :recent7-days="recent7Days" 
      @close="isStatsOpen = false" 
    />

    <SettingsModal 
      :is-open="isSettingsOpen" 
      :settings="storage.settings" 
      :default-settings="storage.defaultSettings"
      @close="isSettingsOpen = false" 
      @save="handleSaveSettings"
      @test-sound="(type) => sound.playNotification(type)"
      @preview-volume="(v) => sound.setVolume(v / 100)"
    />

    <AmbientModal 
      :is-open="isAmbientOpen" 
      :current-ambient="sound.currentAmbient.value"
      :ambient-volume="sound.ambientVol.value"
      @close="isAmbientOpen = false"
      @select-ambient="(t) => sound.setAmbient(t)"
      @update-volume="(v) => sound.updateAmbientVolume(v)"
    />
  </div>
</template>

<script setup>
import { ref, computed, watchEffect, onMounted, onUnmounted } from 'vue';
import HeaderNav from './components/HeaderNav.vue';
import TimerCard from './components/TimerCard.vue';
import TaskList from './components/TaskList.vue';
import StatsModal from './components/StatsModal.vue';
import SettingsModal from './components/SettingsModal.vue';
import AmbientModal from './components/AmbientModal.vue';

import { useStorage } from './composables/useStorage';
import { useSound } from './composables/useSound';
import { useTasks } from './composables/useTasks';
import { useTimer } from './composables/useTimer';

const storage = useStorage();
const sound = useSound();
const tasks = useTasks();

// 彈窗開關狀態
const isStatsOpen = ref(false);
const isSettingsOpen = ref(false);
const isAmbientOpen = ref(false);

// 當番茄計時器完成時的處理
const handleTimerComplete = (finishedMode) => {
  sound.playNotification(storage.settings.soundType);

  if (finishedMode === 'pomodoro') {
    storage.recordPomodoro(storage.settings.pomodoro);
    tasks.incrementActiveTaskPomodoro();

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🍅 專注時間結束！', {
        body: '太棒了！您已完成一個番茄鐘，休息一下吧。',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍅</text></svg>'
      });
    }
  } else {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('☕ 休息時間結束！', {
        body: '充電完畢，準備開始下一階段的專注吧！',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">☕</text></svg>'
      });
    }
  }
};

const timer = useTimer(storage.settings, handleTimerComplete);

const handleToggle = () => {
  sound.playClick();
  sound.initContext();
  timer.toggle();
};

const handleSaveSettings = (newSettings) => {
  storage.saveSettings(newSettings);
  sound.setVolume(newSettings.soundVolume / 100);
  timer.updateDurations();
};

// 響應式統計數據
const currentStats = computed(() => storage.getStats());
const recent7Days = computed(() => storage.getRecent7Days());
const currentAmbient = computed(() => sound.currentAmbient.value);

// 動態更新主題與頁面標題
watchEffect(() => {
  document.documentElement.setAttribute('data-theme', storage.settings.theme);

  // 模式 class
  document.body.classList.remove('mode-pomodoro', 'mode-shortBreak', 'mode-longBreak');
  document.body.classList.add(`mode-${timer.mode.value}`);

  const modeLabels = {
    pomodoro: '專注',
    shortBreak: '短休息',
    longBreak: '長休息'
  };
  const modeLabel = modeLabels[timer.mode.value] || '番茄鐘';
  document.title = `(${timer.formattedTime.value}) ${modeLabel} | Pomodoro Focus (Vue 3)`;
});

// 全域快捷鍵
const handleKeydown = (e) => {
  console.log('按下的按鍵代碼:', e.code, '按鍵字元:', e.key, '目標元素:', e.target.tagName);

  // 1. 防止長按連發
  if (e.repeat) return;

  // 2. 防誤觸：輸入框、文字區塊、可編輯元素內不觸發
  const tag = e.target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;

  // 3. 避免攔截系統預設快捷鍵 (Ctrl / Command)
  if (e.ctrlKey || e.metaKey) return;

  // 4. 按 Escape 關閉所有彈窗
  if (e.key === 'Escape') {
    isStatsOpen.value = false;
    isSettingsOpen.value = false;
    isAmbientOpen.value = false;
    return;
  }

  // 5. 按 Space 開始 / 暫停 (需阻擋預設捲動)
  if (e.code === 'Space') {
    e.preventDefault();
    handleToggle();
    return;
  }

  // 6. 按 Alt + S 或單按 S 跳過
  if ((e.altKey && (e.key === 's' || e.key === 'S')) || e.key === 's' || e.key === 'S') {
    e.preventDefault();
    sound.playClick();
    timer.skip();
    return;
  }

  // 7. 按 Alt + R 或單按 R 重置
  if ((e.altKey && (e.key === 'r' || e.key === 'R')) || e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    sound.playClick();
    timer.reset();
    return;
  }
};

onMounted(() => {
  sound.setVolume(storage.settings.soundVolume / 100);
  sound.updateAmbientVolume(storage.settings.ambientVolume);
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.app-wrapper {
  width: 100%;
}

.app-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.app-footer {
  text-align: center;
}

.shortcuts-hint {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
  font-size: 0.8rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 6px 14px;
  border-radius: var(--radius-full);
}

@media (max-width: 640px), (hover: none) and (pointer: coarse) {
  .app-container {
    gap: 16px;
  }
  .app-footer {
    display: none !important; /* 手機與觸控螢幕完全隱藏實體鍵盤快捷鍵提示 */
  }
}
</style>
