import { ref, computed, watch } from 'vue';

const TASKS_KEY = 'pomodoro_tasks';
const ACTIVE_TASK_KEY = 'pomodoro_active_task';

export function useTasks() {
  const initialTasks = (() => {
    try {
      const data = localStorage.getItem(TASKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  })();

  const initialActiveId = localStorage.getItem(ACTIVE_TASK_KEY) || null;

  const tasks = ref(initialTasks);
  const activeTaskId = ref(initialActiveId);

  // 儲存至 LocalStorage
  watch(tasks, (newVal) => {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(newVal));
    } catch (e) {}
  }, { deep: true });

  watch(activeTaskId, (newVal) => {
    if (newVal) {
      localStorage.setItem(ACTIVE_TASK_KEY, newVal);
    } else {
      localStorage.removeItem(ACTIVE_TASK_KEY);
    }
  });

  const activeTask = computed(() => {
    return tasks.value.find(t => t.id === activeTaskId.value && !t.done) || null;
  });

  const summary = computed(() => {
    const total = tasks.value.length;
    const completed = tasks.value.filter(t => t.done).length;
    return { total, completed };
  });

  const addTask = (title, estPomos = 1) => {
    const trimmed = title.trim();
    if (!trimmed) return null;

    const newTask = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
      title: trimmed,
      estPomos: Math.max(1, parseInt(estPomos) || 1),
      completedPomos: 0,
      done: false,
      createdAt: Date.now()
    };

    tasks.value.push(newTask);

    if (!activeTaskId.value) {
      activeTaskId.value = newTask.id;
    }

    return newTask;
  };

  const toggleTask = (id) => {
    const task = tasks.value.find(t => t.id === id);
    if (!task) return;

    task.done = !task.done;

    if (task.done && activeTaskId.value === id) {
      activeTaskId.value = null;
      const nextTask = tasks.value.find(t => !t.done);
      if (nextTask) {
        activeTaskId.value = nextTask.id;
      }
    }
  };

  const deleteTask = (id) => {
    tasks.value = tasks.value.filter(t => t.id !== id);
    if (activeTaskId.value === id) {
      activeTaskId.value = null;
      const nextTask = tasks.value.find(t => !t.done);
      if (nextTask) {
        activeTaskId.value = nextTask.id;
      }
    }
  };

  const setActiveTask = (id) => {
    if (activeTaskId.value === id) {
      activeTaskId.value = null;
    } else {
      const task = tasks.value.find(t => t.id === id);
      if (task && !task.done) {
        activeTaskId.value = id;
      } else {
        activeTaskId.value = null;
      }
    }
  };

  const clearCompleted = () => {
    tasks.value = tasks.value.filter(t => !t.done);
  };

  const incrementActiveTaskPomodoro = () => {
    if (activeTask.value) {
      activeTask.value.completedPomos += 1;
    }
  };

  return {
    tasks,
    activeTaskId,
    activeTask,
    summary,
    addTask,
    toggleTask,
    deleteTask,
    setActiveTask,
    clearCompleted,
    incrementActiveTaskPomodoro
  };
}
