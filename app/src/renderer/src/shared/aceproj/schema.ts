import type {
  AceProject,
  MatchResult,
  ProjectDocument,
  SyncDocument,
} from '../types'
import { createId } from '../id'
import { createEmptyMediaManifest } from '../media'
import { createEmptyToolDocuments } from './tools'

export function slugifyProjectName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-') || 'project'
}

export function toAceprojFileName(name: string): string {
  return `${slugifyProjectName(name)}.aceproj`
}

export function createEmptySync(): SyncDocument {
  return {
    version: 1,
    cameras: [],
    anchors: [],
    clipOrder: [],
  }
}

export type CreateProjectTeamsInput = {
  home: string
  away: string
  homeShort?: string
  awayShort?: string
  homeIconDataUrl?: string | null
  awayIconDataUrl?: string | null
}

export function createEmptyProjectDocument(
  name: string,
  teams?: CreateProjectTeamsInput,
  extras?: {
    iconDataUrl?: string | null
    result?: MatchResult
  },
): ProjectDocument {
  const now = new Date().toISOString()
  const homeName = teams?.home.trim() ?? ''
  const awayName = teams?.away.trim() ?? ''
  return {
    version: 1,
    id: createId(),
    name: name.trim(),
    createdAt: now,
    updatedAt: now,
    kickoff: null,
    iconDataUrl: extras?.iconDataUrl ?? null,
    result: extras?.result ?? null,
    teams: {
      home: {
        id: 'home',
        name: homeName,
        shortName: teams?.homeShort?.trim() || undefined,
        iconDataUrl: teams?.homeIconDataUrl ?? null,
      },
      away: {
        id: 'away',
        name: awayName,
        shortName: teams?.awayShort?.trim() || undefined,
        iconDataUrl: teams?.awayIconDataUrl ?? null,
      },
    },
    squad: [],
    lineups: { home: [], away: [] },
    scoreHistory: [],
    events: [],
  }
}

export function buildReadme(doc: ProjectDocument): string {
  return [
    `Ace Tracker Project`,
    `===================`,
    ``,
    `Name:        ${doc.name}`,
    `ID:          ${doc.id}`,
    `Created:     ${doc.createdAt}`,
    `Updated:     ${doc.updatedAt}`,
    `Home:        ${doc.teams.home.name || '-'}`,
    `Away:        ${doc.teams.away.name || '-'}`,
    `Result:      ${doc.result ?? 'open'}`,
    `Squad:       ${doc.squad.length} players`,
    `Events:      ${doc.events.length}`,
    `Score steps: ${doc.scoreHistory.length}`,
    ``,
    `Container layout:`,
    `  project.json                 - match meta, teams`,
    `  tools/player-tracker.json    - squad & lineups`,
    `  tools/live-tracking.json     - live events & score`,
    `  tools/video-analysis.json    - cameras, anchors, clips`,
    `  media.json                   - video file references (not the videos)`,
    `  thumbnails/                  - preview stills`,
    `  README.txt                   - this file`,
    ``,
  ].join('\n')
}

export type CreateProjectInput = {
  workspaceId: string
  name?: string
  homeTeam: string
  awayTeam: string
  homeShort?: string
  awayShort?: string
  homeIconDataUrl?: string | null
  awayIconDataUrl?: string | null
  iconDataUrl?: string | null
  result?: MatchResult
}

export function createEmptyProject(input: CreateProjectInput): AceProject {
  const home = input.homeTeam.trim()
  const away = input.awayTeam.trim()
  const name =
    input.name?.trim() ||
    (home && away ? `${home} vs ${away}` : home || away || 'Projekt')

  const project = createEmptyProjectDocument(
    name,
    {
      home,
      away,
      homeShort: input.homeShort,
      awayShort: input.awayShort,
      homeIconDataUrl: input.homeIconDataUrl,
      awayIconDataUrl: input.awayIconDataUrl,
    },
    {
      iconDataUrl: input.iconDataUrl,
      result: input.result ?? null,
    },
  )
  const tools = createEmptyToolDocuments()

  return {
    fileName: toAceprojFileName(name),
    workspaceId: input.workspaceId,
    project,
    sync: tools['video-analysis'],
    tools,
    media: createEmptyMediaManifest(),
    lastToolId: null,
    thumbnails: {},
  }
}

export function touchProject(ace: AceProject): AceProject {
  return {
    ...ace,
    fileName: toAceprojFileName(ace.project.name),
    project: {
      ...ace.project,
      updatedAt: new Date().toISOString(),
    },
  }
}
