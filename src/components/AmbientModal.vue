<template>
  <div v-if="isOpen" class="modal-overlay" role="dialog" aria-modal="true" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h3>🎧 專注背景白噪音</h3>
        <button class="modal-close" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="ambient-grid">
          <button 
            v-for="item in soundList" 
            :key="item.type"
            class="ambient-card" 
            :class="{ active: currentAmbient === item.type }"
            @click="$emit('select-ambient', item.type)"
          >
            <span class="ambient-icon">{{ item.icon }}</span>
            <span class="ambient-title">{{ item.title }}</span>
          </button>
        </div>

        <div class="ambient-vol-control">
          <label>背景音量</label>
          <input 
            type="range" 
            :value="ambientVolume" 
            min="0" 
            max="100" 
            @input="$emit('update-volume', parseInt($event.target.value))" 
          />
          <span>{{ ambientVolume }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: { type: Boolean, required: true },
  currentAmbient: { type: String, required: true },
  ambientVolume: { type: Number, required: true }
});

defineEmits(['close', 'select-ambient', 'update-volume']);

const soundList = [
  { type: 'none', icon: '🚫', title: '關閉' },
  { type: 'tick', icon: '⏱️', title: '時鐘滴答' },
  { type: 'rain', icon: '🌧️', title: '輕柔雨聲' },
  { type: 'whitenoise', icon: '📻', title: '溫和白噪音' },
  { type: 'stream', icon: '🌊', title: '潺潺流水' }
];
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

.ambient-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.ambient-card {
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: var(--transition);
  color: var(--text-secondary);
}

.ambient-card:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.ambient-card.active {
  background: var(--accent-light);
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.ambient-icon {
  font-size: 1.5rem;
}

.ambient-title {
  font-size: 0.85rem;
  font-weight: 600;
}

.ambient-vol-control {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
}

.ambient-vol-control input[type="range"] {
  flex: 1;
}
</style>
