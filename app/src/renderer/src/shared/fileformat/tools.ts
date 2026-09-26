import type {
  AnalysisScore,
  LiveTrackingDocument,
  PlayerTrackerDocument,
  ProjectToolDocuments,
  SyncDocument,
  VideoAnalysisDocument,
} from '../core/types'

export const TOOL_FILE_NAMES = {
  'player-tracker': 'tools/player-tracker.json',
  'live-tracking': 'tools/live-tracking.json',
  'video-analysis': 'tools/video-analysis.json',
} as const

export function createEmptyAnalysisScore(
  seed?: Partial<AnalysisScore>,
): AnalysisScore {
  return {
    set: seed?.set ?? 1,
    home: seed?.home ?? 0,
    away: seed?.away ?? 0,
    setsHome: seed?.setsHome ?? 0,
    setsAway: seed?.setsAway ?? 0,
  }
}

export function createEmptyPlayerTrackerDocument(
  seed?: Partial<PlayerTrackerDocument>,
): PlayerTrackerDocument {
  return {
    version: 1,
    squad: seed?.squad ?? [],
    lineups: seed?.lineups ?? { home: [], away: [] },
  }
}

export function createEmptyLiveTrackingDocument(
  seed?: Partial<LiveTrackingDocument>,
): LiveTrackingDocument {
  return {
    version: 1,
    kickoff: seed?.kickoff ?? null,
    events: seed?.events ?? [],
    scoreHistory: seed?.scoreHistory ?? [],
  }
}

export function createEmptyVideoAnalysisDocument(
  seed?: Partial<VideoAnalysisDocument> | SyncDocument,
): VideoAnalysisDocument {
  const partial = seed as Partial<VideoAnalysisDocument> | undefined
  return {
    version: 1,
    cameras: seed?.cameras ?? [],
    anchors: seed?.anchors ?? [],
    clipOrder: seed?.clipOrder ?? [],
    activeMediaId: partial?.activeMediaId ?? null,
    clipMeta: partial?.clipMeta ?? {},
    score: createEmptyAnalysisScore(partial?.score),
    scoreHistory: partial?.scoreHistory ?? [],
    events: partial?.events ?? [],
  }
}

export function normalizeVideoAnalysisDocument(
  value: unknown,
): VideoAnalysisDocument | null {
  if (!value || typeof value !== 'object') return null
  const doc = value as Partial<VideoAnalysisDocument>
  if (doc.version !== 1) return null
  if (
    !Array.isArray(doc.cameras) ||
    !Array.isArray(doc.anchors) ||
    !Array.isArray(doc.clipOrder)
  ) {
    return null
  }
  return createEmptyVideoAnalysisDocument(doc)
}

export function createEmptyToolDocuments(seed?: {
  playerTracker?: Partial<PlayerTrackerDocument>
  liveTracking?: Partial<LiveTrackingDocument>
  videoAnalysis?: Partial<VideoAnalysisDocument> | SyncDocument
}): ProjectToolDocuments {
  return {
    'player-tracker': createEmptyPlayerTrackerDocument(seed?.playerTracker),
    'live-tracking': createEmptyLiveTrackingDocument(seed?.liveTracking),
    'video-analysis': createEmptyVideoAnalysisDocument(seed?.videoAnalysis),
  }
}

export function isToolId(
  value: unknown,
): value is keyof ProjectToolDocuments {
  return (
    value === 'player-tracker' ||
    value === 'live-tracking' ||
    value === 'video-analysis'
  )
}
