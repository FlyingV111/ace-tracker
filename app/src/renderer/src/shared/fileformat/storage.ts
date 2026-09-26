import type {
  AceProject,
  MediaManifest,
  ProjectDocument,
  ProjectToolDocuments,
  ToolId,
} from '../core/types'
import {
  createEmptyMediaManifest,
  isMediaManifest,
} from '../media'
import { createEmptyToolDocuments, isToolId, normalizeVideoAnalysisDocument } from './tools'
import {
  readPersistedJson,
  removePersistedJson,
  writePersistedJson,
} from '../core/persistence'

type StoredAceProject = {
  fileName: string
  workspaceId: string
  project: ProjectDocument
  sync: AceProject['sync']
  tools?: ProjectToolDocuments
  media?: MediaManifest
  lastToolId?: ToolId | null
  thumbnailsBase64?: Record<string, string>
}

let cachedProjects: AceProject[] = []

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function normalizeAceProject(stored: StoredAceProject): AceProject {
  const rawTools =
    stored.tools ??
    createEmptyToolDocuments({
      playerTracker: {
        squad: stored.project.squad,
        lineups: stored.project.lineups,
      },
      liveTracking: {
        kickoff: stored.project.kickoff,
        events: stored.project.events,
        scoreHistory: stored.project.scoreHistory,
      },
      videoAnalysis: stored.sync,
    })

  const video =
    normalizeVideoAnalysisDocument(rawTools['video-analysis']) ??
    createEmptyToolDocuments()['video-analysis']

  const tools: ProjectToolDocuments = {
    ...rawTools,
    'video-analysis': video,
  }

  const thumbnails: Record<string, Uint8Array> = {}
  for (const [path, base64] of Object.entries(stored.thumbnailsBase64 ?? {})) {
    thumbnails[path] = base64ToBytes(base64)
  }

  return {
    fileName: stored.fileName,
    workspaceId: stored.workspaceId || '',
    project: stored.project,
    sync: tools['video-analysis'],
    tools,
    media: isMediaManifest(stored.media)
      ? stored.media
      : createEmptyMediaManifest(),
    lastToolId: isToolId(stored.lastToolId) ? stored.lastToolId : null,
    thumbnails,
  }
}

export function serializeForStorage(ace: AceProject): StoredAceProject {
  const thumbnailsBase64: Record<string, string> = {}
  for (const [path, bytes] of Object.entries(ace.thumbnails)) {
    if (bytes.byteLength > 200_000) continue
    thumbnailsBase64[path] = bytesToBase64(bytes)
  }
  const tools = ace.tools ?? createEmptyToolDocuments({ videoAnalysis: ace.sync })
  return {
    fileName: ace.fileName,
    workspaceId: ace.workspaceId,
    project: ace.project,
    sync: tools['video-analysis'],
    tools,
    media: ace.media ?? createEmptyMediaManifest(),
    lastToolId: ace.lastToolId ?? null,
    thumbnailsBase64,
  }
}

export function deserializeFromStorage(stored: StoredAceProject): AceProject {
  return normalizeAceProject(stored)
}

export function parseProjects(raw: unknown): AceProject[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is StoredAceProject => Boolean(item && typeof item === 'object'))
    .map(deserializeFromStorage)
}

export function loadProjects(): AceProject[] {
  return cachedProjects
}

export function hydrateProjects(raw: unknown): AceProject[] {
  cachedProjects = parseProjects(raw)
  return cachedProjects
}

export function saveProjects(projects: AceProject[]): void {
  cachedProjects = projects
  const payload = projects.map(serializeForStorage)
  void writePersistedJson('projects', payload)
}

export function clearProjectsStorage(): void {
  cachedProjects = []
  void removePersistedJson('projects')
}

export async function loadProjectsAsync(): Promise<AceProject[]> {
  const raw = await readPersistedJson('projects')
  return hydrateProjects(raw)
}
