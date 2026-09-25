import { app, ipcMain } from 'electron'
import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'

export type WebDavAuth = {
  username: string
  password: string
}

export type WebDavEntry = {
  path: string
  name: string
  isDir: boolean
  sizeBytes: number | null
}

export type WebDavListResult =
  | { ok: true; entries: WebDavEntry[] }
  | { ok: false; error: string }

export type WebDavProbeResult =
  | { ok: true }
  | { ok: false; error: string }

export type WebDavDownloadResult =
  | { ok: true; localPath: string; sizeBytes: number }
  | { ok: false; error: string }

const HIDRIVE_WEBDAV = 'https://webdav.hidrive.strato.com'

function authHeader(auth: WebDavAuth): string {
  return `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`
}

function webdavUrl(base: string, remotePath: string): string {
  const root = base.replace(/\/+$/, '')
  const parts = remotePath.split('/').filter(Boolean).map(encodeURIComponent)
  return `${root}/${parts.join('/')}`
}

function parsePropfindXml(xml: string, requestPath: string): WebDavEntry[] {
  const blocks = xml.split(/<d:response[^>]*>/i).slice(1)
  const entries: WebDavEntry[] = []
  const requestNorm = requestPath.replace(/\/+$/, '') || '/'

  for (const block of blocks) {
    const hrefMatch = block.match(/<d:href>([^<]+)<\/d:href>/i)
    if (!hrefMatch) continue
    let href = decodeURIComponent(hrefMatch[1]!.trim())
    // href may be absolute or path-only
    try {
      if (href.startsWith('http')) href = new URL(href).pathname
    } catch {
      // keep href
    }
    const path = href.replace(/\/+$/, '') || '/'
    if (path === requestNorm || path === `${requestNorm}/`) continue

    const isDir = /<d:collection\s*\/>/i.test(block) || /<d:collection>/i.test(block)
    const nameFromPath = path.split('/').filter(Boolean).pop() || path
    const nameMatch = block.match(/<d:displayname>([^<]*)<\/d:displayname>/i)
    const name = nameMatch?.[1]?.trim() || nameFromPath
    const sizeMatch = block.match(/<d:getcontentlength>(\d+)<\/d:getcontentlength>/i)
    const sizeBytes = sizeMatch ? Number(sizeMatch[1]) : null

    entries.push({
      path: path.startsWith('/') ? path : `/${path}`,
      name,
      isDir,
      sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : null,
    })
  }

  entries.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })
  return entries
}

export async function webdavProbe(
  baseUrl: string,
  remotePath: string,
  auth: WebDavAuth,
): Promise<WebDavProbeResult> {
  try {
    const url = webdavUrl(baseUrl, remotePath || '/')
    const res = await fetch(url, {
      method: 'PROPFIND',
      headers: {
        Authorization: authHeader(auth),
        Depth: '0',
        'Content-Type': 'application/xml; charset=utf-8',
      },
      body: `<?xml version="1.0"?>
<d:propfind xmlns:d="DAV:">
  <d:prop><d:resourcetype/></d:prop>
</d:propfind>`,
    })
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: 'Login fehlgeschlagen (Benutzer oder Passwort).' }
    }
    if (!res.ok && res.status !== 207) {
      return { ok: false, error: `HiDrive antwortete mit HTTP ${res.status}.` }
    }
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Netzwerkfehler',
    }
  }
}

export async function webdavList(
  baseUrl: string,
  remotePath: string,
  auth: WebDavAuth,
): Promise<WebDavListResult> {
  try {
    const path = remotePath || '/'
    const url = webdavUrl(baseUrl, path)
    const res = await fetch(url, {
      method: 'PROPFIND',
      headers: {
        Authorization: authHeader(auth),
        Depth: '1',
        'Content-Type': 'application/xml; charset=utf-8',
      },
      body: `<?xml version="1.0"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:displayname/>
    <d:resourcetype/>
    <d:getcontentlength/>
  </d:prop>
</d:propfind>`,
    })
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: 'Login fehlgeschlagen (Benutzer oder Passwort).' }
    }
    if (!res.ok && res.status !== 207) {
      return { ok: false, error: `Ordner lesen fehlgeschlagen (HTTP ${res.status}).` }
    }
    const xml = await res.text()
    return { ok: true, entries: parsePropfindXml(xml, path) }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Netzwerkfehler',
    }
  }
}

export async function webdavDownload(
  baseUrl: string,
  remotePath: string,
  auth: WebDavAuth,
  fileName: string,
): Promise<WebDavDownloadResult> {
  try {
    const url = webdavUrl(baseUrl, remotePath)
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: authHeader(auth) },
    })
    if (!res.ok || !res.body) {
      return {
        ok: false,
        error: `Download fehlgeschlagen (HTTP ${res.status}).`,
      }
    }

    const cacheDir = join(app.getPath('userData'), 'media-cache', 'hidrive')
    if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true })
    const safeName = fileName.replace(/[<>:"/\\|?*]/g, '_') || 'video.bin'
    const localPath = join(cacheDir, `${Date.now()}-${safeName}`)

    const nodeStream = Readable.fromWeb(res.body as import('stream/web').ReadableStream)
    await pipeline(nodeStream, createWriteStream(localPath))

    const sizeHeader = res.headers.get('content-length')
    const sizeBytes = sizeHeader ? Number(sizeHeader) : 0
    return {
      ok: true,
      localPath,
      sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : 0,
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Download-Fehler',
    }
  }
}

export function registerWebDavIpc(): void {
  ipcMain.handle(
    'webdav:probe',
    async (
      _event,
      payload: { baseUrl?: string; path: string; username: string; password: string },
    ): Promise<WebDavProbeResult> => {
      const baseUrl = payload.baseUrl?.trim() || HIDRIVE_WEBDAV
      return webdavProbe(baseUrl, payload.path, {
        username: payload.username,
        password: payload.password,
      })
    },
  )

  ipcMain.handle(
    'webdav:list',
    async (
      _event,
      payload: { baseUrl?: string; path: string; username: string; password: string },
    ): Promise<WebDavListResult> => {
      const baseUrl = payload.baseUrl?.trim() || HIDRIVE_WEBDAV
      return webdavList(baseUrl, payload.path, {
        username: payload.username,
        password: payload.password,
      })
    },
  )

  ipcMain.handle(
    'webdav:download',
    async (
      _event,
      payload: {
        baseUrl?: string
        path: string
        username: string
        password: string
        fileName: string
      },
    ): Promise<WebDavDownloadResult> => {
      const baseUrl = payload.baseUrl?.trim() || HIDRIVE_WEBDAV
      return webdavDownload(baseUrl, payload.path, {
        username: payload.username,
        password: payload.password,
      }, payload.fileName)
    },
  )
}

export { HIDRIVE_WEBDAV }
