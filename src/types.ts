// 计时器状态类型定义
export type TimerState = 'idle' | 'running' | 'paused' | 'completed'
export type DisplayMode = 'menuBarOnly' | 'desktopOnly' | 'both'
export type AccentColor = 'blue' | 'orange' | 'white' | 'teal' | 'yellow' | 'green' | 'purple' | 'pink'

export interface TimerData {
  state: TimerState
  durationMinutes: number
  remainingSeconds: number
  accentColor: AccentColor
  displayMode: DisplayMode
  isPinned: boolean
  launchAtLogin: boolean
}

export const ACCENT_COLORS: Record<AccentColor, string> = {
  blue: '#007AFF',
  orange: '#FF5722',
  white: '#FFFFFF',
  teal: '#5AC8FA',
  yellow: '#FFCC00',
  green: '#34C759',
  purple: '#AF52DE',
  pink: '#FF2D55',
}

export function formattedTime(remainingSeconds: number): string {
  const m = Math.floor(remainingSeconds / 60)
  const s = remainingSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function progress(remainingSeconds: number, durationMinutes: number): number {
  if (durationMinutes <= 0) return 0
  return remainingSeconds / (durationMinutes * 60)
}

// Electron API 类型声明
declare global {
  interface Window {
    electronAPI: {
      getState: () => Promise<TimerData>
      startTimer: () => void
      pauseTimer: () => void
      resetTimer: () => void
      startOrPause: () => void
      setDuration: (minutes: number) => void
      openSettings: () => void
      closeSettings: () => void
      closeTimerWindow: () => void
      updateSettings: (updates: Partial<TimerData>) => void
      onStateUpdate: (callback: (state: TimerData) => void) => () => void
      onSettingsClosed: (callback: () => void) => () => void
      startDrag: (mouseX: number, mouseY: number) => void
      endDrag: () => void
    }
  }
}
