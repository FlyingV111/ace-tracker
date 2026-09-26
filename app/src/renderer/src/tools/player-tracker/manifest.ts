import { Users } from 'lucide-react'
import type { ToolManifest } from '../types'

export const playerTrackerManifest: ToolManifest = {
  id: 'player-tracker',
  icon: Users,
  available: true,
  title: {
    de: 'Aufstellung',
    en: 'Lineup',
  },
  description: {
    de: 'Kader-Spieler für dieses Spiel referenzieren und Aufstellungen pflegen.',
    en: 'Reference squad players for this match and maintain lineups.',
  },
}
