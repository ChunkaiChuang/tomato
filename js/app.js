/**
 * 主應用程式啟動與事件綁定 (App Orchestrator)
 */
document.addEventListener('DOMContentLoaded', () => {
  const ui = window.uiController;
  const timer = window.pomodoroTimer;
  const tasks = window.taskManager;
  const storage = window.storageManager;
  const sound = window.soundEngine;

  // 1. 初始化 UI
  ui.init();

  // 載入使用者設定並套用音效與主題
  const initialSettings = storage.getSettings();
  sound.setVolume(initialSettings.soundVolume / 100);
  sound.setAmbientVolume(initialSettings.ambientVolume / 100);
  ui.applyTheme(initialSettings.theme);

  // 2. 計時器事件監聽綁定
  timer.onTick = (remaining, total, progress) => {
    ui.updateTimerDisplay(remaining, total, progress, timer.mode);
  };

  timer.onStateChange = (isRunning) => {
    ui.updateTimerState(isRunning, timer.mode);
  };

  timer.onModeChange = (mode, currentCycle, maxCycle) => {
    ui.updateModeTabs(mode, currentCycle, maxCycle);
    ui.updateTimerState(timer.isRunning, mode);
  };

  // 當倒數完成時的回呼
  timer.onComplete = (finishedMode) => {
    const settings = storage.getSettings();

    // 播放提示音
    sound.playNotification(settings.soundType);

    if (finishedMode === 'pomodoro') {
      // 記錄統計數據與專注時長
      storage.recordCompletedPomodoro(settings.pomodoro);

      // 自動累加焦點任務的已完成番茄數
      tasks.incrementActiveTaskPomodoro();

      // 桌面通知
      ui.showDesktopNotification('🍅 專注時間結束！', '太棒了！您已完成一個番茄鐘，休息一下吧。');
    } else {
      ui.showDesktopNotification('☕ 休息時間結束！', '充電完畢，準備開始下一階段的專注吧！');
    }

    // 重新渲染任務與統計
    ui.renderTasks(tasks.tasks, tasks.getActiveTask());
    ui.renderStats();
  };

  // 3. 任務事件綁定
  tasks.onTasksChange = (taskList, activeTask) => {
    ui.renderTasks(taskList, activeTask);
  };

  // 初始渲染任務與計時器
  tasks.load();
  ui.renderTasks(tasks.tasks, tasks.getActiveTask());
  timer.setMode('pomodoro', false);

  // ==========================================================================
  // UI 事件監聽
  // ==========================================================================

  // 主計時按鈕 (開始 / 暫停)
  ui.elements.mainActionBtn.addEventListener('click', () => {
    sound.playClick();
    sound.initContext();
    timer.toggle();
  });

  // 重置按鈕
  ui.elements.resetBtn.addEventListener('click', () => {
    sound.playClick();
    timer.reset();
  });

  // 跳過按鈕
  ui.elements.skipBtn.addEventListener('click', () => {
    sound.playClick();
    timer.skip();
  });

  // 模式切換 Tabs
  ui.elements.modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      sound.playClick();
      const mode = tab.dataset.mode;
      timer.setMode(mode, false);
    });
  });

  // 新增任務
  ui.elements.addTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = ui.elements.taskInput.value;
    const est = ui.elements.estPomodoros.value;
    if (title.trim()) {
      tasks.addTask(title, est);
      ui.elements.taskInput.value = '';
      ui.elements.estPomodoros.value = '1';
      ui.elements.taskInput.focus();
    }
  });

  // 任務清單項目事件委派 (點擊勾選、刪除、設為焦點)
  ui.elements.taskList.addEventListener('click', (e) => {
    const item = e.target.closest('.task-item');
    if (!item) return;
    const taskId = item.dataset.id;

    // 點擊刪除按鈕
    if (e.target.closest('.delete-task-btn')) {
      e.stopPropagation();
      tasks.deleteTask(taskId);
      return;
    }

    // 點擊勾選框
    if (e.target.classList.contains('task-checkbox')) {
      tasks.toggleTask(taskId);
      return;
    }

    // 點擊任務本體 -> 設為/取消焦點任務
    tasks.setActiveTask(taskId);
  });

  // 清除已完成任務
  ui.elements.clearCompletedBtn.addEventListener('click', () => {
    tasks.clearCompleted();
  });

  // 焦點任務 Badge 點擊
  ui.elements.currentTaskBadge.addEventListener('click', () => {
    const active = tasks.getActiveTask();
    if (active) {
      tasks.setActiveTask(active.id); // 取消選取
    }
  });

  // ==========================================================================
  // Modal 彈跳視窗互動
  // ==========================================================================

  // 統計 Modal
  ui.elements.statsBtn.addEventListener('click', () => {
    sound.playClick();
    ui.renderStats();
    ui.openModal(ui.elements.statsModal);
  });

  // 設定 Modal
  ui.elements.settingsBtn.addEventListener('click', () => {
    sound.playClick();
    const currentSettings = storage.getSettings();
    ui.populateSettingsForm(currentSettings);
    ui.openModal(ui.elements.settingsModal);
  });

  // 白噪音 Modal
  ui.elements.ambientBtn.addEventListener('click', () => {
    sound.playClick();
    ui.openModal(ui.elements.ambientModal);
  });

  // 點擊關閉按鈕或背景關閉 Modal
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('.modal-close')) {
        ui.closeModal(modal);
      }
    });
  });

  // ESC 鍵關閉所有 Modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(modal => {
        ui.closeModal(modal);
      });
    }
  });

  // 試聽提示音
  ui.elements.testSoundBtn.addEventListener('click', () => {
    const selectedSound = document.getElementById('setting-sound-type').value;
    sound.playNotification(selectedSound);
  });

  // 提示音量滑桿變更
  ui.elements.soundVolInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    ui.elements.volDisplay.textContent = `${val}%`;
    sound.setVolume(val / 100);
  });

  // 要求桌面通知權限
  ui.elements.requestNotificationBtn.addEventListener('click', async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      ui.updateNotificationBtnStatus();
      if (permission === 'granted') {
        ui.showDesktopNotification('🎉 通知已啟用！', '當番茄鐘計時結束時，將會在此提醒您。');
      }
    }
  });

  // 儲存設定表單
  ui.elements.settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = ui.elements.settingsForm;

    const newSettings = {
      ...storage.getSettings(),
      pomodoro: Math.max(1, parseInt(form.pomodoro.value) || 25),
      shortBreak: Math.max(1, parseInt(form.shortBreak.value) || 5),
      longBreak: Math.max(1, parseInt(form.longBreak.value) || 15),
      longBreakInterval: Math.max(1, parseInt(form.longBreakInterval.value) || 4),
      autoStartBreaks: form.autoStartBreaks.checked,
      autoStartPomodoros: form.autoStartPomodoros.checked,
      soundType: form.soundType.value,
      soundVolume: parseInt(form.soundVolume.value) || 80,
      theme: form.theme.value
    };

    storage.saveSettings(newSettings);
    sound.setVolume(newSettings.soundVolume / 100);
    ui.applyTheme(newSettings.theme);
    timer.updateDurations();
    ui.closeModal(ui.elements.settingsModal);
  });

  // 恢復預設設定
  ui.elements.resetSettingsBtn.addEventListener('click', () => {
    if (confirm('確定要恢復預設設定值嗎？')) {
      const def = storage.defaultSettings;
      storage.saveSettings(def);
      ui.populateSettingsForm(def);
      ui.applyTheme(def.theme);
      timer.updateDurations();
    }
  });

  // 白噪音卡片切換
  const ambientCards = document.querySelectorAll('.ambient-card');
  ambientCards.forEach(card => {
    card.addEventListener('click', () => {
      const soundType = card.dataset.sound;
      ambientCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      sound.setAmbientSound(soundType);

      // 更新頂部按鈕狀態標籤
      const titles = {
        none: '關閉',
        tick: '滴答',
        rain: '雨聲',
        whitenoise: '白噪音',
        stream: '流水'
      };
      ui.elements.ambientBadge.textContent = titles[soundType] || '開啟';
      ui.elements.ambientBadge.classList.toggle('active', soundType !== 'none');
    });
  });

  // 白噪音音量滑桿
  ui.elements.ambientVolume.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    ui.elements.ambientVolDisplay.textContent = `${val}%`;
    sound.setAmbientVolume(val / 100);
  });

  // ==========================================================================
  // 全局快捷鍵綁定
  // ==========================================================================
  window.addEventListener('keydown', (e) => {
    // 若正在輸入表單文字，不觸發全域快捷鍵
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      return;
    }

    // 空白鍵：開始 / 暫停
    if (e.code === 'Space') {
      e.preventDefault();
      sound.playClick();
      sound.initContext();
      timer.toggle();
    }

    // Alt + S：跳過階段
    if (e.altKey && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
      e.preventDefault();
      sound.playClick();
      timer.skip();
    }

    // Alt + R：重置
    if (e.altKey && (e.key === 'r' || e.key === 'R' || e.code === 'KeyR')) {
      e.preventDefault();
      sound.playClick();
      timer.reset();
    }
  });
});
