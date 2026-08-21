<template>
  <div v-if="isOpen" class="modal-overlay" role="dialog" aria-modal="true" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h3>📊 專注數據統計</h3>
        <button class="modal-close" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="stats-grid">
          <div class="stat-box">
            <span class="stat-number">{{ stats.todayPomos }}</span>
            <span class="stat-label">今日完成番茄數</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">{{ stats.todayMinutes }}m</span>
            <span class="stat-label">今日專注時間</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">{{ stats.totalPomos }}</span>
            <span class="stat-label">累計總番茄數</span>
          </div>
          <div class="stat-box">
            <span class="stat-number">{{ stats.streakDays }}</span>
            <span class="stat-label">連續專注天數 🔥</span>
          </div>
        </div>

        <div class="stats-chart-section">
          <h4>最近 7 天專注趨勢</h4>
          <div class="chart-bars">
            <div 
              v-for="day in recent7Days" 
              :key="day.date" 
              class="chart-col"
            >
              <div 
                class="chart-bar-wrap" 
                :title="`${day.date}: ${day.pomos} 個番茄鐘 (${day.minutes}分鐘)`"
              >
                <div 
                  class="chart-bar-fill" 
                  :style="{ height: getBarHeight(day.pomos) }"
                ></div>
              </div>
              <span class="chart-col-label">{{ day.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  stats: { type: Object, required: true },
  recent7Days: { type: Array, required: true }
});

defineEmits(['close']);

const maxPomos = computed(() => {
  return Math.max(1, ...props.recent7Days.map(d => d.pomos));
});

const getBarHeight = (pomos) => {
  if (pomos <= 0) return '4%';
  const percent = Math.max(8, (pomos / maxPomos.value) * 100);
  return `${percent}%`;
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-box {
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-number {
  font-family: var(--font-mono);
  font-size: 1.85rem;
  font-weight: 700;
  color: var(--accent-color);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.stats-chart-section h4 {
  font-size: 0.95rem;
  margin-bottom: 12px;
  color: var(--text-secondary);
}

.chart-bars {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 140px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px 12px 10px;
  gap: 8px;
}

.chart-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
  gap: 6px;
}

.chart-bar-wrap {
  width: 100%;
  max-width: 28px;
  height: 90px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.chart-bar-fill {
  width: 100%;
  background: var(--accent-color);
  border-radius: 6px;
  transition: height 0.5s ease;
  min-height: 4px;
}

.chart-col-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}
</style>
