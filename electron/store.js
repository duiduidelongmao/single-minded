/**
 * 极简持久化存储（替代 electron-store，无需额外依赖）
 */
const fs = require('fs')
const path = require('path')
const { app } = require('electron')

class Store {
  constructor() {
    this.dataPath = path.join(app.getPath('userData'), 'focustime-settings.json')
    this.data = {}
    this.load()
  }

  load() {
    try {
      if (fs.existsSync(this.dataPath)) {
        this.data = JSON.parse(fs.readFileSync(this.dataPath, 'utf-8'))
      }
    } catch {
      this.data = {}
    }
  }

  save() {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2), 'utf-8')
    } catch (e) {
      console.error('Store save error:', e)
    }
  }

  get(key, defaultValue) {
    return this.data[key] !== undefined ? this.data[key] : defaultValue
  }

  set(key, value) {
    this.data[key] = value
    this.save()
  }
}

module.exports = Store
