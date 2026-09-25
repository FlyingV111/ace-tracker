import type { CloudConnector } from '../types'

export const googleDriveConnector: CloudConnector = {
  id: 'google-drive',
  brand: 'google',
  status: 'coming-soon',
  label: {
    de: 'Google Drive',
    en: 'Google Drive',
  },
  description: {
    de: 'Videos aus deinem Google-Konto anbinden (OAuth). Bis dahin: Share-Link über „Link / Share-URL“.',
    en: 'Attach videos from your Google account (OAuth). Until then: use “Link / share URL”.',
  },
  meta: {
    de: 'Google',
    en: 'Google',
  },
  // Later: connect() → OAuth, resolveMedia() → Drive API download
}
