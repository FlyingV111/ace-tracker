import { createId } from '../id'
import type { MediaAsset, MediaManifest, MediaRole, MediaSource } from './types'

export function createEmptyMediaManifest(): MediaManifest {
  return { version: 1, items: [] }
}

export function isMediaManifest(value: unknown): value is MediaManifest {
  if (!value || typeof value !== 'object') return false
  const doc = value as MediaManifest
  return doc.version === 1 && Array.isArray(doc.items)
}

export function createMediaAsset(input: {
  fileName: string
  role?: MediaRole
  sizeBytes?: number | null
  contentHash?: string | null
  sources: MediaSource[]
}): MediaAsset {
  return {
    id: createId(),
    role: input.role ?? 'main',
    fileName: input.fileName,
    sizeBytes: input.sizeBytes ?? null,
    contentHash: input.contentHash ?? null,
    sources: input.sources,
  }
}

/** Add a local file reference (Electron usually fills `file.path`). */
export function mediaFromLocalFile(
  file: File,
  role: MediaRole = 'main',
): MediaAsset {
  const withPath = file as File & { path?: string }
  const path =
    typeof withPath.path === 'string' && withPath.path.length > 0
      ? withPath.path
      : file.name

  return createMediaAsset({
    fileName: file.name,
    role,
    sizeBytes: Number.isFinite(file.size) ? file.size : null,
    sources: [{ type: 'local', path }],
  })
}

/** Add a share / direct download link (Google Drive, Strato, …). */
export function mediaFromUrl(
  url: string,
  fileName?: string,
  role: MediaRole = 'main',
): MediaAsset {
  const trimmed = url.trim()
  let name = fileName?.trim() || 'video'
  try {
    const last = new URL(trimmed).pathname.split('/').filter(Boolean).pop()
    if (last && !fileName) name = decodeURIComponent(last)
  } catch {
    // keep default name
  }

  return createMediaAsset({
    fileName: name,
    role,
    sources: [{ type: 'url', url: trimmed }],
  })
}

export function addMediaItem(
  manifest: MediaManifest,
  asset: MediaAsset,
): MediaManifest {
  return { ...manifest, items: [...manifest.items, asset] }
}

export function removeMediaItem(
  manifest: MediaManifest,
  assetId: string,
): MediaManifest {
  return {
    ...manifest,
    items: manifest.items.filter((item) => item.id !== assetId),
  }
}

export function formatBytes(bytes: number | null): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

export function describeSource(source: MediaSource): string {
  if (source.type === 'local') return source.path
  if (source.type === 'url') return source.url
  return `${source.connectorId}:${source.remoteId}`
}
