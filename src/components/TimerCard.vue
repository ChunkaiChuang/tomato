<template>
  <main class="timer-card">
    <!-- 模式切換按鈕組 -->
    <nav class="mode-tabs" role="tablist">
      <button 
        class="mode-tab" 
        :class="{ active: mode === 'pomodoro' }" 
        role="tab" 
        :aria-selected="mode === 'pomodoro'"
        @click="$emit('change-mode', 'pomodoro')"
      >
        專注
      </button>
      <button 
        class="mode-tab" 
        :class="{ active: mode === 'shortBreak' }" 
        role="tab" 
        :aria-selected="mode === 'shortBreak'"
        @click="$emit('change-mode', 'shortBreak')"
      >
        短休息
      </button>
      <button 
        class="mode-tab" 
        :class="{ active: mode === 'longBreak' }" 
        role="tab" 
        :aria-selected="mode === 'longBreak'"
        @click="$emit('change-mode', 'longBreak')"
      >
        長休息
      </button>
    </nav>

    <!-- 圓形倒數計時進度條 -->
    <div class="timer-display-wrap">
      <svg class="progress-ring" viewBox="0 0 320 320" width="320" height="320">
        <circle class="progress-ring-bg" cx="160" cy="160" r="140" stroke-width="10"></circle>
        <circle 
          class="progress-ring-fill" 
          cx="160" 
          cy="160" 
          r="140" 
          stroke-width="10" 
          stroke-linecap="round"
          :style="{ strokeDasharray: `${circumference} ${circumference}`, strokeDashoffset: strokeOffset }"
        ></circle>
      </svg>

      <div class="timer-center-content">
        <div class="timer-digits">{{ formattedTime }}</div>
        <div 
          class="current-task-badge" 
          :style="{ opacity: activeTask ? 1 : 0.7 }" 
          :title="activeTask ? '點擊取消焦點' : '點擊任務清單選取焦點任務'"
          @click="$emit('clear-focus')"
        >
          <span class="badge-dot"></span>
          <span class="badge-text">{{ activeTask ? activeTask.title : '無特定任務' }}</span>
        </div>
        <div class="cycle-counter">{{ cycleText }}</div>
      </div>
    </div>

    <!-- 控制按鈕組 -->
    <div class="timer-controls">
      <button class="ctrl-btn secondary" title="重置計時 (Alt+R)" aria-label="重置" @click="$emit('reset')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
          <path d="M3 3v5h5"></path>
        </svg>
      </button>

      <button class="ctrl-btn primary" title="開始/暫停 (空白鍵)" aria-label="開始" @click="$emit('toggle')">
        <svg v-if="!isRunning" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1"></rect>
          <rect x="14" y="4" width="4" height="16" rx="1"></rect>
        </svg>
        <span>{{ mainBtnLabel }}</span>
      </button>

      <button class="ctrl-btn secondary" title="跳過此階段 (Alt+S)" aria-label="跳過" @click="$emit('skip')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 4 15 12 5 20 5 4"></polygon>
          <line x1="19" y1="5" x2="19" y2="19"></line>
        </svg>
      </button>
    </div>
  </main>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  mode: { type: String, required: true },
  isRunning: { type: Boolean, required: true },
  formattedTime: { type: String, required: true },
  progress: { type: Number, required: true },
  currentCycle: { type: Number, required: true },
  maxCycle: { type: Number, required: true },
  activeTask: { type: Object, default: null }
});

defineEmits(['change-mode', 'toggle', 'reset', 'skip', 'clear-focus']);

const radius = 140;
const circumference = 2 * Math.PI * radius;

const strokeOffset = computed(() => {
  return circumference * (1 - props.progress);
});

const cycleText = computed(() => {
  if (props.mode === 'pomodoro') {
    return `第 ${props.currentCycle} / ${props.maxCycle} 週期`;
  } else if (props.mode === 'shortBreak') {
    return `短休息時間（即將進入第 ${props.currentCycle} 週期）`;
  } else {
    return `長休息放鬆時間 ☕`;
  }
});

const mainBtnLabel = computed(() => {
  if (props.isRunning) return '暫停計時';
  if (props.mode === 'pomodoro') return '開始專注';
  if (props.mode === 'shortBreak') return '開始休息';
  return '開始長休';
});
</script>

<style scoped>
.timer-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius-lg);
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: var(--shadow-md);
  transition: var(--transition);
}

.mode-tabs {
  display: flex;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  padding: 4px;
  gap: 4px;
  margin-bottom: 24px;
  width: 100%;
  max-width: 360px;
}

.mode-tab {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: var(--transition);
  text-align: center;
}

.mode-tab:hover {
  color: var(--text-primary);
}

.mode-tab.active {
  background: var(--accent-color);
  color: #fff;
  box-shadow: 0 4px 16px var(--accent-glow);
}

.timer-display-wrap {
  position: relative;
  width: 320px;
  height: 320px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px 0 20px;
}

.progress-ring {
  position: absolute;
  top: 0;
  left: 0;
  transform: rotate(-90deg);
}

.progress-ring-bg {
  fill: none;
  stroke: var(--ring-bg);
}

.progress-ring-fill {
  fill: none;
  stroke: var(--accent-color);
  transition: stroke-dashoffset 0.5s ease, stroke 0.4s ease;
  filter: drop-shadow(0 0 8px var(--accent-glow));
}

.timer-center-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  z-index: 2;
  gap: 8px;
}

.timer-digits {
  font-family: var(--font-mono);
  font-size: 4.25rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--text-primary);
  line-height: 1;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.current-task-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--accent-light);
  color: var(--accent-color);
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 600;
  max-width: 220px;
  cursor: pointer;
  transition: var(--transition);
}

.current-task-badge:hover {
  filter: brightness(1.15);
  transform: scale(1.03);
}

.badge-dot {
  width: 6px;
  height: 6px;
  background: var(--accent-color);
  border-radius: 50%;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

.badge-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cycle-counter {
  font-size: 0.825rem;
  color: var(--text-muted);
  font-weight: 500;
}

.timer-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 10px;
}

.ctrl-btn {
  border: none;
  font-family: inherit;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
  user-select: none;
}

.ctrl-btn.primary {
  background: var(--accent-color);
  color: #fff;
  padding: 14px 36px;
  font-size: 1.15rem;
  border-radius: var(--radius-full);
  gap: 10px;
  box-shadow: 0 8px 24px var(--accent-glow);
  min-width: 170px;
}

.ctrl-btn.primary svg {
  width: 22px;
  height: 22px;
}

.ctrl-btn.primary:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 10px 28px var(--accent-glow);
}

.ctrl-btn.primary:active {
  transform: translateY(1px);
}

.ctrl-btn.secondary {
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
}

.ctrl-btn.secondary svg {
  width: 20px;
  height: 20px;
}

.ctrl-btn.secondary:hover {
  background: var(--bg-surface-elevated);
  border-color: var(--border-hover);
  color: var(--text-primary);
  transform: translateY(-2px);
}

@media (max-width: 480px) {
  .timer-card {
    padding: 20px 16px;
  }
  .timer-display-wrap {
    width: 270px;
    height: 270px;
  }
  .progress-ring {
    width: 270px;
    height: 270px;
  }
  .progress-ring circle {
    cx: 135;
    cy: 135;
    r: 120;
  }
  .timer-digits {
    font-size: 3.5rem;
  }
  .ctrl-btn.primary {
    padding: 12px 28px;
    min-width: 140px;
    font-size: 1.05rem;
  }
}
</style>
