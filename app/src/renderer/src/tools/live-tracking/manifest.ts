import { Radio } from 'lucide-react'
import type { ToolManifest } from '../types'

export const liveTrackingManifest: ToolManifest = {
  id: 'live-tracking',
  icon: Radio,
  available: false,
  title: {
    de: 'Live Game Tracking',
    en: 'Live Game Tracking',
  },
  description: {
    de: 'Events und Statistiken während des Spiels erfassen.',
    en: 'Capture events and stats during the match.',
  },
}
