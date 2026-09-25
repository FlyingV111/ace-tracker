/// <reference types="vite/client" />

type AppDataKey = 'settings' | 'workspaces' | 'projects'

type WebDavAuthPayload = {
  baseUrl?: string
  path: string
  username: string
  password: string
}

type WebDavEntry = {
  path: string
  name: string
  isDir: boolean
  sizeBytes: number | null
}

type WebDavProbeResult = { ok: true } | { ok: false; error: string }
type WebDavListResult =
  | { ok: true; entries: WebDavEntry[] }
  | { ok: false; error: string }
type WebDavDownloadResult =
  | { ok: true; localPath: string; sizeBytes: number }
  | { ok: false; error: string }

interface ElectronAPI {
  platform: string
  isElectron: boolean
  setThemePreference?: (mode: 'light' | 'dark' | 'system') => void
  setSplashStatus?: (status: string) => void
  notifyAppReady?: () => void
  getAppDataRoot?: () => Promise<string>
  readAppData?: (key: AppDataKey) => Promise<unknown | null>
  writeAppData?: (key: AppDataKey, value: unknown) => Promise<boolean>
  removeAppData?: (key: AppDataKey) => Promise<boolean>
  clearAllAppData?: () => Promise<boolean>
  webdavProbe?: (payload: WebDavAuthPayload) => Promise<WebDavProbeResult>
  webdavList?: (payload: WebDavAuthPayload) => Promise<WebDavListResult>
  webdavDownload?: (
    payload: WebDavAuthPayload & { fileName: string },
  ) => Promise<WebDavDownloadResult>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
