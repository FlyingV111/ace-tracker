import type { MediaManifest } from '../media/types'

export type Locale = 'de' | 'en'

export type { MediaAsset, MediaManifest, MediaRole, MediaSource } from '../media/types'

export type ToolId = 'player-tracker' | 'live-tracking' | 'video-analysis'

/** Workspace home: Kader | Spiele | Spieler; inside a match: game + tools */
export type AppView = 'squad' | 'games' | 'game' | 'player' | ToolId

export type WorkspaceSettings = {
  notes: string
}

export type Workspace = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  settings: WorkspaceSettings
  /** Club / home team crest for this workspace. */
  teamLogoDataUrl?: string | null
  /** Club roster - shared across all matches in this workspace. */
  squad: Player[]
}

export type PlayerMetricKind =
  | 'jumpHeightCm'
  | 'attackReachCm'
  | 'blockReachCm'
  | 'weightKg'
  | 'custom'
  | 'skillServe'
  | 'skillPass'
  | 'skillSet'
  | 'skillAttack'
  | 'skillBlock'
  | 'skillDefense'
  | 'skillAthleticism'
  | 'skillMentality'

/** One measurement in a player's long-term tracking series. */
export type PlayerMetricSample = {
  id: string
  kind: PlayerMetricKind
  /** Required when kind is `custom`. */
  label?: string
  value: number
  recordedAt: string
  note?: string
}

export type Player = {
  id: string
  name: string
  number: number
  position: string
  teamId?: string
  /** Standing height in cm. */
  heightCm?: number | null
  /** Cropped portrait as data URL. */
  photoDataUrl?: string | null
  /** Time-series metrics for cyclical tracking / charts. */
  metrics: PlayerMetricSample[]
  /** Match-only guest - never merged into workspace kader / season stats. */
  temporary?: boolean
}

export type Team = {
  id: string
  name: string
  shortName?: string
  iconDataUrl?: string | null
}

/** null / undefined = Ergebnis noch offen */
export type MatchResult = 'home' | 'away' | 'draw' | null

export type LineupSlot = {
  playerId: string
  role: string
}

export type ScoreEntry = {
  timeMs: number
  home: number
  away: number
  reason?: string
}

export type TaggingEvent = {
  id: string
  type: string
  timeMs: number
  teamId?: string
  playerId?: string
  label?: string
  thumbnail?: string
}

export type ProjectDocument = {
  version: 1
  id: string
  name: string
  createdAt: string
  updatedAt: string
  kickoff: string | null
  iconDataUrl?: string | null
  result?: MatchResult
  /** Final set score (e.g. 3:1). Prefer live analysis score when present. */
  setsScore?: { home: number; away: number } | null
  teams: {
    home: Team
    away: Team
  }
  squad: Player[]
  lineups: {
    home: LineupSlot[]
    away: LineupSlot[]
  }
  scoreHistory: ScoreEntry[]
  events: TaggingEvent[]
}

export type CameraTrack = {
  id: string
  name: string
  offsetMs: number
}

export type SyncAnchor = {
  id: string
  label: string
  timeMs: number
  cameraId?: string
}

export type SyncDocument = {
  version: 1
  cameras: CameraTrack[]
  anchors: SyncAnchor[]
  clipOrder: string[]
}

export type PlayerTrackerDocument = {
  version: 1
  squad: Player[]
  lineups: {
    home: LineupSlot[]
    away: LineupSlot[]
  }
}

export type LiveTrackingDocument = {
  version: 1
  kickoff: string | null
  events: TaggingEvent[]
  scoreHistory: ScoreEntry[]
}

export type EventCategory =
  | 'angriff'
  | 'block'
  | 'annahme'
  | 'rettung'
  | 'abwehr'
  | 'aufschlag'
  | 'zuspiel'
  | 'freeball'
  | 'touch'
  | 'netz'
  | 'aus'
  | 'fehler'
  | 'wechsel'
  | 'positionswechsel'
  | 'auszeit'
  | 'satzbeginn'
  | 'satzende'
  | 'highlight'
  | 'score_home'
  | 'score_away'

export type EventQuality =
  | 'gut'
  | 'mittel'
  | 'schlecht'
  | 'fehler'
  | 'kill'
  | 'ass'
  | 'punkt'

export type EventStrength = 1 | 2 | 3 | 4 | 5

export type AnalysisScore = {
  set: number
  home: number
  away: number
  setsHome: number
  setsAway: number
}

export type ClipMeta = {
  analysisDone: boolean
}

export type AnalysisEvent = {
  id: string
  mediaId: string
  timeMs: number
  category: EventCategory
  quality?: EventQuality
  errorType?: string
  strength?: EventStrength
  notloesung?: boolean
  playerId?: string | null
  playerInId?: string
  newRole?: string
  teamSide?: 'home' | 'away'
  highlight?: boolean
  pointSide?: 'home' | 'away'
  label?: string
}

export type VideoAnalysisDocument = SyncDocument & {
  activeMediaId: string | null
  clipMeta: Record<string, ClipMeta>
  score: AnalysisScore
  scoreHistory: ScoreEntry[]
  events: AnalysisEvent[]
}

export type ProjectToolDocuments = {
  'player-tracker': PlayerTrackerDocument
  'live-tracking': LiveTrackingDocument
  'video-analysis': VideoAnalysisDocument
}

export type AceProject = {
  fileName: string
  workspaceId: string
  project: ProjectDocument
  /** Mirrored from tools['video-analysis'] for older callers. */
  sync: VideoAnalysisDocument
  tools: ProjectToolDocuments
  /** Big video files are referenced here - never embedded. */
  media: MediaManifest
  lastToolId: ToolId | null
  thumbnails: Record<string, Uint8Array>
}
