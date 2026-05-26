import React, { useCallback, useRef } from 'react'
import { ACCENT_COLORS, formattedTime } from './types'
import type { TimerData, AccentColor } from './types'

interface Props {
  timer: TimerData
  isHovered: boolean
  onToggleSettings: () => void
  onPrimaryControl: () => void
  onDoubleClick: () => void
  onReset: () => void
  onDragStart: (e: React.MouseEvent) => void
}

export function CollapsedTimerView({
  timer,
  isHovered,
  onToggleSettings,
  onPrimaryControl,
  onDoubleClick,
  onReset,
  onDragStart,
}: Props) {
  const accent = ACCENT_COLORS[timer.accentColor]
  const time = formattedTime(timer.remainingSeconds)
  const isCompleted = timer.state === 'completed'
  const isRunning = timer.state === 'running'
  const canReset =
    timer.state === 'running' ||
    timer.state === 'paused' ||
    timer.state === 'completed' ||
    timer.durationMinutes !== 25 ||
    timer.remainingSeconds !== timer.durationMinutes * 60

  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clickCount = useRef(0)

  const handleClick = useCallback(() => {
    clickCount.current += 1
    if (clickTimer.current) clearTimeout(clickTimer.current)
    clickTimer.current = setTimeout(() => {
      if (clickCount.current === 1) {
        onToggleSettings()
      } else if (clickCount.current >= 2) {
        onDoubleClick()
      }
      clickCount.current = 0
    }, 220)
  }, [onToggleSettings, onDoubleClick])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: 'default',
        borderRadius: isHovered ? 24 : 16,
        transition: 'border-radius 0.2s ease',
        overflow: 'hidden',
      }}
      onClick={handleClick}
      onMouseDown={onDragStart}
    >
      {/* 玻璃背景（hover 时显示） */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            inset: 6,
            borderRadius: 20,
            background: 'rgba(30, 30, 40, 0.62)',
            backdropFilter: 'blur(28px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
            border: '0.5px solid rgba(255,255,255,0.13)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.08)',
            pointerEvents: 'none',
            transition: 'all 0.2s ease',
          }}
        />
      )}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isHovered ? 10 : 0 }}>
        {/* 时间数字 */}
        <div
          style={{
            fontSize: isHovered ? 42 : 52,
            fontWeight: 500,
            fontFamily: "'SF Pro Rounded', 'Segoe UI', system-ui, sans-serif",
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-1px',
            color: accent,
            opacity: isCompleted ? 0.42 : 1,
            textShadow: `0 0 20px ${accent}40, 0 1px 3px rgba(0,0,0,0.4)`,
            lineHeight: 1,
            transition: 'font-size 0.2s ease, opacity 0.2s ease',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        >
          {time}
        </div>

        {/* 控制按钮（hover 时显示） */}
        {isHovered && (
          <div
            style={{ display: 'flex', gap: 20, alignItems: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onPrimaryControl}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                border: '0.5px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.85)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.16)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            >
              {isRunning ? '⏸' : '▶'}
            </button>

            <button
              onClick={onReset}
              disabled={!canReset}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                border: '0.5px solid rgba(255,255,255,0.15)',
                color: `rgba(255,255,255,${canReset ? '0.85' : '0.25'})`,
                cursor: canReset ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (canReset) e.currentTarget.style.background = 'rgba(255,255,255,0.16)' }}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            >
              ↺
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
