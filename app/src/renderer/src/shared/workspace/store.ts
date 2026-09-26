import type { Player, Workspace, WorkspaceSettings } from '../core/types'
import { createId } from '../core/id'
import { normalizePlayerMetrics } from '../player/metrics'
import {
  readPersistedJson,
  removePersistedJson,
  writePersistedJson,
} from '../core/persistence'

export { createPlayer } from '../player/metrics'

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  notes: '',
}

let cachedWorkspaces: Workspace[] = []

export function createWorkspace(name: string, squad: Player[] = []): Workspace {
  const now = new Date().toISOString()
  return {
    id: createId(),
    name: name.trim(),
    createdAt: now,
    updatedAt: now,
    settings: { ...DEFAULT_WORKSPACE_SETTINGS },
    teamLogoDataUrl: null,
    squad: squad.map((player) => ({
      ...player,
      metrics: player.metrics.map((sample) => ({ ...sample })),
    })),
  }
}

const MAX_PHOTO_CHARS = 180_000

function normalizePhotoDataUrl(value: unknown): string | null {
  return typeof value === 'string' &&
    value.startsWith('data:image/') &&
    value.length <= MAX_PHOTO_CHARS
    ? value
    : null
}

function normalizePlayer(value: unknown): Player | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<Player>
  if (typeof raw.id !== 'string' || typeof raw.name !== 'string') return null
  const number =
    typeof raw.number === 'number' && Number.isFinite(raw.number)
      ? Math.max(0, Math.floor(raw.number))
      : 0
  const heightCm =
    typeof raw.heightCm === 'number' && Number.isFinite(raw.heightCm)
      ? raw.heightCm
      : null
  return {
    id: raw.id,
    name: raw.name,
    number,
    position: typeof raw.position === 'string' ? raw.position : '',
    heightCm,
    photoDataUrl: normalizePhotoDataUrl(raw.photoDataUrl),
    metrics: normalizePlayerMetrics(raw.metrics),
    ...(typeof raw.teamId === 'string' ? { teamId: raw.teamId } : {}),
    ...(raw.temporary ? { temporary: true } : {}),
  }
}

function normalizeSquad(value: unknown): Player[] {
  if (!Array.isArray(value)) return []
  return value
    .map(normalizePlayer)
    .filter((player): player is Player => player !== null)
}

function normalizeWorkspace(value: unknown): Workspace | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<Workspace>
  if (typeof raw.id !== 'string' || typeof raw.name !== 'string') return null
  return {
    id: raw.id,
    name: raw.name,
    createdAt:
      typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt:
      typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
    settings: {
      notes:
        typeof raw.settings?.notes === 'string' ? raw.settings.notes : '',
    },
    teamLogoDataUrl: normalizePhotoDataUrl(raw.teamLogoDataUrl),
    squad: normalizeSquad(raw.squad),
  }
}

export function parseWorkspaces(raw: unknown): Workspace[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(normalizeWorkspace)
    .filter((workspace): workspace is Workspace => workspace !== null)
}

export function loadWorkspaces(): Workspace[] {
  return cachedWorkspaces.map((workspace) => ({
    ...workspace,
    settings: { ...workspace.settings },
    teamLogoDataUrl: workspace.teamLogoDataUrl ?? null,
    squad: workspace.squad.map((player) => ({
      ...player,
      metrics: player.metrics.map((sample) => ({ ...sample })),
    })),
  }))
}

export function hydrateWorkspaces(raw: unknown): Workspace[] {
  cachedWorkspaces = parseWorkspaces(raw)
  return loadWorkspaces()
}

export function saveWorkspaces(workspaces: Workspace[]): void {
  cachedWorkspaces = workspaces
  void writePersistedJson('workspaces', workspaces)
}

export function clearWorkspacesStorage(): void {
  cachedWorkspaces = []
  void removePersistedJson('workspaces')
}

export async function loadWorkspacesAsync(): Promise<Workspace[]> {
  const raw = await readPersistedJson('workspaces')
  return hydrateWorkspaces(raw)
}

export function mergePlayersIntoSquad(
  squad: Player[],
  incoming: Player[],
  options?: { includeTemporary?: boolean },
): Player[] {
  const includeTemporary = options?.includeTemporary !== false
  const byId = new Map(squad.map((player) => [player.id, { ...player }]))
  for (const player of incoming) {
    if (!includeTemporary && player.temporary) continue
    const existing = byId.get(player.id)
    if (!existing) {
      byId.set(player.id, {
        ...player,
        metrics: player.metrics?.map((s) => ({ ...s })) ?? [],
        heightCm: player.heightCm ?? null,
        photoDataUrl: player.photoDataUrl ?? null,
      })
      continue
    }
    byId.set(player.id, {
      ...existing,
      name: existing.name || player.name,
      number: existing.number || player.number,
      position: existing.position || player.position,
      heightCm: existing.heightCm ?? player.heightCm ?? null,
      photoDataUrl: existing.photoDataUrl ?? player.photoDataUrl ?? null,
      metrics:
        existing.metrics.length > 0
          ? existing.metrics
          : (player.metrics ?? []).map((s) => ({ ...s })),
      ...(existing.temporary || player.temporary
        ? { temporary: true }
        : {}),
    })
  }
  return Array.from(byId.values())
}

export function rosterPlayersOnly(squad: Player[]): Player[] {
  return squad.filter((player) => !player.temporary)
}
