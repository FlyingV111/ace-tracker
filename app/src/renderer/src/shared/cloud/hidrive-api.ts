import { createMediaAsset } from '../media/helpers'
import type { MediaAsset } from '../media/types'
import {
  HIDRIVE_CONNECTOR_ID,
  HIDRIVE_WEBDAV_URL,
  type HiDriveConfig,
} from './hidrive-config'

export type HiDriveRemoteEntry = {
  path: string
  name: string
  isDir: boolean
  sizeBytes: number | null
}

function requireElectronWebDav() {
  const api = window.electronAPI
  if (!api?.isElectron || !api.webdavProbe || !api.webdavList) {
    throw new Error(
      'HiDrive braucht die Desktop-App (Electron), nicht den Browser-Modus.',
    )
  }
  return api
}

export async function probeHiDrive(
  config: Pick<HiDriveConfig, 'username' | 'password' | 'rootPath'>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const api = requireElectronWebDav()
  const path =
    config.rootPath.trim() ||
    (config.username.trim() ? `/users/${config.username.trim()}` : '/')
  return api.webdavProbe!({
    baseUrl: HIDRIVE_WEBDAV_URL,
    path,
    username: config.username.trim(),
    password: config.password,
  })
}

export async function listHiDriveFolder(
  config: Pick<HiDriveConfig, 'username' | 'password'>,
  path: string,
): Promise<{ ok: true; entries: HiDriveRemoteEntry[] } | { ok: false; error: string }> {
  const api = requireElectronWebDav()
  return api.webdavList!({
    baseUrl: HIDRIVE_WEBDAV_URL,
    path,
    username: config.username.trim(),
    password: config.password,
  })
}

export async function downloadHiDriveFile(
  config: Pick<HiDriveConfig, 'username' | 'password'>,
  remotePath: string,
  fileName: string,
): Promise<
  | { ok: true; localPath: string; sizeBytes: number }
  | { ok: false; error: string }
> {
  const api = requireElectronWebDav()
  if (!api.webdavDownload) {
    return { ok: false, error: 'Download nicht verfügbar.' }
  }
  return api.webdavDownload({
    baseUrl: HIDRIVE_WEBDAV_URL,
    path: remotePath,
    username: config.username.trim(),
    password: config.password,
    fileName,
  })
}

export function mediaFromHiDriveFile(input: {
  remotePath: string
  fileName: string
  sizeBytes?: number | null
  shareUrl?: string
}): MediaAsset {
  return createMediaAsset({
    fileName: input.fileName,
    sizeBytes: input.sizeBytes ?? null,
    sources: [
      {
        type: 'cloud',
        connectorId: HIDRIVE_CONNECTOR_ID,
        remoteId: input.remotePath,
        shareUrl: input.shareUrl || undefined,
      },
    ],
  })
}
