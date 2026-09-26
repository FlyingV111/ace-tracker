import type { CloudConnector } from '../types'

export const linkConnector: CloudConnector = {
  id: 'link',
  brand: 'link',
  status: 'available',
  label: {
    de: 'Link / Share-URL',
    en: 'Link / share URL',
  },
  description: {
    de: 'Video-Link aus Google Drive, Strato, Dropbox, … einfügen. Die Datei bleibt bei dir.',
    en: 'Paste a video link from Google Drive, Strato, Dropbox, …. The file stays with you.',
  },
  meta: {
    de: 'Ohne Login',
    en: 'No login',
  },
}
