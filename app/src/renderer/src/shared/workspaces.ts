import type { Workspace, WorkspaceSettings } from './types'
import { createId } from './id'
import {
  readPersistedJson,
  removePersistedJson,
  writePersistedJson,
} from './persistence'

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  notes: '',
}

let cachedWorkspaces: Workspace[] = []

export function createWorkspace(name: string): Workspace {
  const now = new Date().toISOString()
  return {
    id: createId(),
    name: name.trim(),
    createdAt: now,
    updatedAt: now,
    settings: { ...DEFAULT_WORKSPACE_SETTINGS },
  }
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
