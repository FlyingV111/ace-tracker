import type { CloudConnector } from '../types'

export const dropboxConnector: CloudConnector = {
  id: 'dropbox',
  brand: 'dropbox',
  status: 'coming-soon',
  label: {
    de: 'Dropbox',
    en: 'Dropbox',
  },
  description: {
    de: 'Videos aus Dropbox anbinden. Bis dahin: Share-Link nutzen.',
    en: 'Attach videos from Dropbox. Until then: use a share link.',
  },
  meta: {
    de: 'Dropbox',
    en: 'Dropbox',
  },
}
