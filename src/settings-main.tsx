import React, { useCallback } from 'react'
import ReactDOM from 'react-dom/client'
import { useTimerState } from './hooks'
import { SettingsPanelView } from './SettingsPanelView'

function SettingsApp() {
  const { timerData, isLoaded } = useTimerState()

  const handleClose = useCallback(() => {
    window.electronAPI.closeSettings()
  }, [])

  const handlePrimaryControl = useCallback(() => {
    const wasRunning = timerData.state === 'running'
    window.electronAPI.startOrPause()
    if (!wasRunning) {
      // 开始后关闭设置面板
      setTimeout(() => window.electronAPI.closeSettings(), 100)
    }
  }, [timerData.state])

  if (!isLoaded) return null

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'transparent' }}>
      <SettingsPanelView
        timer={timerData}
        onClose={handleClose}
        onPrimaryControl={handlePrimaryControl}
      />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<SettingsApp />)
