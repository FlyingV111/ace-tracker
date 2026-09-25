import type { CloudConnector } from '../types'

/**
 * Generic WebDAV — works for Strato, Nextcloud, many hosters.
 * Config (URL + user + password) comes later in settings; for now the
 * connector is listed so you can finish it without inventing a new shape.
 */
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
  // Later:
  // connect: async () => { read config, test PROPFIND },
  // resolveMedia: async ({ remoteId }) => { GET file → cache path },
}
