import type { CloudConnector } from '../types'
import {
  HIDRIVE_CONNECTOR_ID,
  type HiDriveConfig,
} from '../hidrive-config'

/**
 * Status is computed when listing providers — see getHiDriveConnector().
 * This constant is the base definition.
 */
export const hidriveConnectorBase: CloudConnector = {
  id: HIDRIVE_CONNECTOR_ID,
  brand: 'webdav',
  status: 'needs-setup',
  label: {
    de: 'HiDrive (Strato)',
    en: 'HiDrive (Strato)',
  },
  description: {
    de: 'STRATO HiDrive per WebDAV. Ordner browsen und Videos ans Projekt hängen. Share-Link optional für Helfer.',
    en: 'STRATO HiDrive via WebDAV. Browse folders and attach videos. Optional share link for helpers.',
  },
  meta: {
    de: 'Deutschland',
    en: 'Germany',
  },
}

export function hidriveConnectorFor(config: HiDriveConfig): CloudConnector {
  return {
    ...hidriveConnectorBase,
    status: config.connected ? 'connected' : 'needs-setup',
    description: {
      de: config.connected
        ? `Verbunden als ${config.username}${config.shareUrl ? ` · Share hinterlegt` : ''}.`
        : hidriveConnectorBase.description.de,
      en: config.connected
        ? `Connected as ${config.username}${config.shareUrl ? ` · share saved` : ''}.`
        : hidriveConnectorBase.description.en,
    },
  }
}
