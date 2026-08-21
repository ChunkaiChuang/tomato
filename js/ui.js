/**
 * UI 介面更新與互動管理模組
 */
class UIController {
  constructor() {
    this.elements = {};
    this.radius = 140;
    this.circumference = 2 * Math.PI * this.radius;
  }

  init() {
    // 綁定常用 DOM 節點
    this.elements = {
      body: document.body,
      timerDisplay: document.getElementById('timer-display'),
      progressCircle: document.getElementById('progress-circle'),
      mainActionBtn: document.getElementById('main-action-btn'),
      mainBtnText: document.getElementById('main-btn-text'),
      playIcon: document.getElementById('play-icon'),
      pauseIcon: document.getElementById('pause-icon'),
      resetBtn: document.getElementById('reset-btn'),
      skipBtn: document.getElementById('skip-btn'),
      modeTabs: document.querySelectorAll('.mode-tab'),
      cycleCounter: document.getElementById('cycle-counter'),
      activeTaskName: document.getElementById('active-task-name'),
      currentTaskBadge: document.getElementById('current-task-badge'),
      taskList: document.getElementById('task-list'),
      tasksEmpty: document.getElementById('tasks-empty'),
      tasksSummary: document.getElementById('tasks-summary'),
      addTaskForm: document.getElementById('add-task-form'),
      taskInput: document.getElementById('task-input'),
      estPomodoros: document.getElementById('est-pomodoros'),
      clearCompletedBtn: document.getElementById('clear-completed-btn'),
      favicon: document.getElementById('favicon'),

      // Modals & Buttons
      statsBtn: document.getElementById('stats-btn'),
      statsModal: document.getElementById('stats-modal'),
      settingsBtn: document.getElementById('settings-btn'),
      settingsModal: document.getElementById('settings-modal'),
      settingsForm: document.getElementById('settings-form'),
      ambientBtn: document.getElementById('ambient-btn'),
      ambientBadge: document.getElementById('ambient-badge'),
      ambientModal: document.getElementById('ambient-modal'),
      ambientVolume: document.getElementById('ambient-volume'),
      ambientVolDisplay: document.getElementById('ambient-vol-display'),
      testSoundBtn: document.getElementById('test-sound-btn'),
      requestNotificationBtn: document.getElementById('request-notification-btn'),
      resetSettingsBtn: document.getElementById('reset-settings-btn'),
      soundVolInput: document.getElementById('setting-sound-vol'),
      volDisplay: document.getElementById('vol-display'),

      // Stats Elements
      statTodayPomos: document.getElementById('stat-today-pomos'),
      statTodayTime: document.getElementById('stat-today-time'),
      statTotalPomos: document.getElementById('stat-total-pomos'),
      statStreakDays: document.getElementById('stat-streak-days'),
      weeklyChart: document.getElementById('weekly-chart')
    };

    // 初始化 SVG 圓環
    if (this.elements.progressCircle) {
      this.elements.progressCircle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
      this.elements.progressCircle.style.strokeDashoffset = '0';
    }

    // 載入主題
    const settings = window.storageManager.getSettings();
    this.applyTheme(settings.theme || 'tomato');
  }

  // 格式化秒數為 MM:SS
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // 更新計時器數字與圓環進度
  updateTimerDisplay(remainingSeconds, totalSeconds, progress, mode) {
    const formatted = this.formatTime(remainingSeconds);
    if (this.elements.timerDisplay) {
      this.elements.timerDisplay.textContent = formatted;
    }

    // 更新圓環進度條 (順時針遞減)
    if (this.elements.progressCircle) {
      const offset = this.circumference * (1 - progress);
      this.elements.progressCircle.style.strokeDashoffset = offset;
    }

    // 更新網頁標題
    const modeLabels = {
      pomodoro: '專注',
      shortBreak: '短休息',
      longBreak: '長休息'
    };
    const modeLabel = modeLabels[mode] || '番茄鐘';
    document.title = `(${formatted}) ${modeLabel} | Pomodoro Focus`;
  }

  // 更新計時器開始/暫停按鈕狀態
  updateTimerState(isRunning, mode) {
    if (isRunning) {
      this.elements.playIcon.classList.add('hidden');
      this.elements.pauseIcon.classList.remove('hidden');
      this.elements.mainBtnText.textContent = '暫停計時';
    } else {
      this.elements.playIcon.classList.remove('hidden');
      this.elements.pauseIcon.classList.add('hidden');
      const textMap = {
        pomodoro: '開始專注',
        shortBreak: '開始休息',
        longBreak: '開始長休'
      };
      this.elements.mainBtnText.textContent = textMap[mode] || '開始';
    }
  }

  // 更新模式 Tab 與背景風格
  updateModeTabs(currentMode, currentCycle, maxCycle) {
    this.elements.modeTabs.forEach(tab => {
      const mode = tab.dataset.mode;
      const isActive = mode === currentMode;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // 更新 body mode class 以調整色彩
    this.elements.body.classList.remove('mode-pomodoro', 'mode-shortBreak', 'mode-longBreak');
    this.elements.body.classList.add(`mode-${currentMode}`);

    // 更新週期顯示
    if (this.elements.cycleCounter) {
      if (currentMode === 'pomodoro') {
        this.elements.cycleCounter.textContent = `第 ${currentCycle} / ${maxCycle} 週期`;
      } else if (currentMode === 'shortBreak') {
        this.elements.cycleCounter.textContent = `短休息時間（即將進入第 ${currentCycle} 週期）`;
      } else {
        this.elements.cycleCounter.textContent = `長休息放鬆時間 ☕`;
      }
    }
  }

  // 渲染任務清單
  renderTasks(tasks, activeTask) {
    if (!this.elements.taskList) return;

    this.elements.taskList.innerHTML = '';

    if (!tasks || tasks.length === 0) {
      this.elements.tasksEmpty.classList.remove('hidden');
    } else {
      this.elements.tasksEmpty.classList.add('hidden');

      tasks.forEach(task => {
        const li = document.createElement('li');
        const isActive = activeTask && activeTask.id === task.id;
        li.className = `task-item ${task.done ? 'completed' : ''} ${isActive ? 'active-focus' : ''}`;
        li.dataset.id = task.id;

        li.innerHTML = `
          <div class="task-left">
            <input type="checkbox" class="task-checkbox" ${task.done ? 'checked' : ''} title="標記完成">
            <div class="task-content" title="點擊設為目前焦點任務">
              <div class="task-title">${this.escapeHTML(task.title)}</div>
            </div>
          </div>
          <div class="task-right">
            <span class="task-pomos" title="已完成 / 預估番茄鐘">
              <span>${task.completedPomos}</span>/<span style="color:var(--text-muted)">${task.estPomos}</span> 🍅
            </span>
            <button class="task-action-btn delete-task-btn" title="刪除任務">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        `;

        this.elements.taskList.appendChild(li);
      });
    }

    // 更新當前焦點任務徽章
    if (this.elements.activeTaskName) {
      if (activeTask) {
        this.elements.activeTaskName.textContent = activeTask.title;
        this.elements.currentTaskBadge.style.opacity = '1';
      } else {
        this.elements.activeTaskName.textContent = '無特定任務';
        this.elements.currentTaskBadge.style.opacity = '0.7';
      }
    }

    // 更新任務數量摘要
    const summary = window.taskManager ? window.taskManager.getSummary() : { total: 0, completed: 0 };
    if (this.elements.tasksSummary) {
      this.elements.tasksSummary.textContent = `${summary.completed}/${summary.total} 完成`;
    }
  }

  // 渲染統計資訊 Modal
  renderStats() {
    const stats = window.storageManager.getStats();
    if (this.elements.statTodayPomos) {
      this.elements.statTodayPomos.textContent = stats.todayPomos;
    }
    if (this.elements.statTodayTime) {
      this.elements.statTodayTime.textContent = `${stats.todayMinutes} 分鐘`;
    }
    if (this.elements.statTotalPomos) {
      this.elements.statTotalPomos.textContent = stats.totalPomos;
    }
    if (this.elements.statStreakDays) {
      this.elements.statStreakDays.textContent = stats.streakDays;
    }

    // 渲染最近 7 天長條圖
    if (this.elements.weeklyChart) {
      const recent = window.storageManager.getRecent7Days();
      const maxPomos = Math.max(1, ...recent.map(d => d.pomos));

      this.elements.weeklyChart.innerHTML = recent.map(day => {
        const heightPercent = Math.max(8, (day.pomos / maxPomos) * 100);
        return `
          <div class="chart-col">
            <div class="chart-bar-wrap" title="${day.date}: ${day.pomos} 個番茄鐘 (${day.minutes}分鐘)">
              <div class="chart-bar-fill" style="height: ${day.pomos > 0 ? heightPercent : 4}%"></div>
            </div>
            <span class="chart-col-label">${day.label}</span>
          </div>
        `;
      }).join('');
    }
  }

  // 套用主題
  applyTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
  }

  // 填充設定表單
  populateSettingsForm(settings) {
    const form = this.elements.settingsForm;
    if (!form) return;

    form.pomodoro.value = settings.pomodoro;
    form.shortBreak.value = settings.shortBreak;
    form.longBreak.value = settings.longBreak;
    form.longBreakInterval.value = settings.longBreakInterval;
    form.autoStartBreaks.checked = settings.autoStartBreaks;
    form.autoStartPomodoros.checked = settings.autoStartPomodoros;
    form.soundType.value = settings.soundType;
    form.soundVolume.value = settings.soundVolume;
    this.elements.volDisplay.textContent = `${settings.soundVolume}%`;

    // 勾選對應的主題 radio
    const themeRadio = form.querySelector(`input[name="theme"][value="${settings.theme}"]`);
    if (themeRadio) themeRadio.checked = true;

    // 通知按鈕狀態
    this.updateNotificationBtnStatus();
  }

  updateNotificationBtnStatus() {
    const btn = this.elements.requestNotificationBtn;
    if (!btn || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      btn.textContent = '已授權 ✓';
      btn.disabled = true;
      btn.style.opacity = '0.7';
    } else if (Notification.permission === 'denied') {
      btn.textContent = '已封鎖 🚫';
      btn.disabled = true;
      btn.style.opacity = '0.7';
    } else {
      btn.textContent = '啟用通知';
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  }

  // 彈出桌面通知
  showDesktopNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: body,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍅</text></svg>'
        });
      } catch (e) {
        console.warn('桌面通知觸發失敗', e);
      }
    }
  }

  // 開啟 Modal
  openModal(modalElement) {
    if (modalElement) {
      modalElement.classList.remove('hidden');
    }
  }

  // 關閉 Modal
  closeModal(modalElement) {
    if (modalElement) {
      modalElement.classList.add('hidden');
    }
  }

  escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
}

window.uiController = new UIController();
