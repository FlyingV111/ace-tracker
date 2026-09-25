import { Clapperboard } from 'lucide-react'
import type { ToolManifest } from '../types'

export const videoAnalysisManifest: ToolManifest = {
  id: 'video-analysis',
  icon: Clapperboard,
  available: true,
  title: {
    de: 'Video Analysis',
    en: 'Video Analysis',
  },
  description: {
    de: 'Clips markieren, reviewen und mit dem Match verknüpfen.',
    en: 'Mark clips, review, and link them to the match.',
  },
}
