import React from 'react'
import { ACCENT_COLORS, formattedTime } from './types'
import type { TimerData, AccentColor } from './types'

const PRESET_MINUTES = [1, 15, 25, 45, 60, 75, 90]

interface Props {
  timer: TimerData
  onClose: () => void
  onPrimaryControl: () => void
}

export function SettingsPanelView({ timer, onClose, onPrimaryControl }: Props) {
  const accent = ACCENT_COLORS[timer.accentColor]
  const isRunning = timer.state === 'running'
  const canReset =
    timer.state === 'running' ||
    timer.state === 'paused' ||
    timer.state === 'completed' ||
    timer.durationMinutes !== 25 ||
    timer.remainingSeconds !== timer.durationMinutes * 60

  const setDuration = (minutes: number) => window.electronAPI.setDuration(minutes)
  const setAccent = (color: AccentColor) => window.electronAPI.updateSettings({ accentColor: color })
  const setDisplayMode = (mode: TimerData['displayMode']) => window.electronAPI.updateSettings({ displayMode: mode })
  const togglePin = () => window.electronAPI.updateSettings({ isPinned: !timer.isPinned })

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 16,
        overflow: 'hidden',
        background: 'rgba(22, 22, 28, 0.88)',
        backdropFilter: 'blur(40px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px 12px',
          borderBottom: '0.5px solid rgba(255,255,255,0.08)',
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: '#fff', fontFamily: 'system-ui' }}>专注时刻</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>Focus Time</div>
        </div>
        <button
          onClick={togglePin}
          style={{
            position: 'absolute',
            right: 16,
            background: 'none',
            border: 'none',
            color: timer.isPinned ? accent : 'rgba(255,255,255,0.45)',
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
            padding: 4,
          }}
          title={timer.isPinned ? '取消置顶' : '置顶窗口'}
        >
          {timer.isPinned ? '📌' : '📍'}
        </button>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            right: 48,
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.45)',
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
            padding: 4,
          }}
        >
          ✕
        </button>
      </div>

      {/* 内容区 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 24px' }}>

        {/* 倒计时预览 */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              fontSize: 80,
              fontWeight: 500,
              fontFamily: "'SF Pro Rounded', 'Segoe UI', system-ui, sans-serif",
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-2px',
              color: accent,
              textShadow: `0 0 40px ${accent}50`,
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            {formattedTime(timer.remainingSeconds)}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6, fontFamily: 'system-ui' }}>
            剩余时间
          </div>
        </div>

        {/* 时间设置 */}
        <Section label="时间设置">
          <TimeScaleControl
            value={timer.durationMinutes}
            onChange={setDuration}
            accent={accent}
          />
        </Section>

        {/* 数字颜色 */}
        <Section label="数字颜色" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', gap: 0, justifyContent: 'space-between', padding: '0 4px' }}>
            {(Object.entries(ACCENT_COLORS) as [AccentColor, string][]).map(([key, color]) => {
              const isSelected = timer.accentColor === key
              return (
                <button
                  key={key}
                  onClick={() => setAccent(key)}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: color,
                    border: isSelected ? `3px solid ${color}` : '2px solid transparent',
                    outline: isSelected ? `2px solid rgba(255,255,255,0.4)` : 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'transform 0.15s',
                    transform: isSelected ? 'scale(1.18)' : 'scale(1)',
                    boxShadow: `0 2px 8px ${color}60`,
                  }}
                />
              )
            })}
          </div>
        </Section>

        {/* 显示模式 */}
        <Section label="显示模式" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', gap: 6, padding: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 10 }}>
            {[
              { value: 'menuBarOnly', label: '仅托盘' },
              { value: 'desktopOnly', label: '仅桌面' },
              { value: 'both', label: '同时显示' },
            ].map(({ value, label }) => {
              const isActive = timer.displayMode === value
              return (
                <button
                  key={value}
                  onClick={() => setDisplayMode(value as TimerData['displayMode'])}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    background: isActive ? `rgba(${hexToRgb(accent)}, 0.18)` : 'transparent',
                    color: isActive ? accent : 'rgba(255,255,255,0.55)',
                    transition: 'all 0.15s',
                    fontFamily: 'system-ui',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </Section>

        {/* 主控按钮 */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 28, gap: 16 }}>
          <button
            onClick={() => { window.electronAPI.resetTimer() }}
            disabled={!canReset}
            style={{
              padding: '8px 18px',
              borderRadius: 20,
              border: '0.5px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.07)',
              color: `rgba(255,255,255,${canReset ? '0.75' : '0.25'})`,
              cursor: canReset ? 'pointer' : 'default',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'system-ui',
              transition: 'all 0.15s',
            }}
          >
            ↺ 重置
          </button>

          <button
            onClick={onPrimaryControl}
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              border: 'none',
              background: `rgba(${hexToRgb(accent)}, 0.16)`,
              color: accent,
              cursor: 'pointer',
              fontSize: 26,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 20px ${accent}40`,
              transition: 'all 0.15s',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `rgba(${hexToRgb(accent)}, 0.28)`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = `rgba(${hexToRgb(accent)}, 0.16)`)}
          >
            {isRunning ? '⏸' : '▶'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({
  label,
  children,
  style,
}: {
  label: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={style}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: 'rgba(255,255,255,0.45)',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          marginBottom: 10,
          fontFamily: 'system-ui',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

function TimeScaleControl({ value, onChange, accent }: { value: number; onChange: (v: number) => void; accent: string }) {
  const LABELS = [1, 15, 25, 45, 60, 75, 90]
  const toRatio = (v: number) => (Math.min(Math.max(v, 1), 90) - 1) / 89
  const fromRatio = (r: number) => Math.round(1 + r * 89)

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const padding = 35
    const availableWidth = rect.width - padding * 2
    const ratio = Math.min(Math.max((e.clientX - rect.left - padding) / availableWidth, 0), 1)
    onChange(fromRatio(ratio))

    const onMove = (ev: MouseEvent) => {
      const r = Math.min(Math.max((ev.clientX - rect.left - padding) / availableWidth, 0), 1)
      onChange(fromRatio(r))
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div
      style={{ position: 'relative', height: 64, userSelect: 'none' }}
      onMouseDown={handleDrag}
    >
      {/* 轨道 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 10,
          height: 44,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 22,
          border: '0.5px solid rgba(255,255,255,0.08)',
          cursor: 'pointer',
        }}
      />

      {/* 刻度标签 */}
      {LABELS.map((label) => {
        const x = `${toRatio(label) * 100}%`
        return (
          <div
            key={label}
            style={{
              position: 'absolute',
              left: x,
              top: 10,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              transform: 'translateX(-50%)',
              fontSize: 12,
              color: value === label ? 'transparent' : 'rgba(255,255,255,0.4)',
              fontFamily: 'system-ui',
              fontWeight: 500,
              cursor: 'pointer',
              pointerEvents: 'none',
            }}
          >
            {label}m
          </div>
        )
      })}

      {/* 选中滑块 */}
      <div
        style={{
          position: 'absolute',
          left: `${toRatio(value) * 100}%`,
          top: 10,
          height: 44,
          width: 64,
          transform: 'translateX(-50%)',
          background: `rgba(${hexToRgb(accent)}, 0.14)`,
          backdropFilter: 'blur(8px)',
          borderRadius: 22,
          border: `1px solid ${accent}50`,
          boxShadow: `0 4px 16px ${accent}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 600,
          color: accent,
          fontFamily: 'system-ui',
          pointerEvents: 'none',
          transition: 'left 0.08s ease',
        }}
      >
        {value}m
      </div>

      {/* 刻度线 */}
      <div style={{ position: 'absolute', left: 20, right: 20, top: 58, height: 12, display: 'flex', alignItems: 'flex-end', gap: 0 }}>
        {Array.from({ length: 43 }).map((_, i) => {
          const ratio = i / 42
          const minute = Math.round(1 + ratio * 89)
          const isNear = Math.abs(minute - value) <= 1
          const isMajor = i % 7 === 0
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 1,
                  height: isMajor ? 10 : 4,
                  background: isNear ? accent : `rgba(255,255,255,${isMajor ? 0.22 : 0.1})`,
                  borderRadius: 1,
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '255,255,255'
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
}
