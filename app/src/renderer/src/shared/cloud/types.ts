import type { Locale } from '../types'

export type CloudConnectorId = string

export type CloudConnectorStatus =
  | 'available'
  | 'coming-soon'
  | 'needs-setup'
  | 'connected'

/**
 * One cloud / storage provider the user can plug in.
 *
 * To add a provider: copy `connectors/_template.ts`, fill the fields,
 * register it in `index.ts`. Keep each connector in its own file.
 */
export type CloudConnector = {
  id: CloudConnectorId
  label: Record<Locale, string>
  description: Record<Locale, string>
  meta?: Record<Locale, string>
  status: CloudConnectorStatus
  brand?:
    | 'local'
    | 'folder'
    | 'link'
    | 'onedrive'
    | 'google'
    | 'dropbox'
    | 'webdav'
    | 'other'
  /** OAuth / login — implement when you wire the real API. */
  connect?: () => Promise<void>
  disconnect?: () => Promise<void>
  /**
   * Optional: turn a cloud file into a local cached path or blob URL.
   * Leave undefined while status is `coming-soon`.
   */
  resolveMedia?: (input: {
    remoteId: string
    shareUrl?: string
  }) => Promise<{ localUrl: string }>
}
