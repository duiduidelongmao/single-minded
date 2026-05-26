const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, shell } = require('electron')
const path = require('path')
const Store = require('./store')

const isDev = process.env.NODE_ENV === 'development'

let timerWindow = null
let settingsWindow = null
let tray = null
const store = new Store()

// 计时器状态（主进程权威状态）
let timerState = {
  state: 'idle',           // idle | running | paused | completed
  durationMinutes: store.get('durationMinutes', 25),
  remainingSeconds: store.get('remainingSeconds', 0),
  accentColor: store.get('accentColor', 'blue'),
  displayMode: store.get('displayMode', 'both'), // menuBarOnly | desktopOnly | both
  isPinned: store.get('isPinned', false),
  launchAtLogin: store.get('launchAtLogin', false),
}

if (timerState.remainingSeconds === 0) {
  timerState.remainingSeconds = timerState.durationMinutes * 60
}

let tickInterval = null

function saveState() {
  store.set('durationMinutes', timerState.durationMinutes)
  store.set('remainingSeconds', timerState.remainingSeconds)
  store.set('accentColor', timerState.accentColor)
  store.set('displayMode', timerState.displayMode)
  store.set('isPinned', timerState.isPinned)
  store.set('launchAtLogin', timerState.launchAtLogin)
  store.set('timerState', timerState.state)
}

function broadcastState() {
  const wins = [timerWindow, settingsWindow].filter(Boolean)
  wins.forEach(win => {
    if (!win.isDestroyed()) {
      win.webContents.send('timer-state-update', timerState)
    }
  })
  updateTrayMenu()
}

function formattedTime() {
  const m = Math.floor(timerState.remainingSeconds / 60)
  const s = timerState.remainingSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── 计时器逻辑 ───────────────────────────────────────────────────────────────

function startTimer() {
  if (timerState.state === 'completed') return
  if (tickInterval) clearInterval(tickInterval)
  timerState.state = 'running'
  tickInterval = setInterval(() => {
    if (timerState.state !== 'running') return
    if (timerState.remainingSeconds <= 1) {
      timerState.remainingSeconds = 0
      timerState.state = 'completed'
      clearInterval(tickInterval)
      tickInterval = null
      saveState()
      broadcastState()
    } else {
      timerState.remainingSeconds -= 1
      broadcastState()
      saveState()
    }
  }, 1000)
  saveState()
  broadcastState()
}

function pauseTimer() {
  if (tickInterval) clearInterval(tickInterval)
  tickInterval = null
  timerState.state = 'paused'
  saveState()
  broadcastState()
}

function resetTimer() {
  if (tickInterval) clearInterval(tickInterval)
  tickInterval = null
  timerState.durationMinutes = 25
  timerState.remainingSeconds = 25 * 60
  timerState.state = 'idle'
  saveState()
  broadcastState()
}

function setDuration(minutes) {
  const clamped = Math.min(Math.max(minutes, 1), 90)
  if (timerState.durationMinutes === clamped) return
  if (tickInterval) clearInterval(tickInterval)
  tickInterval = null
  timerState.durationMinutes = clamped
  timerState.remainingSeconds = clamped * 60
  timerState.state = 'idle'
  saveState()
  broadcastState()
}

function startOrPause() {
  if (timerState.state === 'running') {
    pauseTimer()
  } else if (timerState.state === 'completed') {
    resetTimer()
  } else {
    startTimer()
  }
}

// ─── 窗口创建 ─────────────────────────────────────────────────────────────────

function getTimerURL() {
  return isDev ? 'http://localhost:5173/index.html' : `file://${path.join(__dirname, '../dist/index.html')}`
}

function getSettingsURL() {
  return isDev ? 'http://localhost:5173/settings.html' : `file://${path.join(__dirname, '../dist/settings.html')}`
}

function createTimerWindow() {
  const savedBounds = store.get('timerWindowBounds', { x: undefined, y: undefined, width: 340, height: 140 })

  timerWindow = new BrowserWindow({
    x: savedBounds.x,
    y: savedBounds.y,
    width: savedBounds.width || 340,
    height: savedBounds.height || 140,
    minWidth: 220,
    minHeight: 100,
    maxWidth: 500,
    maxHeight: 220,
    transparent: true,
    frame: false,
    resizable: true,
    alwaysOnTop: timerState.isPinned,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  timerWindow.loadURL(getTimerURL())

  timerWindow.once('ready-to-show', () => {
    if (timerState.displayMode !== 'menuBarOnly') {
      timerWindow.show()
    }
  })

  timerWindow.on('moved', () => {
    store.set('timerWindowBounds', timerWindow.getBounds())
  })
  timerWindow.on('resized', () => {
    store.set('timerWindowBounds', timerWindow.getBounds())
  })

  timerWindow.on('closed', () => { timerWindow = null })
}

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus()
    return
  }

  // 打开设置时先隐藏悬浮小窗
  if (timerWindow && !timerWindow.isDestroyed()) {
    timerWindow.hide()
  }

  const savedBounds = store.get('settingsWindowBounds', { x: undefined, y: undefined, width: 520, height: 620 })

  settingsWindow = new BrowserWindow({
    x: savedBounds.x,
    y: savedBounds.y,
    width: savedBounds.width || 520,
    height: savedBounds.height || 620,
    minWidth: 480,
    minHeight: 580,
    transparent: true,
    frame: false,
    resizable: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  settingsWindow.loadURL(getSettingsURL())

  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show()
    settingsWindow.focus()
  })

  settingsWindow.on('moved', () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      store.set('settingsWindowBounds', settingsWindow.getBounds())
    }
  })

  settingsWindow.on('closed', () => {
    settingsWindow = null
    // 设置面板关闭后，根据显示模式决定是否恢复悬浮小窗
    if (timerState.displayMode !== 'menuBarOnly') {
      if (!timerWindow || timerWindow.isDestroyed()) {
        createTimerWindow()
      } else {
        timerWindow.show()
      }
    }
    // 通知 timer 窗口设置面板已关闭
    if (timerWindow && !timerWindow.isDestroyed()) {
      timerWindow.webContents.send('settings-closed')
    }
  })
}

// ─── 托盘 ────────────────────────────────────────────────────────────────────

/**
 * 用纯 JS 手工生成 16x16 RGBA PNG 数据
 * 画一个白色时钟圆圈 + 指针，对 Electron nativeImage 直接传入
 */
function createTrayNativeImage() {
  const SIZE = 16
  const cx = 7.5, cy = 7.5, r = 6

  // 创建 RGBA buffer
  const buf = Buffer.alloc(SIZE * SIZE * 4, 0)

  function setPixel(x, y, a) {
    if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return
    const idx = (y * SIZE + x) * 4
    buf[idx] = 255     // R
    buf[idx + 1] = 255 // G
    buf[idx + 2] = 255 // B
    buf[idx + 3] = Math.max(buf[idx + 3], Math.round(a * 255))
  }

  // 画圆弧（诺基州圆）
  function drawCircle(cx, cy, r, thickness) {
    const steps = 360
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2
      for (let t = -thickness / 2; t <= thickness / 2; t += 0.3) {
        const px = cx + (r + t) * Math.cos(angle)
        const py = cy + (r + t) * Math.sin(angle)
        setPixel(Math.round(px), Math.round(py), 0.92)
      }
    }
  }

  // 画线段（Bresenham + 子像素）
  function drawLine(x0, y0, x1, y1, thickness) {
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 4)
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const px = x0 + (x1 - x0) * t
      const py = y0 + (y1 - y0) * t
      for (let dx = -thickness / 2; dx <= thickness / 2; dx += 0.4) {
        for (let dy = -thickness / 2; dy <= thickness / 2; dy += 0.4) {
          if (dx * dx + dy * dy <= (thickness / 2) * (thickness / 2)) {
            setPixel(Math.round(px + dx), Math.round(py + dy), 0.92)
          }
        }
      }
    }
  }

  // 画圆弧
  drawCircle(cx, cy, r, 1.2)
  // 画时针（12点方向）
  drawLine(cx, cy, cx, cy - r * 0.62, 1.0)
  // 画分针，指向 3 点）
  drawLine(cx, cy, cx + r * 0.55, cy, 1.0)
  // 画中心点
  setPixel(Math.round(cx), Math.round(cy), 1)
  setPixel(Math.round(cx) + 1, Math.round(cy), 0.7)
  setPixel(Math.round(cx), Math.round(cy) + 1, 0.7)

  return nativeImage.createFromBuffer(buf, { width: SIZE, height: SIZE })
}

function createTrayIcon() {
  const icon = createTrayNativeImage()

  tray = new Tray(icon)
  tray.setToolTip('专注时刻')
  updateTrayMenu()

  tray.on('double-click', () => {
    toggleTimerWindow()
  })
}

function updateTrayMenu() {
  if (!tray) return

  const stateLabel = {
    idle: `准备专注 · ${formattedTime()}`,
    running: `专注中 · ${formattedTime()}`,
    paused: `已暂停 · ${formattedTime()}`,
    completed: '已完成 · 00:00',
  }[timerState.state] || formattedTime()

  const menu = Menu.buildFromTemplate([
    { label: stateLabel, enabled: false },
    { type: 'separator' },
    { label: '25 分钟', type: 'radio', checked: timerState.durationMinutes === 25, click: () => setDuration(25) },
    { label: '30 分钟', type: 'radio', checked: timerState.durationMinutes === 30, click: () => setDuration(30) },
    { label: '45 分钟', type: 'radio', checked: timerState.durationMinutes === 45, click: () => setDuration(45) },
    { type: 'separator' },
    { label: timerState.state === 'running' ? '暂停专注' : '继续专注', click: startOrPause },
    { label: '重置时间', click: resetTimer },
    { type: 'separator' },
    { label: '打开设置', click: createSettingsWindow },
    { label: timerState.displayMode === 'menuBarOnly' ? '显示悬浮窗' : '隐藏悬浮窗', click: toggleTimerWindow },
    { type: 'separator' },
    { label: '开机自启动', type: 'checkbox', checked: timerState.launchAtLogin, click: (item) => {
      timerState.launchAtLogin = item.checked
      app.setLoginItemSettings({ openAtLogin: timerState.launchAtLogin })
      saveState()
    }},
    { type: 'separator' },
    { label: '退出专注时刻', click: () => app.quit() },
  ])

  tray.setContextMenu(menu)
  tray.setToolTip(`专注时刻 · ${formattedTime()}`)
}

function toggleTimerWindow() {
  if (!timerWindow || timerWindow.isDestroyed()) {
    createTimerWindow()
    return
  }
  if (timerWindow.isVisible()) {
    timerWindow.hide()
  } else {
    timerWindow.show()
  }
}

// ─── IPC 处理 ─────────────────────────────────────────────────────────────────

ipcMain.handle('get-state', () => timerState)
ipcMain.on('timer-start', () => startTimer())
ipcMain.on('timer-pause', () => pauseTimer())
ipcMain.on('timer-reset', () => resetTimer())
ipcMain.on('timer-start-or-pause', () => startOrPause())
ipcMain.on('set-duration', (_, minutes) => setDuration(minutes))
ipcMain.on('open-settings', () => createSettingsWindow())
ipcMain.on('close-settings', () => {
  if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.close()
})
ipcMain.on('close-timer-window', () => {
  if (timerWindow && !timerWindow.isDestroyed()) timerWindow.hide()
})

ipcMain.on('update-settings', (_, updates) => {
  if (updates.accentColor !== undefined) timerState.accentColor = updates.accentColor
  if (updates.displayMode !== undefined) {
    timerState.displayMode = updates.displayMode
    if (updates.displayMode === 'menuBarOnly') {
      if (timerWindow && !timerWindow.isDestroyed()) timerWindow.hide()
    } else {
      if (!timerWindow || timerWindow.isDestroyed()) {
        createTimerWindow()
      } else {
        timerWindow.show()
      }
    }
  }
  if (updates.isPinned !== undefined) {
    timerState.isPinned = updates.isPinned
    if (timerWindow && !timerWindow.isDestroyed()) {
      timerWindow.setAlwaysOnTop(timerState.isPinned)
    }
  }
  if (updates.launchAtLogin !== undefined) {
    timerState.launchAtLogin = updates.launchAtLogin
    app.setLoginItemSettings({ openAtLogin: timerState.launchAtLogin })
  }
  saveState()
  broadcastState()
})

ipcMain.on('drag-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.webContents.send('start-drag')
})

// 窗口拖动支持 —— 使用 Electron 原生 startDragging
ipcMain.on('window-drag-start', (event, { mouseX, mouseY }) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win || win.isDestroyed()) return

  // 记录拖动起点
  let lastCursor = null
  let dragging = true

  const { screen } = require('electron')

  const moveHandler = setInterval(() => {
    if (!dragging || win.isDestroyed()) {
      clearInterval(moveHandler)
      return
    }
    const cursor = screen.getCursorScreenPoint()
    if (lastCursor && cursor.x === lastCursor.x && cursor.y === lastCursor.y) return
    lastCursor = cursor
    win.setPosition(Math.round(cursor.x - mouseX), Math.round(cursor.y - mouseY))
  }, 16)

  // 同时监听 drag-end 和超时双重保障
  const cleanup = () => {
    if (!dragging) return
    dragging = false
    clearInterval(moveHandler)
    if (!win.isDestroyed()) {
      const bounds = win.getBounds()
      if (win === timerWindow) store.set('timerWindowBounds', bounds)
    }
  }

  ipcMain.once('window-drag-end', cleanup)

  // 安全超时：5 秒后强制停止，防止永久跟随
  setTimeout(() => {
    if (dragging) {
      ipcMain.removeListener('window-drag-end', cleanup)
      cleanup()
    }
  }, 5000)
})

// ─── 应用生命周期 ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  app.setLoginItemSettings({ openAtLogin: timerState.launchAtLogin })

  createTimerWindow()
  createTrayIcon()
})

app.on('window-all-closed', (e) => {
  // 阻止默认退出（托盘应用不应因窗口关闭而退出）
  e.preventDefault()
})

app.on('before-quit', () => {
  if (tickInterval) clearInterval(tickInterval)
  saveState()
})
