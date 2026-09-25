import type { MediaManifest } from './media/types'

export type Locale = 'de' | 'en'

export type { MediaAsset, MediaManifest, MediaRole, MediaSource } from './media/types'

export type ToolId = 'player-tracker' | 'live-tracking' | 'video-analysis'

export type AppView = 'projects' | 'project' | ToolId

export type WorkspaceSettings = {
  notes: string
}

export type Workspace = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  settings: WorkspaceSettings
}

export type Player = {
  id: string
  name: string
  number: number
  position: string
  teamId?: string
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

export type VideoAnalysisDocument = SyncDocument

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
  sync: SyncDocument
  tools: ProjectToolDocuments
  /** Big video files are referenced here — never embedded. */
  media: MediaManifest
  lastToolId: ToolId | null
  thumbnails: Record<string, Uint8Array>
}
