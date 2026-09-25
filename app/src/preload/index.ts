import { contextBridge, ipcRenderer } from 'electron'

export type ThemePreference = 'light' | 'dark' | 'system'
export type AppDataKey = 'settings' | 'workspaces' | 'projects'

export type WebDavAuthPayload = {
  baseUrl?: string
  path: string
  username: string
  password: string
}

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  setThemePreference: (mode: ThemePreference) => {
    ipcRenderer.send('theme:set', mode)
  },
  setSplashStatus: (status: string) => {
    ipcRenderer.send('splash:status', status)
  },
  notifyAppReady: () => {
    ipcRenderer.send('app:ready')
  },
  getAppDataRoot: (): Promise<string> =>
    ipcRenderer.invoke('appData:getRoot') as Promise<string>,
  readAppData: (key: AppDataKey): Promise<unknown | null> =>
    ipcRenderer.invoke('appData:read', key) as Promise<unknown | null>,
  writeAppData: (key: AppDataKey, value: unknown): Promise<boolean> =>
    ipcRenderer.invoke('appData:write', key, value) as Promise<boolean>,
  removeAppData: (key: AppDataKey): Promise<boolean> =>
    ipcRenderer.invoke('appData:remove', key) as Promise<boolean>,
  clearAllAppData: (): Promise<boolean> =>
    ipcRenderer.invoke('appData:clearAll') as Promise<boolean>,
  webdavProbe: (payload: WebDavAuthPayload) =>
    ipcRenderer.invoke('webdav:probe', payload),
  webdavList: (payload: WebDavAuthPayload) =>
    ipcRenderer.invoke('webdav:list', payload),
  webdavDownload: (payload: WebDavAuthPayload & { fileName: string }) =>
    ipcRenderer.invoke('webdav:download', payload),
})
