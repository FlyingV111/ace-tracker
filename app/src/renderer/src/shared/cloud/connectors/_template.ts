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
}
