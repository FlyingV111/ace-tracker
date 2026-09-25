/**
 * Copy this file to e.g. `my-provider.ts`, rename the export,
 * then register it in `../index.ts`.
 *
 * Keep it boring: labels + status first. Add `connect` / `resolveMedia`
 * only when you actually implement the API.
 */
import type { CloudConnector } from '../types'

export const templateConnector: CloudConnector = {
  id: 'my-provider',
  brand: 'other',
  status: 'coming-soon',
  label: {
    de: 'Mein Anbieter',
    en: 'My provider',
  },
  description: {
    de: 'Kurz erklären, wofür der Anbieter da ist.',
    en: 'Short note what this provider is for.',
  },
  // connect: async () => { ... },
  // resolveMedia: async ({ remoteId, shareUrl }) => { return { localUrl: '...' } },
}
