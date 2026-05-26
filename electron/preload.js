const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // 获取初始状态
  getState: () => ipcRenderer.invoke('get-state'),

  // 计时器控制
  startTimer: () => ipcRenderer.send('timer-start'),
  pauseTimer: () => ipcRenderer.send('timer-pause'),
  resetTimer: () => ipcRenderer.send('timer-reset'),
  startOrPause: () => ipcRenderer.send('timer-start-or-pause'),
  setDuration: (minutes) => ipcRenderer.send('set-duration', minutes),

  // 窗口控制
  openSettings: () => ipcRenderer.send('open-settings'),
  closeSettings: () => ipcRenderer.send('close-settings'),
  closeTimerWindow: () => ipcRenderer.send('close-timer-window'),

  // 设置更新
  updateSettings: (updates) => ipcRenderer.send('update-settings', updates),

  // 状态监听
  onStateUpdate: (callback) => {
    const handler = (_, state) => callback(state)
    ipcRenderer.on('timer-state-update', handler)
    return () => ipcRenderer.removeListener('timer-state-update', handler)
  },

  onSettingsClosed: (callback) => {
    ipcRenderer.on('settings-closed', callback)
    return () => ipcRenderer.removeListener('settings-closed', callback)
  },

  // 窗口拖动
  startDrag: (mouseX, mouseY) => ipcRenderer.send('window-drag-start', { mouseX, mouseY }),
  endDrag: () => ipcRenderer.send('window-drag-end'),
})
