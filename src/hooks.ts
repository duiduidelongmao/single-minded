import { useState, useEffect, useRef, useCallback } from 'react'
import type { TimerData } from './types'

const DEFAULT_STATE: TimerData = {
  state: 'idle',
  durationMinutes: 25,
  remainingSeconds: 25 * 60,
  accentColor: 'blue',
  displayMode: 'both',
  isPinned: false,
  launchAtLogin: false,
}

export function useTimerState() {
  const [timerData, setTimerData] = useState<TimerData>(DEFAULT_STATE)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // 初始加载状态
    window.electronAPI.getState().then((state) => {
      setTimerData(state)
      setIsLoaded(true)
    })

    // 监听状态更新
    const unsub = window.electronAPI.onStateUpdate((state) => {
      setTimerData(state)
    })

    return () => { unsub() }
  }, [])

  return { timerData, isLoaded }
}

export function useHover() {
  const [isHovered, setIsHovered] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onEnter = useCallback(() => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    setIsHovered(true)
  }, [])

  const onLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => setIsHovered(false), 80)
  }, [])

  return { isHovered, onEnter, onLeave }
}
