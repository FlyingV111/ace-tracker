import type { EventCategory, EventQuality } from '@/shared'

export type EventGroup = 'skill' | 'marker' | 'phase' | 'meta'

export type CategoryDef = {
  id: EventCategory
  group: EventGroup
  color: string
  shortcut?: string
  needsDialog: boolean
  qualities?: EventQuality[]
  hasStrength?: boolean
  hasErrorType?: boolean
  instant?: boolean
}

export const ERROR_TYPES = [
  'netz',
  'aus',
  'doppelberuehrung',
  'uebertritt',
  'sonstig',
] as const

export type ErrorTypeId = (typeof ERROR_TYPES)[number]

export const EVENT_CATEGORIES: CategoryDef[] = [
  {
    id: 'angriff',
    group: 'skill',
    color: '#e11d48',
    shortcut: 'a',
    needsDialog: true,
    qualities: ['gut', 'mittel', 'schlecht', 'fehler', 'kill', 'punkt'],
    hasStrength: true,
    hasErrorType: true,
  },
  {
    id: 'block',
    group: 'skill',
    color: '#7c3aed',
    shortcut: 'b',
    needsDialog: true,
    qualities: ['gut', 'mittel', 'schlecht', 'fehler', 'kill', 'punkt'],
    hasErrorType: true,
  },
  {
    id: 'annahme',
    group: 'skill',
    color: '#2563eb',
    shortcut: 'n',
    needsDialog: true,
    qualities: ['gut', 'mittel', 'schlecht', 'fehler'],
    hasErrorType: true,
  },
  {
    id: 'rettung',
    group: 'skill',
    color: '#0891b2',
    shortcut: 'r',
    needsDialog: true,
    qualities: ['gut', 'mittel', 'schlecht', 'fehler'],
    hasErrorType: true,
  },
  {
    id: 'abwehr',
    group: 'skill',
    color: '#0d9488',
    shortcut: 'd',
    needsDialog: true,
    qualities: ['gut', 'mittel', 'schlecht', 'fehler'],
    hasErrorType: true,
  },
  {
    id: 'aufschlag',
    group: 'skill',
    color: '#ea580c',
    shortcut: 's',
    needsDialog: true,
    qualities: ['gut', 'mittel', 'schlecht', 'fehler', 'ass'],
    hasStrength: true,
    hasErrorType: true,
  },
  {
    id: 'zuspiel',
    group: 'skill',
    color: '#ca8a04',
    shortcut: 'z',
    needsDialog: true,
    qualities: ['gut', 'mittel', 'schlecht', 'fehler'],
    hasErrorType: true,
  },
  {
    id: 'freeball',
    group: 'marker',
    color: '#64748b',
    shortcut: 'f',
    needsDialog: true,
  },
  {
    id: 'touch',
    group: 'marker',
    color: '#78716c',
    shortcut: 't',
    needsDialog: true,
  },
  {
    id: 'netz',
    group: 'marker',
    color: '#a8a29e',
    shortcut: 'e',
    needsDialog: true,
  },
  {
    id: 'aus',
    group: 'marker',
    color: '#57534e',
    shortcut: 'x',
    needsDialog: true,
  },
  {
    id: 'fehler',
    group: 'marker',
    color: '#dc2626',
    shortcut: 'q',
    needsDialog: true,
    hasErrorType: true,
  },
  {
    id: 'wechsel',
    group: 'phase',
    color: '#4f46e5',
    shortcut: 'w',
    needsDialog: true,
  },
  {
    id: 'positionswechsel',
    group: 'phase',
    color: '#6366f1',
    shortcut: 'p',
    needsDialog: true,
  },
  {
    id: 'auszeit',
    group: 'phase',
    color: '#9333ea',
    shortcut: 'o',
    needsDialog: false,
    instant: true,
  },
  {
    id: 'satzbeginn',
    group: 'phase',
    color: '#16a34a',
    needsDialog: false,
    instant: true,
  },
  {
    id: 'satzende',
    group: 'phase',
    color: '#15803d',
    needsDialog: false,
    instant: true,
  },
  {
    id: 'highlight',
    group: 'meta',
    color: '#f59e0b',
    shortcut: 'h',
    needsDialog: false,
    instant: true,
  },
  {
    id: 'score_home',
    group: 'meta',
    color: '#16a34a',
    needsDialog: true,
  },
  {
    id: 'score_away',
    group: 'meta',
    color: '#dc2626',
    needsDialog: false,
    instant: true,
  },
]

const byId = new Map(EVENT_CATEGORIES.map((c) => [c.id, c]))

export function getCategoryDef(id: EventCategory): CategoryDef | undefined {
  return byId.get(id)
}

export function categoriesByGroup(group: EventGroup): CategoryDef[] {
  return EVENT_CATEGORIES.filter((c) => c.group === group)
}

export function categoryFromShortcut(key: string): CategoryDef | undefined {
  const lower = key.toLowerCase()
  return EVENT_CATEGORIES.find((c) => c.shortcut === lower)
}

export { analysisEventToStatType } from '@/shared/player/analysis-event-stats'

export function formatTimecode(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const frac = Math.floor((ms % 1000) / 100)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${frac}`
  }
  return `${m}:${String(s).padStart(2, '0')}.${frac}`
}
