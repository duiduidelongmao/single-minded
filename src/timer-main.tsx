import React, { useCallback, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { useTimerState, useHover } from './hooks'
import { CollapsedTimerView } from './CollapsedTimerView'

function TimerApp() {
  const { timerData, isLoaded } = useTimerState()
  const { isHovered, onEnter, onLeave } = useHover()
  const isDragging = useRef(false)

  // 在 document 级别监听 mouseup，保证即使鼠标快速移动也能可靠终止
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false
        window.electronAPI.endDrag()
      }
    }
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [])

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    // 只允许左键且非按钮区域拖动
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.tagName === 'BUTTON') return
    e.preventDefault()
    isDragging.current = true
    window.electronAPI.startDrag(e.clientX, e.clientY)
  }, [])

  const handlePrimaryControl = useCallback(() => {
    window.electronAPI.startOrPause()
  }, [])

  const handleToggleSettings = useCallback(() => {
    window.electronAPI.openSettings()
  }, [])

  const handleReset = useCallback(() => {
    window.electronAPI.resetTimer()
  }, [])

  if (!isLoaded) return null

  return (
    <div
      style={{ width: '100vw', height: '100vh', background: 'transparent' }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <CollapsedTimerView
        timer={timerData}
        isHovered={isHovered}
        onToggleSettings={handleToggleSettings}
        onPrimaryControl={handlePrimaryControl}
        onDoubleClick={handlePrimaryControl}
        onReset={handleReset}
        onDragStart={handleDragStart}
      />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<TimerApp />)
