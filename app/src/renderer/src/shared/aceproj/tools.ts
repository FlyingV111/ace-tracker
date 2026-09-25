import type {
  LiveTrackingDocument,
  PlayerTrackerDocument,
  ProjectToolDocuments,
  SyncDocument,
  VideoAnalysisDocument,
} from '../types'

export const TOOL_FILE_NAMES = {
  'player-tracker': 'tools/player-tracker.json',
  'live-tracking': 'tools/live-tracking.json',
  'video-analysis': 'tools/video-analysis.json',
} as const

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
  seed?: Partial<VideoAnalysisDocument>,
): VideoAnalysisDocument {
  return {
    version: 1,
    cameras: seed?.cameras ?? [],
    anchors: seed?.anchors ?? [],
    clipOrder: seed?.clipOrder ?? [],
  }
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
