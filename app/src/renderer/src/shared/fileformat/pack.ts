import JSZip from 'jszip'
import type {
  AceProject,
  LiveTrackingDocument,
  PlayerTrackerDocument,
  ProjectDocument,
  ProjectToolDocuments,
  SyncDocument,
  ToolId,
  VideoAnalysisDocument,
} from '../core/types'
import {
  createEmptyMediaManifest,
  isMediaManifest,
} from '../media'
import { buildReadme, toAceprojFileName } from './schema'
import {
  createEmptyToolDocuments,
  isToolId,
  normalizeVideoAnalysisDocument,
  TOOL_FILE_NAMES,
} from './tools'

function isProjectDocument(value: unknown): value is ProjectDocument {
  if (!value || typeof value !== 'object') return false
  const doc = value as ProjectDocument
  return (
    doc.version === 1 &&
    typeof doc.id === 'string' &&
    typeof doc.name === 'string' &&
    Array.isArray(doc.squad) &&
    Array.isArray(doc.events) &&
    Array.isArray(doc.scoreHistory) &&
    !!doc.teams?.home &&
    !!doc.teams?.away &&
    !!doc.lineups
  )
}

function isPlayerTrackerDocument(
  value: unknown,
): value is PlayerTrackerDocument {
  if (!value || typeof value !== 'object') return false
  const doc = value as PlayerTrackerDocument
  return (
    doc.version === 1 &&
    Array.isArray(doc.squad) &&
    !!doc.lineups?.home &&
    !!doc.lineups?.away
  )
}

function isLiveTrackingDocument(value: unknown): value is LiveTrackingDocument {
  if (!value || typeof value !== 'object') return false
  const doc = value as LiveTrackingDocument
  return (
    doc.version === 1 &&
    Array.isArray(doc.events) &&
    Array.isArray(doc.scoreHistory)
  )
}

async function readJson(
  zip: JSZip,
  path: string,
): Promise<unknown | undefined> {
  const raw = await zip.file(path)?.async('string')
  if (!raw) return undefined
  return JSON.parse(raw) as unknown
}

function resolveTools(
  project: ProjectDocument,
  sync: SyncDocument | VideoAnalysisDocument | undefined,
  parsedTools: Partial<ProjectToolDocuments> | undefined,
): ProjectToolDocuments {
  return createEmptyToolDocuments({
    playerTracker: parsedTools?.['player-tracker'] ?? {
      squad: project.squad,
      lineups: project.lineups,
    },
    liveTracking: parsedTools?.['live-tracking'] ?? {
      kickoff: project.kickoff,
      events: project.events,
      scoreHistory: project.scoreHistory,
    },
    videoAnalysis: parsedTools?.['video-analysis'] ?? sync,
  })
}

export async function packAceproj(ace: AceProject): Promise<Blob> {
  const zip = new JSZip()
  const project = {
    ...ace.project,
    updatedAt: new Date().toISOString(),
  }
  const tools = ace.tools ?? createEmptyToolDocuments({ videoAnalysis: ace.sync })

  zip.file('project.json', JSON.stringify(project, null, 2))
  zip.file(
    TOOL_FILE_NAMES['player-tracker'],
    JSON.stringify(tools['player-tracker'], null, 2),
  )
  zip.file(
    TOOL_FILE_NAMES['live-tracking'],
    JSON.stringify(tools['live-tracking'], null, 2),
  )
  zip.file(
    TOOL_FILE_NAMES['video-analysis'],
    JSON.stringify(tools['video-analysis'], null, 2),
  )
  // Legacy mirror for older Ace Tracker builds
  zip.file('sync.json', JSON.stringify(tools['video-analysis'], null, 2))
  zip.file(
    'media.json',
    JSON.stringify(ace.media ?? createEmptyMediaManifest(), null, 2),
  )
  zip.file(
    'session.json',
    JSON.stringify({ lastToolId: ace.lastToolId }, null, 2),
  )
  zip.file('README.txt', buildReadme(project))

  const thumbs = zip.folder('thumbnails')
  if (thumbs) {
    for (const [path, bytes] of Object.entries(ace.thumbnails)) {
      const name = path.replace(/^thumbnails\//, '')
      if (name) thumbs.file(name, bytes)
    }
  }

  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.ace-tracker.project+zip',
  })
}

export async function unpackAceproj(
  source: File | ArrayBuffer | Blob,
  fileNameHint?: string,
): Promise<AceProject> {
  const zip = await JSZip.loadAsync(source)

  const projectRaw = await zip.file('project.json')?.async('string')
  if (!projectRaw) {
    throw new Error('Invalid .aceproj: missing project.json')
  }

  const project = JSON.parse(projectRaw) as unknown
  if (!isProjectDocument(project)) {
    throw new Error('Invalid .aceproj: project.json schema mismatch')
  }

  const playerRaw = await readJson(zip, TOOL_FILE_NAMES['player-tracker'])
  const liveRaw = await readJson(zip, TOOL_FILE_NAMES['live-tracking'])
  const videoRaw = await readJson(zip, TOOL_FILE_NAMES['video-analysis'])
  const syncRaw = await readJson(zip, 'sync.json')
  const mediaRaw = await readJson(zip, 'media.json')
  const sessionRaw = await readJson(zip, 'session.json')

  const parsedTools: Partial<ProjectToolDocuments> = {}
  if (isPlayerTrackerDocument(playerRaw)) {
    parsedTools['player-tracker'] = playerRaw
  }
  if (isLiveTrackingDocument(liveRaw)) {
    parsedTools['live-tracking'] = liveRaw
  }
  const videoNormalized = normalizeVideoAnalysisDocument(videoRaw)
  if (videoNormalized) {
    parsedTools['video-analysis'] = videoNormalized
  }

  const syncNormalized =
    normalizeVideoAnalysisDocument(syncRaw) ?? videoNormalized ?? undefined

  if (!syncNormalized && !parsedTools['video-analysis']) {
    // Allow empty video analysis for brand-new tool-file projects
  }

  const tools = resolveTools(project, syncNormalized, parsedTools)
  const lastToolId =
    sessionRaw &&
    typeof sessionRaw === 'object' &&
    isToolId((sessionRaw as { lastToolId?: unknown }).lastToolId)
      ? ((sessionRaw as { lastToolId: ToolId }).lastToolId)
      : null

  const thumbnails: Record<string, Uint8Array> = {}
  const thumbFolder = zip.folder('thumbnails')
  if (thumbFolder) {
    const jobs: Promise<void>[] = []
    thumbFolder.forEach((relativePath, file) => {
      if (file.dir) return
      jobs.push(
        file.async('uint8array').then((bytes) => {
          thumbnails[`thumbnails/${relativePath}`] = bytes
        }),
      )
    })
    await Promise.all(jobs)
  }

  const hint =
    fileNameHint ||
    (source instanceof File ? source.name : undefined) ||
    toAceprojFileName(project.name)

  return {
    fileName: hint.endsWith('.aceproj') ? hint : `${hint}.aceproj`,
    workspaceId: '',
    project,
    sync: tools['video-analysis'],
    tools,
    media: isMediaManifest(mediaRaw) ? mediaRaw : createEmptyMediaManifest(),
    lastToolId,
    thumbnails,
  }
}

export async function downloadAceproj(ace: AceProject): Promise<void> {
  const blob = await packAceproj(ace)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = ace.fileName || toAceprojFileName(ace.project.name)
  anchor.click()
  URL.revokeObjectURL(url)
}
