<template>
  <div v-if="isOpen" class="modal-overlay" role="dialog" aria-modal="true" @click.self="$emit('close')">
    <div class="modal-card settings-card">
      <div class="modal-header">
        <h3>⚙️ 偏好設定</h3>
        <button class="modal-close" @click="$emit('close')">&times;</button>
      </div>
      <form class="modal-body settings-body" @submit.prevent="handleSave">
        <!-- 時長設定 -->
        <fieldset class="setting-group">
          <legend class="setting-group-title">⏱️ 時間設定（分鐘）</legend>
          <div class="duration-inputs">
            <div class="input-field">
              <label>專注時長</label>
              <input type="number" v-model.number="form.pomodoro" min="1" max="120" required />
            </div>
            <div class="input-field">
              <label>短休息</label>
              <input type="number" v-model.number="form.shortBreak" min="1" max="60" required />
            </div>
            <div class="input-field">
              <label>長休息</label>
              <input type="number" v-model.number="form.longBreak" min="1" max="90" required />
            </div>
          </div>
          <div class="input-row mt-3">
            <label>長休息間隔（完成幾次專注）</label>
            <input type="number" v-model.number="form.longBreakInterval" min="1" max="12" required class="input-sm" />
          </div>
        </fieldset>

        <!-- 自動流程開關 -->
        <fieldset class="setting-group">
          <legend class="setting-group-title">🔄 自動化設定</legend>
          <div class="toggle-row">
            <label>專注結束後自動開始休息</label>
            <label class="switch">
              <input type="checkbox" v-model="form.autoStartBreaks" />
              <span class="slider"></span>
            </label>
          </div>
          <div class="toggle-row">
            <label>休息結束後自動開始專注</label>
            <label class="switch">
              <input type="checkbox" v-model="form.autoStartPomodoros" />
              <span class="slider"></span>
            </label>
          </div>
        </fieldset>

        <!-- 音效與提醒 -->
        <fieldset class="setting-group">
          <legend class="setting-group-title">🔔 提示音效與通知</legend>
          <div class="input-row">
            <label>完成提示音</label>
            <div class="sound-select-wrap">
              <select v-model="form.soundType">
                <option value="bell">清脆鐘聲 (Bell Chime)</option>
                <option value="zen">禪風木魚 (Zen Bell)</option>
                <option value="digital">數位節奏 (Digital Beep)</option>
                <option value="marimba">輕快木琴 (Marimba)</option>
                <option value="silent">靜音 (Silent)</option>
              </select>
              <button type="button" class="btn-sm" @click="$emit('test-sound', form.soundType)">試聽</button>
            </div>
          </div>

          <div class="input-row">
            <label>提示音量</label>
            <input type="range" v-model.number="form.soundVolume" min="0" max="100" @input="$emit('preview-volume', form.soundVolume)" />
            <span>{{ form.soundVolume }}%</span>
          </div>

          <div class="toggle-row">
            <div>
              <label>瀏覽器桌面通知</label>
              <span class="setting-subtext">在分頁處於背景時彈出系統提醒</span>
            </div>
            <button type="button" class="btn-sm" :disabled="notificationGranted" @click="requestNotification">
              {{ notificationStatusText }}
            </button>
          </div>
        </fieldset>

        <!-- 主題配色 -->
        <fieldset class="setting-group">
          <legend class="setting-group-title">🎨 主題風格</legend>
          <div class="theme-palette-grid">
            <label class="theme-option">
              <input type="radio" v-model="form.theme" value="tomato" />
              <span class="theme-preview" style="background: linear-gradient(135deg, #e5484d, #f76808);"></span>
              <span>經典番茄</span>
            </label>
            <label class="theme-option">
              <input type="radio" v-model="form.theme" value="dark" />
              <span class="theme-preview" style="background: linear-gradient(135deg, #18191d, #272a34);"></span>
              <span>深邃暗黑</span>
            </label>
            <label class="theme-option">
              <input type="radio" v-model="form.theme" value="forest" />
              <span class="theme-preview" style="background: linear-gradient(135deg, #2b8a3e, #40c057);"></span>
              <span>沉靜森林</span>
            </label>
            <label class="theme-option">
              <input type="radio" v-model="form.theme" value="ocean" />
              <span class="theme-preview" style="background: linear-gradient(135deg, #1971c2, #339af0);"></span>
              <span>清爽海洋</span>
            </label>
            <label class="theme-option">
              <input type="radio" v-model="form.theme" value="lavender" />
              <span class="theme-preview" style="background: linear-gradient(135deg, #7048e8, #9775fa);"></span>
              <span>溫柔薰衣草</span>
            </label>
          </div>
        </fieldset>

        <div class="modal-footer">
          <button type="button" class="text-btn" @click="handleReset">恢復預設值</button>
          <button type="submit" class="btn-primary">儲存設定</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, ref, computed } from 'vue';

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  settings: { type: Object, required: true },
  defaultSettings: { type: Object, required: true }
});

const emit = defineEmits(['close', 'save', 'test-sound', 'preview-volume']);

const form = reactive({ ...props.settings });

watch(() => props.settings, (newVal) => {
  Object.assign(form, newVal);
}, { deep: true });

const notificationGranted = ref('Notification' in window && Notification.permission === 'granted');
const notificationDenied = ref('Notification' in window && Notification.permission === 'denied');

const notificationStatusText = computed(() => {
  if (notificationGranted.value) return '已授權 ✓';
  if (notificationDenied.value) return '已封鎖 🚫';
  return '啟用通知';
});

const requestNotification = async () => {
  if ('Notification' in window) {
    const res = await Notification.requestPermission();
    notificationGranted.value = res === 'granted';
    notificationDenied.value = res === 'denied';
    if (res === 'granted') {
      new Notification('🎉 通知已啟用！', { body: '番茄鐘計時結束時將會提醒您。' });
    }
  }
};

const handleSave = () => {
  emit('save', { ...form });
  emit('close');
};

const handleReset = () => {
  if (confirm('確定要恢復預設設定值嗎？')) {
    Object.assign(form, props.defaultSettings);
    emit('save', { ...props.defaultSettings });
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-md);
  padding: 24px;
  position: relative;
  animation: modal-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modal-pop {
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
}

.modal-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  transition: var(--transition);
}

.modal-close:hover {
  color: var(--text-primary);
}

.setting-group {
  border: none;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-group-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.duration-inputs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.input-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-field label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.input-field input, .input-row input[type="number"], select {
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.9rem;
  padding: 8px 10px;
  outline: none;
  transition: var(--transition);
}

.input-field input:focus, select:focus {
  border-color: var(--accent-color);
}

.input-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
}

.input-sm {
  width: 70px;
  text-align: center;
}

.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.setting-subtext {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  transition: 0.3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: var(--text-secondary);
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: var(--accent-color);
  border-color: var(--accent-color);
}

input:checked + .slider:before {
  transform: translateX(20px);
  background-color: #fff;
}

.sound-select-wrap {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-sm {
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
}

.btn-sm:hover:not(:disabled) {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: #fff;
}

.btn-sm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.theme-palette-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 10px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-align: center;
}

.theme-option input {
  display: none;
}

.theme-preview {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: var(--transition);
}

.theme-option input:checked + .theme-preview {
  border-color: #fff;
  transform: scale(1.1);
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.text-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

.text-btn:hover {
  color: var(--accent-color);
  text-decoration: underline;
}

.btn-primary {
  background: var(--accent-color);
  border: none;
  color: #fff;
  padding: 10px 24px;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.95rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
}

.btn-primary:hover {
  background: var(--accent-hover);
}

@media (max-width: 480px) {
  .duration-inputs {
    grid-template-columns: 1fr;
  }
}
</style>
