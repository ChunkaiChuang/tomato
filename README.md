# 🍅 Pomodoro Focus | 現代簡約番茄鐘 (Vue 3 + Vite)

一個採用 **Vue 3（Composition API + `<script setup>`）+ Vite** 打造的現代化番茄鐘 Web 應用程式。

---

## ✨ 核心特色

1. **⏱️ 核心番茄工作法計時**：專注 (25m)、短休息 (5m)、長休息 (15m)，SVG 圓形倒數動畫與防休眠 Web Worker 精準計時。
2. **📝 待辦任務管理清單**：新增、勾選、預估/實際番茄數追蹤、焦點任務綁定。
3. **🔔 Web Audio 音效 & 桌面通知**：內建 4 款合成提示音與 4 款專注白噪音（滴答、雨聲、白噪音、流水）。
4. **🎨 5 款精美主題色彩**：經典番茄、深邃暗黑、沉靜森林、清爽海洋、溫柔薰衣草。
5. **📊 專注數據統計與 Streak**：今日專注時間、累計番茄數、連續天數 (Streak 🔥) 與 7 天趨勢長條圖。
6. **⌨️ 便捷鍵盤快捷鍵**：<kbd>Space</kbd> 開始/暫停、<kbd>Alt</kbd>+<kbd>S</kbd> 跳過、<kbd>Alt</kbd>+<kbd>R</kbd> 重置、<kbd>Esc</kbd> 關閉彈窗。

---

## 🚀 本機開發與運行

```bash
# 1. 安裝依賴
npm install

# 2. 啟動本機開發伺服器
npm run dev

# 3. 生產環境打包
npm run build
```

---

## 🌐 免費線上部署指南

### 方案 A：部署到 Vercel（⭐ 最推薦，超簡單，每次 git push 自動部署）

1. 將專案推送到您的 **GitHub Repository**。
2. 前往 [Vercel 官網](https://vercel.com/) 使用 GitHub 帳號登入。
3. 點擊 **「Add New...」→「Project」**。
4. 選擇您的番茄鐘專案（Repository）點擊 **「Import」**。
5. Vercel 會自動辨識為 Vite 專案，直接點擊 **「Deploy」**。
6. 約 30 秒即可取得免費的專屬線上網址（如 `https://your-tomato-app.vercel.app`）！

---

### 方案 B：部署到 GitHub Pages（完全免費）

本專案已內建 `.github/workflows/deploy.yml` 自動化工作流程：

1. 在 GitHub 上建立一個新 Repository 並將程式碼推送到 `main` 分支。
2. 進入該 GitHub 專案的 **Settings**（設定）→ **Pages**。
3. 在 **Build and deployment** 下方的 **Source** 選擇 **「GitHub Actions」**。
4. 之後每次推送到 `main` 分支，GitHub 就會自動完成建置並發布到：
   `https://<您的GitHub帳號>.github.io/<專案名稱>/`
