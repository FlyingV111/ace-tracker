import type { CloudConnector } from '../types'

export const webdavConnector: CloudConnector = {
  id: 'webdav',
  brand: 'webdav',
  status: 'coming-soon',
  label: {
    de: 'WebDAV (Strato & Co.)',
    en: 'WebDAV (Strato & others)',
  },
  description: {
    de: 'Eigener Speicher per WebDAV-URL. Du trägst Host, Benutzer und Passwort selbst ein.',
    en: 'Your own storage via WebDAV URL. You enter host, user and password yourself.',
  },
  meta: {
    de: 'Selbst hosten',
    en: 'Self-hosted',
  },
}
