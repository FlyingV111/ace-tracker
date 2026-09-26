import type { Locale } from '../core/types'

export type CloudConnectorId = string

export type CloudConnectorStatus =
  | 'available'
  | 'coming-soon'
  | 'needs-setup'
  | 'connected'

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
  connect?: () => Promise<void>
  disconnect?: () => Promise<void>
  resolveMedia?: (input: {
    remoteId: string
    shareUrl?: string
  }) => Promise<{ localUrl: string }>
}
