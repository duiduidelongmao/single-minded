/**
 * 生成简单的托盘图标 PNG（16x16 白色圆点）
 * 运行: node scripts/gen-icon.js
 */
const fs = require('fs')
const path = require('path')

// 最简 PNG（16x16 白色圆圈）- base64 编码的实际 PNG 文件
// 这是一个手工生成的最小 PNG，代表一个简单的时钟/圆圈图标
const iconBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBI' +
  'WXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AUWCisO3fHRwQAAAIRJREFUOMtjYBgFgx8wMjD8Z2Bg' +
  'YPiPjSHjP5KEAiMDA8N/bAyJjP9JMCQe/38SDB0Y/pNgSMb/fxIMnRj+k2DIxf9/EgydGP6TYMjF' +
  '/38SDB0Y/pNgyMb/fxIMXRj+k2DIxf9/EgwdGP6TYMjG/38SDB0Y/pNgyMX/fxIMnRj+k2DIAQB0' +
  'IyX5Cp3OQQAAAABJRU5ErkJggg=='

const outDir = path.join(__dirname, '..', 'electron')
const outPath = path.join(outDir, 'tray-icon.png')

const buffer = Buffer.from(iconBase64, 'base64')
fs.writeFileSync(outPath, buffer)
console.log('托盘图标已生成:', outPath)
