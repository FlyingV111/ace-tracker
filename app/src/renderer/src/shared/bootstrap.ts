import { loadUserSettingsAsync } from './settings'
import { loadWorkspacesAsync } from './workspaces'
import { loadProjectsAsync } from './aceproj/storage'
import { migrateLocalStorageToAppDataIfNeeded } from './persistence'

export async function bootstrapAppPersistence(): Promise<void> {
  window.electronAPI?.setSplashStatus?.('Einstellungen werden geladen…')
  await migrateLocalStorageToAppDataIfNeeded()

  window.electronAPI?.setSplashStatus?.('Workspaces werden geladen…')
  await loadWorkspacesAsync()

  window.electronAPI?.setSplashStatus?.('Projekte werden geladen…')
  await loadProjectsAsync()

  window.electronAPI?.setSplashStatus?.('Profil wird geladen…')
  await loadUserSettingsAsync()
}
