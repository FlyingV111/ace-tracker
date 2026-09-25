import type { CloudConnector } from '../types'

export const oneDriveConnector: CloudConnector = {
  id: 'onedrive',
  brand: 'onedrive',
  status: 'coming-soon',
  label: {
    de: 'OneDrive',
    en: 'OneDrive',
  },
  description: {
    de: 'Videos aus deinem Microsoft-Konto anbinden. Bis dahin: Share-Link nutzen.',
    en: 'Attach videos from your Microsoft account. Until then: use a share link.',
  },
  meta: {
    de: 'Microsoft',
    en: 'Microsoft',
  },
}
