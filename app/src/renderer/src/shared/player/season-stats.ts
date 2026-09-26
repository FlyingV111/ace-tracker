import type { AceProject, TaggingEvent } from '../core/types'
import { analysisEventToStatType } from './analysis-event-stats'

export type VolleyballStatBucket =
  | 'serve'
  | 'reception'
  | 'dig'
  | 'set'
  | 'attack'
  | 'block'

export type SeasonMatchPoint = {
  projectId: string
  matchName: string
  kickoff: string | null
  kills: number
  aces: number
  errors: number
  receptionAttempts: number
  receptionPerfect: number
  receptionGood: number
}

export type PlayerSeasonStats = {
  playerId: string
  matchCount: number
  serveAce: number
  serveError: number
  serveIn: number
  receptionPerfect: number
  receptionGood: number
  receptionMedium: number
  receptionError: number
  digSuccess: number
  digError: number
  setAssist: number
  setError: number
  attackKill: number
  attackError: number
  attackBlocked: number
  attackContinued: number
  blockStuff: number
  blockTouch: number
  blockError: number
  perMatch: SeasonMatchPoint[]
}

function emptyStats(playerId: string): PlayerSeasonStats {
  return {
    playerId,
    matchCount: 0,
    serveAce: 0,
    serveError: 0,
    serveIn: 0,
    receptionPerfect: 0,
    receptionGood: 0,
    receptionMedium: 0,
    receptionError: 0,
    digSuccess: 0,
    digError: 0,
    setAssist: 0,
    setError: 0,
    attackKill: 0,
    attackError: 0,
    attackBlocked: 0,
    attackContinued: 0,
    blockStuff: 0,
    blockTouch: 0,
    blockError: 0,
    perMatch: [],
  }
}

function normalizeEventType(event: TaggingEvent): string {
  const raw = (event.type || event.label || '').trim().toLowerCase()
  return raw.replace(/\s+/g, '_').replace(/-+/g, '_')
}

type StatField = keyof Omit<
  PlayerSeasonStats,
  'playerId' | 'matchCount' | 'perMatch'
>

const EVENT_FIELD_MAP: Record<string, StatField> = {
  serve_ace: 'serveAce',
  ace: 'serveAce',
  aufschlag_ace: 'serveAce',
  serve_error: 'serveError',
  serve_fehler: 'serveError',
  aufschlag_fehler: 'serveError',
  serve_in: 'serveIn',
  serve: 'serveIn',
  aufschlag: 'serveIn',
  reception_perfect: 'receptionPerfect',
  annahme_perfekt: 'receptionPerfect',
  pass_perfect: 'receptionPerfect',
  reception_good: 'receptionGood',
  annahme_gut: 'receptionGood',
  pass_good: 'receptionGood',
  reception_medium: 'receptionMedium',
  reception_ok: 'receptionMedium',
  annahme_mittel: 'receptionMedium',
  reception_error: 'receptionError',
  annahme_fehler: 'receptionError',
  pass_error: 'receptionError',
  dig_success: 'digSuccess',
  dig: 'digSuccess',
  abwehr: 'digSuccess',
  dig_error: 'digError',
  abwehr_fehler: 'digError',
  set_assist: 'setAssist',
  assist: 'setAssist',
  zuspiel_assist: 'setAssist',
  set_error: 'setError',
  zuspiel_fehler: 'setError',
  attack_kill: 'attackKill',
  kill: 'attackKill',
  punkt: 'attackKill',
  angriff_kill: 'attackKill',
  attack_error: 'attackError',
  angriff_fehler: 'attackError',
  attack_blocked: 'attackBlocked',
  angriff_geblockt: 'attackBlocked',
  attack_continued: 'attackContinued',
  attack: 'attackContinued',
  angriff: 'attackContinued',
  block_stuff: 'blockStuff',
  block_kill: 'blockStuff',
  stuff: 'blockStuff',
  block_touch: 'blockTouch',
  block: 'blockTouch',
  block_error: 'blockError',
  block_fehler: 'blockError',
}

function applyEvent(stats: PlayerSeasonStats, event: TaggingEvent): void {
  const key = normalizeEventType(event)
  const field = EVENT_FIELD_MAP[key]
  if (!field) return
  stats[field] += 1
}

function collectMatchEvents(ace: AceProject): TaggingEvent[] {
  const fromLive = ace.tools?.['live-tracking']?.events ?? []
  const fromProject = ace.project?.events ?? []
  const fromVideo = (ace.tools?.['video-analysis']?.events ?? []).flatMap(
    (event) => {
      if (!event.playerId) return []
      const type = analysisEventToStatType(event)
      if (!type) return []
      return [
        {
          id: event.id,
          type,
          timeMs: event.timeMs,
          playerId: event.playerId,
          teamId: event.teamSide,
          label: event.label,
        } satisfies TaggingEvent,
      ]
    },
  )

  if (fromVideo.length > 0) return fromVideo
  if (fromLive.length > 0) return fromLive
  return fromProject
}

export function aggregatePlayerSeasonStats(
  playerId: string,
  projects: AceProject[],
): PlayerSeasonStats {
  const stats = emptyStats(playerId)
  const sorted = [...projects].sort((a, b) => {
    const ak = a.project.kickoff ?? a.project.createdAt
    const bk = b.project.kickoff ?? b.project.createdAt
    return ak < bk ? -1 : ak > bk ? 1 : 0
  })

  for (const ace of sorted) {
    const events = collectMatchEvents(ace).filter(
      (event) => event.playerId === playerId,
    )
    if (events.length === 0) continue

    const before = { ...stats }
    for (const event of events) applyEvent(stats, event)

    const kills = stats.attackKill - before.attackKill + (stats.blockStuff - before.blockStuff)
    const aces = stats.serveAce - before.serveAce
    const errors =
      stats.serveError -
      before.serveError +
      (stats.receptionError - before.receptionError) +
      (stats.digError - before.digError) +
      (stats.setError - before.setError) +
      (stats.attackError - before.attackError) +
      (stats.blockError - before.blockError)
    const receptionPerfect = stats.receptionPerfect - before.receptionPerfect
    const receptionGood = stats.receptionGood - before.receptionGood
    const receptionAttempts =
      receptionPerfect +
      receptionGood +
      (stats.receptionMedium - before.receptionMedium) +
      (stats.receptionError - before.receptionError)

    stats.matchCount += 1
    stats.perMatch.push({
      projectId: ace.project.id,
      matchName: ace.project.name,
      kickoff: ace.project.kickoff,
      kills,
      aces,
      errors,
      receptionAttempts,
      receptionPerfect,
      receptionGood,
    })
  }

  return stats
}

export function receptionPositivePct(stats: PlayerSeasonStats): number | null {
  const total =
    stats.receptionPerfect +
    stats.receptionGood +
    stats.receptionMedium +
    stats.receptionError
  if (total === 0) return null
  return ((stats.receptionPerfect + stats.receptionGood) / total) * 100
}

export function attackEfficiency(stats: PlayerSeasonStats): number | null {
  const total =
    stats.attackKill +
    stats.attackError +
    stats.attackBlocked +
    stats.attackContinued
  if (total === 0) return null
  return (
    (stats.attackKill - stats.attackError - stats.attackBlocked) / total
  )
}

export function seasonHasAnyData(stats: PlayerSeasonStats): boolean {
  return stats.matchCount > 0
}
