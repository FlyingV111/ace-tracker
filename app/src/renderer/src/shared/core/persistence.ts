export type AppDataKey = 'settings' | 'workspaces' | 'projects'

const LOCAL_KEYS: Record<AppDataKey, string> = {
  settings: 'ace-tracker.settings.v1',
  workspaces: 'ace-tracker.workspaces.v1',
  projects: 'ace-tracker.aceprojects.v1',
}

function isElectronStore(): boolean {
  return Boolean(window.electronAPI?.isElectron && window.electronAPI.readAppData)
}

export async function readPersistedJson(
  key: AppDataKey,
): Promise<unknown | null> {
  if (isElectronStore()) {
    return window.electronAPI!.readAppData!(key)
  }
  try {
    const raw = localStorage.getItem(LOCAL_KEYS[key])
    if (!raw) return null
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

export async function writePersistedJson(
  key: AppDataKey,
  value: unknown,
): Promise<void> {
  if (isElectronStore()) {
    await window.electronAPI!.writeAppData!(key, value)
    return
  }
  localStorage.setItem(LOCAL_KEYS[key], JSON.stringify(value))
}

export async function removePersistedJson(key: AppDataKey): Promise<void> {
  if (isElectronStore()) {
    await window.electronAPI!.removeAppData!(key)
    return
  }
  localStorage.removeItem(LOCAL_KEYS[key])
}

export async function clearAllPersistedData(): Promise<void> {
  if (isElectronStore()) {
    await window.electronAPI!.clearAllAppData!()
    // Also clear any leftover browser storage from older builds
    for (const localKey of Object.values(LOCAL_KEYS)) {
      localStorage.removeItem(localKey)
    }
    return
  }
  for (const localKey of Object.values(LOCAL_KEYS)) {
    localStorage.removeItem(localKey)
  }
}

/** One-time migrate localStorage → AppData when Electron files are empty. */
export async function migrateLocalStorageToAppDataIfNeeded(): Promise<void> {
  if (!isElectronStore()) return

  for (const key of Object.keys(LOCAL_KEYS) as AppDataKey[]) {
    const existing = await window.electronAPI!.readAppData!(key)
    if (existing != null) continue
    const raw = localStorage.getItem(LOCAL_KEYS[key])
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as unknown
      await window.electronAPI!.writeAppData!(key, parsed)
      localStorage.removeItem(LOCAL_KEYS[key])
    } catch {
      // keep localStorage entry if migrate failed
    }
  }
}
