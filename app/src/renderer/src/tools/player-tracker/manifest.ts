import { Users } from 'lucide-react'
import type { ToolManifest } from '../types'

export const playerTrackerManifest: ToolManifest = {
  id: 'player-tracker',
  icon: Users,
  available: false,
  title: {
    de: 'Kader-Management',
    en: 'Squad Management',
  },
  description: {
    de: 'Kader verwalten, Spieler tracken und Aufstellungen pflegen.',
    en: 'Manage the squad, track players and maintain lineups.',
  },
}
