import { app, ipcMain } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'

export type AppDataKey = 'settings' | 'workspaces' | 'projects'

const FILE_MAP: Record<AppDataKey, string[]> = {
  settings: ['config', 'settings.json'],
  workspaces: ['config', 'workspaces.json'],
  projects: ['data', 'projects.json'],
}

function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true })
  }
}

function filePath(key: AppDataKey): string {
  const parts = FILE_MAP[key]
  const dir = join(app.getPath('userData'), ...parts.slice(0, -1))
  ensureDir(dir)
  return join(app.getPath('userData'), ...parts)
}

export function readAppDataJson(key: AppDataKey): unknown | null {
  const path = filePath(key)
  if (!existsSync(path)) return null
  try {
    const raw = readFileSync(path, 'utf8')
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

export function writeAppDataJson(key: AppDataKey, value: unknown): void {
  const path = filePath(key)
  writeFileSync(path, JSON.stringify(value, null, 2), 'utf8')
}

export function removeAppDataJson(key: AppDataKey): void {
  const path = filePath(key)
  if (existsSync(path)) {
    unlinkSync(path)
  }
}

export function clearAllAppData(): void {
  for (const key of Object.keys(FILE_MAP) as AppDataKey[]) {
    removeAppDataJson(key)
  }
}

export function getAppDataRoot(): string {
  return app.getPath('userData')
}

export function registerAppDataIpc(): void {
  ipcMain.handle('appData:getRoot', () => getAppDataRoot())

  ipcMain.handle('appData:read', (_event, key: AppDataKey) => {
    if (!(key in FILE_MAP)) return null
    return readAppDataJson(key)
  })

  ipcMain.handle('appData:write', (_event, key: AppDataKey, value: unknown) => {
    if (!(key in FILE_MAP)) return false
    writeAppDataJson(key, value)
    return true
  })

  ipcMain.handle('appData:remove', (_event, key: AppDataKey) => {
    if (!(key in FILE_MAP)) return false
    removeAppDataJson(key)
    return true
  })

  ipcMain.handle('appData:clearAll', () => {
    clearAllAppData()
    return true
  })
}
