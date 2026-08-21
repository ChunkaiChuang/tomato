/**
 * 任務清單管理模組 (Task Manager)
 */
class TaskManager {
  constructor() {
    this.tasks = [];
    this.activeTaskId = null;
    this.onTasksChange = null;

    this.load();
  }

  load() {
    if (window.storageManager) {
      this.tasks = window.storageManager.getTasks();
      this.activeTaskId = window.storageManager.getActiveTaskId();
    }
  }

  save() {
    if (window.storageManager) {
      window.storageManager.saveTasks(this.tasks);
      window.storageManager.setActiveTaskId(this.activeTaskId);
    }
    if (this.onTasksChange) {
      this.onTasksChange(this.tasks, this.getActiveTask());
    }
  }

  // 取得目前焦點任務
  getActiveTask() {
    return this.tasks.find(t => t.id === this.activeTaskId && !t.done) || null;
  }

  // 設定焦點任務
  setActiveTask(id) {
    if (this.activeTaskId === id) {
      this.activeTaskId = null; // 取消選取
    } else {
      const task = this.tasks.find(t => t.id === id);
      if (task && !task.done) {
        this.activeTaskId = id;
      } else {
        this.activeTaskId = null;
      }
    }
    this.save();
  }

  // 新增任務
  addTask(title, estPomos = 1) {
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

    this.tasks.push(newTask);

    // 如果沒有焦點任務，自動設為焦點任務
    if (!this.activeTaskId) {
      this.activeTaskId = newTask.id;
    }

    this.save();
    return newTask;
  }

  // 切換任務完成狀態
  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;

    task.done = !task.done;

    // 如果已完成且剛好是焦點任務，解除焦點
    if (task.done && this.activeTaskId === id) {
      this.activeTaskId = null;
      // 自動尋找下一個未完成任務作為焦點
      const nextTask = this.tasks.find(t => !t.done);
      if (nextTask) {
        this.activeTaskId = nextTask.id;
      }
    }

    this.save();
  }

  // 刪除任務
  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    if (this.activeTaskId === id) {
      this.activeTaskId = null;
      const nextTask = this.tasks.find(t => !t.done);
      if (nextTask) {
        this.activeTaskId = nextTask.id;
      }
    }
    this.save();
  }

  // 清除所有已完成任務
  clearCompleted() {
    this.tasks = this.tasks.filter(t => !t.done);
    this.save();
  }

  // 當完成一個專注番茄時，自動累加目前焦點任務的番茄數
  incrementActiveTaskPomodoro() {
    const activeTask = this.getActiveTask();
    if (activeTask) {
      activeTask.completedPomos += 1;
      // 若達到預估目標且尚未標記，可保持未完成供使用者手動勾選
      this.save();
    }
  }

  // 取得統計摘要
  getSummary() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.done).length;
    return { total, completed };
  }
}

window.taskManager = new TaskManager();
