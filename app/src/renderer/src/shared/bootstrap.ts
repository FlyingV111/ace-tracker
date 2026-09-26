import { loadUserSettingsAsync } from './core/settings'
import { loadWorkspacesAsync } from './workspace/store'
import { loadProjectsAsync } from './fileformat/storage'
import { migrateLocalStorageToAppDataIfNeeded } from './core/persistence'

export async function bootstrapAppPersistence(): Promise<void> {
  window.electronAPI?.setSplashStatus?.('Einstellungen werden geladen…')
  await migrateLocalStorageToAppDataIfNeeded()

  window.electronAPI?.setSplashStatus?.('Workspaces werden geladen…')
  await loadWorkspacesAsync()

  window.electronAPI?.setSplashStatus?.('Spiele werden geladen…')
  await loadProjectsAsync()

  window.electronAPI?.setSplashStatus?.('Profil wird geladen…')
  await loadUserSettingsAsync()
}
