import {
  app,
  BrowserWindow,
  ipcMain,
  nativeImage,
  nativeTheme,
  shell,
} from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { registerAppDataIpc } from './app-data'
import { registerWebDavIpc } from './webdav'

const isDev = !app.isPackaged

type ThemePreference = 'light' | 'dark' | 'system'

let mainWindow: BrowserWindow | null = null
let splashWindow: BrowserWindow | null = null
let themePreference: ThemePreference = 'system'
let splashClosed = false
let lastSplashStatus = 'App wird gestartet…'

// Windows: Chromium occlusion / compositor can leave a blank (white) client
// area after minimize → restore. Disable the feature and force a repaint.
if (process.platform === 'win32') {
  app.commandLine.appendSwitch(
    'disable-features',
    'CalculateNativeWinOcclusion',
  )
}

function getWindowBackgroundColor(): string {
  return nativeTheme.shouldUseDarkColors ? '#141414' : '#f7f7f8'
}

function forceWindowRepaint(win: BrowserWindow): void {
  if (win.isDestroyed() || !win.isVisible()) return
  win.setBackgroundColor(getWindowBackgroundColor())
  win.webContents.invalidate()
  // Avoid setBounds while maximized - that would unmaximize the window.
  if (win.isMaximized() || win.isFullScreen()) {
    const opacity = win.getOpacity()
    win.setOpacity(Math.min(opacity, 0.99))
    win.setOpacity(1)
    return
  }
  const bounds = win.getBounds()
  win.setBounds({ ...bounds, width: bounds.width + 1 })
  win.setBounds(bounds)
}

function resolveResource(...parts: string[]): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, ...parts)
  }
  return join(__dirname, '../../resources', ...parts)
}

function shouldUseDarkIcon(): boolean {
  if (themePreference === 'dark') return true
  if (themePreference === 'light') return false
  return nativeTheme.shouldUseDarkColors
}

function resolveWindowIconPath(): string {
  const darkChrome = shouldUseDarkIcon()
  const candidates =
    process.platform === 'win32'
      ? [
          darkChrome ? 'icon-light.ico' : 'icon-dark.ico',
          darkChrome ? 'icon-light.png' : 'icon-dark.png',
          'icon.ico',
          'icon.png',
        ]
      : [
          darkChrome ? 'icon-light.png' : 'icon-dark.png',
          darkChrome ? 'icon-light.ico' : 'icon-dark.ico',
          'icon.png',
        ]

  for (const name of candidates) {
    const path = resolveResource(name)
    if (existsSync(path)) return path
  }

  return resolveResource('icon-light.png')
}

function resolveSplashIconPath(): string {
  const darkChrome = shouldUseDarkIcon()
  const png = resolveResource(
    darkChrome ? 'icon-light.png' : 'icon-dark.png',
  )
  if (existsSync(png)) return png
  return resolveWindowIconPath()
}

function windowIconOption(): { icon: string } | { icon: Electron.NativeImage } | object {
  const iconPath = resolveWindowIconPath()
  if (!existsSync(iconPath)) return {}
  if (process.platform === 'win32') {
    return { icon: iconPath }
  }
  const image = nativeImage.createFromPath(iconPath)
  if (image.isEmpty()) return {}
  return { icon: image }
}

function applyWindowIcon(win: BrowserWindow = mainWindow!): void {
  if (!win || win.isDestroyed()) return
  const iconPath = resolveWindowIconPath()
  if (!existsSync(iconPath)) return
  if (process.platform === 'win32') {
    win.setIcon(iconPath)
    return
  }
  const image = nativeImage.createFromPath(iconPath)
  if (!image.isEmpty()) win.setIcon(image)
}

function updateSplashStatus(status: string): void {
  lastSplashStatus = status
  if (!splashWindow || splashWindow.isDestroyed()) return
  const icon = pathToFileURL(resolveSplashIconPath()).href
  const payload = JSON.stringify({ icon, status })
  void splashWindow.webContents.executeJavaScript(
    `window.setSplash && window.setSplash(${payload})`,
  )
}

function closeSplash(): void {
  if (splashClosed) return
  splashClosed = true
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close()
  }
  splashWindow = null
}

function createSplashWindow(): void {
  splashWindow = new BrowserWindow({
    width: 560,
    height: 420,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    frame: false,
    show: false,
    center: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#141414' : '#f7f7f8',
    ...windowIconOption(),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  void splashWindow.loadFile(resolveResource('splash.html')).then(() => {
    updateSplashStatus(lastSplashStatus)
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.show()
    }
  })
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: getWindowBackgroundColor(),
    ...windowIconOption(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  applyWindowIcon(mainWindow)

  mainWindow.on('ready-to-show', () => {
    applyWindowIcon(mainWindow!)
    updateSplashStatus('Oberfläche wird vorbereitet…')
  })

  if (process.platform === 'win32') {
    mainWindow.on('restore', () => {
      if (!mainWindow || mainWindow.isDestroyed()) return
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          forceWindowRepaint(mainWindow)
        }
      }, 16)
    })
  }

  mainWindow.webContents.on('did-start-loading', () => {
    updateSplashStatus('Oberfläche wird geladen…')
  })

  mainWindow.webContents.on('did-finish-load', () => {
    updateSplashStatus('Daten werden geladen…')
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    updateSplashStatus('Entwicklungsserver wird verbunden…')
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    updateSplashStatus('App-Dateien werden geladen…')
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function showMainWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  applyWindowIcon(mainWindow)
  mainWindow.maximize()
  mainWindow.show()
  mainWindow.focus()
  closeSplash()
}

function setThemePreference(mode: ThemePreference): void {
  themePreference = mode
  nativeTheme.themeSource = mode
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setBackgroundColor(getWindowBackgroundColor())
    applyWindowIcon(mainWindow)
  }
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.setBackgroundColor(getWindowBackgroundColor())
    updateSplashStatus(lastSplashStatus)
  }
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.acetracker.app')
  }

  registerAppDataIpc()
  registerWebDavIpc()

  ipcMain.on('theme:set', (_event, mode: ThemePreference) => {
    if (mode === 'light' || mode === 'dark' || mode === 'system') {
      setThemePreference(mode)
    }
  })

  ipcMain.on('splash:status', (_event, status: unknown) => {
    if (typeof status === 'string' && status.trim()) {
      updateSplashStatus(status.trim())
    }
  })

  ipcMain.on('app:ready', () => {
    updateSplashStatus('Fertig')
    showMainWindow()
  })

  ipcMain.handle('shell:openPath', async (_event, targetPath: unknown) => {
    if (typeof targetPath !== 'string' || !targetPath.trim()) {
      return { ok: false as const, error: 'Ungültiger Pfad.' }
    }
    const error = await shell.openPath(targetPath.trim())
    return error
      ? { ok: false as const, error }
      : { ok: true as const }
  })

  nativeTheme.on('updated', () => {
    if (
      themePreference === 'system' &&
      mainWindow &&
      !mainWindow.isDestroyed()
    ) {
      applyWindowIcon(mainWindow)
    }
  })

  createSplashWindow()
  createMainWindow()

  setTimeout(() => {
    if (!splashClosed) showMainWindow()
  }, 12_000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      splashClosed = false
      lastSplashStatus = 'App wird gestartet…'
      createSplashWindow()
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
