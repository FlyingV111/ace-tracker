export const HIDRIVE_WEBDAV_URL = 'https://webdav.hidrive.strato.com'
export const HIDRIVE_CONNECTOR_ID = 'hidrive'

export type HiDriveConfig = {
  username: string
  password: string
  rootPath: string
  shareUrl: string
  connected: boolean
}

export const DEFAULT_HIDRIVE_CONFIG: HiDriveConfig = {
  username: '',
  password: '',
  rootPath: '',
  shareUrl: '',
  connected: false,
}

export function normalizeHiDriveShareUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  const shareMatch = trimmed.match(
    /(?:https?:\/\/)?(?:my\.)?hidrive\.com\/share\/([a-zA-Z0-9]+)/i,
  )
  if (shareMatch) {
    return `https://my.hidrive.com/share/${shareMatch[1]}`
  }
  if (/^[a-zA-Z0-9]+$/.test(trimmed)) {
    return `https://my.hidrive.com/share/${trimmed}`
  }
  return trimmed
}

export function pathFromHiDriveBrowserUrl(input: string): string | null {
  const trimmed = input.trim()
  const hashMatch = trimmed.match(/#\$?(\/users\/[^?#]+)/i)
  if (hashMatch) {
    return decodeURIComponent(hashMatch[1]!).replace(/\/+$/, '')
  }
  if (trimmed.startsWith('/users/')) {
    return trimmed.replace(/\/+$/, '')
  }
  return null
}

export function defaultRootPathForUser(username: string): string {
  const name = username.trim()
  if (!name) return ''
  return `/users/${name}`
}

export function parseHiDriveConfig(raw: unknown): HiDriveConfig {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_HIDRIVE_CONFIG }
  const value = raw as Partial<HiDriveConfig>
  return {
    username: typeof value.username === 'string' ? value.username : '',
    password: typeof value.password === 'string' ? value.password : '',
    rootPath: typeof value.rootPath === 'string' ? value.rootPath : '',
    shareUrl:
      typeof value.shareUrl === 'string'
        ? normalizeHiDriveShareUrl(value.shareUrl)
        : '',
    connected: Boolean(value.connected),
  }
}
