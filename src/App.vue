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
  const tag = e.target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

  // 避免攔截 Ctrl / Command 組合鍵（如複製貼上）
  if (e.ctrlKey || e.metaKey) return;

  if (e.key === 'Escape') {
    isStatsOpen.value = false;
    isSettingsOpen.value = false;
    isAmbientOpen.value = false;
  } else if (e.code === 'Space') {
    e.preventDefault();
    handleToggle();
  } else if (e.key === 's' || e.key === 'S' || e.code === 'KeyS') {
    e.preventDefault();
    sound.playClick();
    timer.skip();
  } else if (e.key === 'r' || e.key === 'R' || e.code === 'KeyR') {
    e.preventDefault();
    sound.playClick();
    timer.reset();
  }
};

onMounted(() => {
  sound.setVolume(storage.settings.soundVolume / 100);
  sound.setAmbientVolume(storage.settings.ambientVolume / 100);
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
