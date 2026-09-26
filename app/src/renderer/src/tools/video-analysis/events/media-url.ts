import type { HiDriveConfig } from '@/shared'
import type { MediaAsset, MediaSource } from '@/shared'
import { hidriveConnectorFor } from '@/shared'

function localPathToFileUrl(localPath: string): string {
  const normalized = localPath.replace(/\\/g, '/')
  if (/^[a-zA-Z]:\//.test(normalized)) {
    return `file:///${normalized}`
  }
  return normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`
}

export async function resolvePlaybackUrl(
  asset: MediaAsset,
  hidrive: HiDriveConfig,
): Promise<{ url: string | null; error?: string }> {
  const source = asset.sources[0]
  if (!source) return { url: null, error: 'no-source' }

  try {
    return { url: await resolveSourceUrl(source, hidrive) }
  } catch (err) {
    return {
      url: null,
      error: err instanceof Error ? err.message : 'resolve-failed',
    }
  }
}

async function resolveSourceUrl(
  source: MediaSource,
  hidrive: HiDriveConfig,
): Promise<string> {
  if (source.type === 'local') {
    return localPathToFileUrl(source.path)
  }
  if (source.type === 'url') {
    return source.url
  }
  if (source.type === 'cloud' && source.connectorId === 'hidrive') {
    const connector = hidriveConnectorFor(hidrive)
    if (!connector.resolveMedia) {
      throw new Error('hidrive-unavailable')
    }
    const resolved = await connector.resolveMedia({
      remoteId: source.remoteId,
      shareUrl: source.shareUrl,
    })
    return resolved.localUrl
  }
  throw new Error('unsupported-source')
}
