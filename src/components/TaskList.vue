<template>
  <section class="tasks-section">
    <div class="tasks-header">
      <div class="tasks-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 11l3 3L22 4"></path>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        <h2>今日待辦任務</h2>
        <span class="task-count-tag">{{ summary.completed }}/{{ summary.total }} 完成</span>
      </div>
      <div class="tasks-menu">
        <button class="text-btn" title="清除所有已完成任務" @click="$emit('clear-completed')">
          清除已完成
        </button>
      </div>
    </div>

    <!-- 新增任務表單 -->
    <form class="add-task-form" @submit.prevent="handleSubmit">
      <input 
        type="text" 
        v-model="newTaskTitle" 
        placeholder="有什麼想要專注完成的任務嗎？..." 
        autocomplete="off" 
        required 
      />
      <div class="task-input-est">
        <label title="預估需要花費幾個番茄鐘">預估：</label>
        <input type="number" v-model.number="estPomos" min="1" max="20" step="1" />
        <span class="est-icon">🍅</span>
      </div>
      <button type="submit" class="add-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        新增
      </button>
    </form>

    <!-- 任務列表 -->
    <ul v-if="tasks.length > 0" class="task-list">
      <li 
        v-for="task in tasks" 
        :key="task.id" 
        class="task-item" 
        :class="{ 
          completed: task.done, 
          'active-focus': activeTaskId === task.id && !task.done 
        }"
        @click="$emit('select-task', task.id)"
      >
        <div class="task-left">
          <input 
            type="checkbox" 
            class="task-checkbox" 
            :checked="task.done" 
            title="標記完成" 
            @click.stop="$emit('toggle-task', task.id)" 
          />
          <div class="task-content" title="點擊設為目前焦點任務">
            <div class="task-title">{{ task.title }}</div>
          </div>
        </div>
        <div class="task-right">
          <span class="task-pomos" title="已完成 / 預估番茄鐘">
            <span>{{ task.completedPomos }}</span>/<span style="color:var(--text-muted)">{{ task.estPomos }}</span> 🍅
          </span>
          <button 
            class="task-action-btn delete-task-btn" 
            title="刪除任務" 
            @click.stop="$emit('delete-task', task.id)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </li>
    </ul>

    <!-- 空白提示 -->
    <div v-else class="tasks-empty">
      <p>目前沒有任務，在上方新增一個任務開始專注吧！🌱</p>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  tasks: { type: Array, required: true },
  activeTaskId: { type: String, default: null },
  summary: { type: Object, required: true }
});

const emit = defineEmits(['add-task', 'toggle-task', 'delete-task', 'select-task', 'clear-completed']);

const newTaskTitle = ref('');
const estPomos = ref(1);

const handleSubmit = () => {
  if (newTaskTitle.value.trim()) {
    emit('add-task', newTaskTitle.value.trim(), estPomos.value);
    newTaskTitle.value = '';
    estPomos.value = 1;
  }
};
</script>

<style scoped>
.tasks-section {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-md);
}

.tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.tasks-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tasks-title svg {
  width: 20px;
  height: 20px;
  color: var(--accent-color);
}

.tasks-title h2 {
  font-size: 1.1rem;
  font-weight: 700;
}

.task-count-tag {
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: 600;
}

.text-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  transition: var(--transition);
}

.text-btn:hover {
  color: var(--accent-color);
  text-decoration: underline;
}

.add-task-form {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 6px 8px;
  transition: var(--transition);
}

.add-task-form:focus-within {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-light);
}

.add-task-form input[type="text"] {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.95rem;
  padding: 6px 8px;
  outline: none;
}

.add-task-form input[type="text"]::placeholder {
  color: var(--text-muted);
}

.task-input-est {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  border-left: 1px solid var(--border-color);
  color: var(--text-muted);
  font-size: 0.85rem;
}

.task-input-est input[type="number"] {
  width: 42px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  padding: 4px;
  text-align: center;
  outline: none;
}

.est-icon {
  font-size: 0.9rem;
}

.add-btn {
  background: var(--accent-color);
  border: none;
  color: #fff;
  border-radius: var(--radius-sm);
  padding: 6px 14px;
  font-family: inherit;
  font-weight: 600;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: var(--transition);
}

.add-btn svg {
  width: 16px;
  height: 16px;
}

.add-btn:hover {
  background: var(--accent-hover);
}

.task-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  gap: 12px;
  transition: var(--transition);
  cursor: pointer;
}

.task-item:hover {
  border-color: var(--border-hover);
  transform: translateX(2px);
}

.task-item.active-focus {
  border-color: var(--accent-color);
  box-shadow: 0 0 14px var(--accent-light);
  background: rgba(255, 255, 255, 0.04);
}

.task-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.task-checkbox {
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid var(--text-muted);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  transition: var(--transition);
  flex-shrink: 0;
}

.task-checkbox:checked {
  background: var(--success-color);
  border-color: var(--success-color);
}

.task-checkbox:checked::after {
  content: "✓";
  position: absolute;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-title {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

.task-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.task-pomos {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 3px;
}

.task-action-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: var(--transition);
  display: inline-flex;
}

.task-action-btn:hover {
  color: #ff5252;
  background: rgba(255, 82, 82, 0.1);
}

.task-action-btn svg {
  width: 16px;
  height: 16px;
}

.tasks-empty {
  text-align: center;
  padding: 24px 12px;
  color: var(--text-muted);
  font-size: 0.9rem;
}
</style>
