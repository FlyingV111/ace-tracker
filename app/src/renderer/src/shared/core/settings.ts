import type { Locale } from './types'
import type { CloudConnectorId } from '../cloud'
import {
  DEFAULT_HIDRIVE_CONFIG,
  parseHiDriveConfig,
  type HiDriveConfig,
} from '../cloud/hidrive-config'
import {
  isProjectDateFormat,
  type ProjectDateFormat,
} from '../project/title'
import { isThemeMode, type ThemeMode } from './theme'
import {
  readPersistedJson,
  removePersistedJson,
  writePersistedJson,
} from './persistence'

export type { ThemeMode } from './theme'
export type ResolvedTheme = import('./theme').ResolvedTheme
export type { HiDriveConfig } from '../cloud/hidrive-config'

export type ProjectsViewMode = 'tiles' | 'list'
export type SquadViewMode = 'cards' | 'table'
export type HomeTab = 'squad' | 'games'

export function isProjectsViewMode(value: unknown): value is ProjectsViewMode {
  return value === 'tiles' || value === 'list'
}

export function isSquadViewMode(value: unknown): value is SquadViewMode {
  return value === 'cards' || value === 'table'
}

export function isHomeTab(value: unknown): value is HomeTab {
  return value === 'squad' || value === 'games'
}

export type UserSettings = {
  setupComplete: boolean
  setupStep: number
  locale: Locale
  theme: ThemeMode
  projectsViewMode: ProjectsViewMode
  squadViewMode: SquadViewMode
  homeTab: HomeTab
  displayName: string
  avatarDataUrl: string | null
  isPlayer: boolean
  projectsFolderLabel: string | null
  cloudConnectorId: CloudConnectorId | null
  /** HiDrive login - stays on this device only. */
  hidrive: HiDriveConfig
  lastWorkspaceId: string | null
  pendingWorkspaceName: string
  pendingHomeTeam: string
  pendingAwayTeam: string
  pendingProjectName: string
  projectTitleIncludeDate: boolean
  projectTitleDateFormat: ProjectDateFormat
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  setupComplete: false,
  setupStep: 0,
  locale: 'de',
  theme: 'system',
  projectsViewMode: 'tiles',
  squadViewMode: 'cards',
  homeTab: 'squad',
  displayName: '',
  avatarDataUrl: null,
  isPlayer: false,
  projectsFolderLabel: null,
  cloudConnectorId: null,
  hidrive: { ...DEFAULT_HIDRIVE_CONFIG },
  lastWorkspaceId: null,
  pendingWorkspaceName: '',
  pendingHomeTeam: '',
  pendingAwayTeam: '',
  pendingProjectName: '',
  projectTitleIncludeDate: false,
  projectTitleDateFormat: 'dd.MM.yyyy',
}

const MAX_AVATAR_CHARS = 180_000

let cachedSettings: UserSettings = { ...DEFAULT_USER_SETTINGS }

export function parseUserSettings(raw: unknown): UserSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_USER_SETTINGS }
  const parsed = raw as Partial<UserSettings>
  const setupStep =
    typeof parsed.setupStep === 'number' &&
    parsed.setupStep >= 0 &&
    parsed.setupStep <= 4
      ? Math.floor(parsed.setupStep)
      : 0
  const avatarDataUrl =
    typeof parsed.avatarDataUrl === 'string' &&
    parsed.avatarDataUrl.startsWith('data:image/') &&
    parsed.avatarDataUrl.length <= MAX_AVATAR_CHARS
      ? parsed.avatarDataUrl
      : null
  return {
    ...DEFAULT_USER_SETTINGS,
    ...parsed,
    setupComplete: Boolean(parsed.setupComplete),
    setupStep,
    theme: isThemeMode(parsed.theme)
      ? parsed.theme
      : DEFAULT_USER_SETTINGS.theme,
    projectsViewMode: isProjectsViewMode(parsed.projectsViewMode)
      ? parsed.projectsViewMode
      : DEFAULT_USER_SETTINGS.projectsViewMode,
    squadViewMode: isSquadViewMode(parsed.squadViewMode)
      ? parsed.squadViewMode
      : DEFAULT_USER_SETTINGS.squadViewMode,
    homeTab: isHomeTab(parsed.homeTab)
      ? parsed.homeTab
      : DEFAULT_USER_SETTINGS.homeTab,
    displayName:
      typeof parsed.displayName === 'string' ? parsed.displayName : '',
    avatarDataUrl,
    isPlayer: Boolean(parsed.isPlayer),
    projectsFolderLabel:
      typeof parsed.projectsFolderLabel === 'string'
        ? parsed.projectsFolderLabel
        : null,
    cloudConnectorId: parsed.cloudConnectorId ?? null,
    hidrive: parseHiDriveConfig(
      (parsed as Partial<UserSettings>).hidrive,
    ),
    lastWorkspaceId:
      typeof parsed.lastWorkspaceId === 'string'
        ? parsed.lastWorkspaceId
        : null,
    pendingWorkspaceName:
      typeof parsed.pendingWorkspaceName === 'string'
        ? parsed.pendingWorkspaceName
        : '',
    pendingHomeTeam:
      typeof parsed.pendingHomeTeam === 'string' ? parsed.pendingHomeTeam : '',
    pendingAwayTeam:
      typeof parsed.pendingAwayTeam === 'string' ? parsed.pendingAwayTeam : '',
    pendingProjectName:
      typeof parsed.pendingProjectName === 'string'
        ? parsed.pendingProjectName
        : '',
    projectTitleIncludeDate: Boolean(parsed.projectTitleIncludeDate),
    projectTitleDateFormat: isProjectDateFormat(parsed.projectTitleDateFormat)
      ? parsed.projectTitleDateFormat
      : DEFAULT_USER_SETTINGS.projectTitleDateFormat,
  }
}

export function loadUserSettings(): UserSettings {
  return { ...cachedSettings }
}

export function hydrateUserSettings(raw: unknown): UserSettings {
  cachedSettings = parseUserSettings(raw)
  return loadUserSettings()
}

export function saveUserSettings(settings: UserSettings): void {
  cachedSettings = { ...settings }
  void writePersistedJson('settings', settings)
}

export function clearUserSettingsStorage(): void {
  cachedSettings = { ...DEFAULT_USER_SETTINGS }
  void removePersistedJson('settings')
}

export async function loadUserSettingsAsync(): Promise<UserSettings> {
  const raw = await readPersistedJson('settings')
  return hydrateUserSettings(raw)
}

export async function fileToAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  const scale = Math.max(size / bitmap.width, size / bitmap.height)
  const w = bitmap.width * scale
  const h = bitmap.height * scale
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h)
  bitmap.close()

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
  if (dataUrl.length > MAX_AVATAR_CHARS) {
    throw new Error('Avatar too large')
  }
  return dataUrl
}
