import { useRef, useState } from 'react'
import { Cloud, FolderUp, Link2, Trash2, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  addMediaItem,
  createEmptyMediaManifest,
  describeSource,
  formatBytes,
  mediaFromLocalFile,
  mediaFromUrl,
  removeMediaItem,
  useToolStore,
  useWorkspace,
} from '@/shared'
import {
  listHiDriveFolder,
  mediaFromHiDriveFile,
  type HiDriveRemoteEntry,
} from '@/shared/cloud/hidrive-api'
import { ToolPageHeader } from '@/components/layout/ToolPageHeader'
import { useVideoAnalysisI18n } from '../locales/use-i18n'

export function VideoAnalysisPage() {
  const { activeProject, setProjectMedia, settings } = useWorkspace()
  const [sync] = useToolStore('video-analysis')
  const t = useVideoAnalysisI18n()
  const fileRef = useRef<HTMLInputElement>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkValue, setLinkValue] = useState('')
  const [browseOpen, setBrowseOpen] = useState(false)
  const [browsePath, setBrowsePath] = useState('')
  const [entries, setEntries] = useState<HiDriveRemoteEntry[]>([])
  const [browseError, setBrowseError] = useState<string | null>(null)
  const [browseBusy, setBrowseBusy] = useState(false)

  const data = sync ?? activeProject?.tools['video-analysis']
  const media = activeProject?.media ?? createEmptyMediaManifest()
  const hidrive = settings.hidrive

  function persistMedia(
    next: ReturnType<typeof createEmptyMediaManifest>,
  ) {
    if (!activeProject) return
    setProjectMedia(activeProject.project.id, next)
  }

  function onPickLocal(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    persistMedia(addMediaItem(media, mediaFromLocalFile(file)))
    if (fileRef.current) fileRef.current.value = ''
  }

  function onAddLink() {
    const url = linkValue.trim()
    if (!url) return
    persistMedia(addMediaItem(media, mediaFromUrl(url)))
    setLinkValue('')
    setLinkOpen(false)
  }

  function onRemove(id: string) {
    persistMedia(removeMediaItem(media, id))
  }

  async function loadFolder(path: string) {
    if (!hidrive.connected) {
      setBrowseError(t('hidriveBrowseNeedConnect'))
      return
    }
    setBrowseBusy(true)
    setBrowseError(null)
    try {
      const result = await listHiDriveFolder(hidrive, path)
      if (!result.ok) {
        setBrowseError(result.error || t('hidriveBrowseError'))
        setEntries([])
        return
      }
      setBrowsePath(path)
      setEntries(result.entries)
    } catch (err) {
      setBrowseError(
        err instanceof Error ? err.message : t('hidriveBrowseError'),
      )
      setEntries([])
    } finally {
      setBrowseBusy(false)
    }
  }

  function openHiDriveBrowser() {
    const start =
      hidrive.rootPath.trim() ||
      (hidrive.username ? `/users/${hidrive.username}` : '/')
    setBrowseOpen(true)
    void loadFolder(start)
  }

  function parentPath(path: string): string {
    const parts = path.split('/').filter(Boolean)
    parts.pop()
    return parts.length ? `/${parts.join('/')}` : '/'
  }

  function attachHiDriveFile(entry: HiDriveRemoteEntry) {
    if (entry.isDir) {
      void loadFolder(entry.path)
      return
    }
    persistMedia(
      addMediaItem(
        media,
        mediaFromHiDriveFile({
          remotePath: entry.path,
          fileName: entry.name,
          sizeBytes: entry.sizeBytes,
          shareUrl: hidrive.shareUrl || undefined,
        }),
      ),
    )
    setBrowseOpen(false)
  }

  const hasSyncData =
    data &&
    (data.cameras.length > 0 ||
      data.anchors.length > 0 ||
      data.clipOrder.length > 0)

  return (
    <div className="space-y-6">
      <ToolPageHeader title={t('title')} description={t('description')} />

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">{t('mediaTitle')}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t('mediaHint')}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="video/*,.mp4,.mov,.mkv"
            className="hidden"
            onChange={(event) => onPickLocal(event.target.files)}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => fileRef.current?.click()}
            disabled={!activeProject}
          >
            <Film data-icon="inline-start" />
            {t('addLocal')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setLinkOpen((open) => !open)}
            disabled={!activeProject}
          >
            <Link2 data-icon="inline-start" />
            {t('addLink')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={openHiDriveBrowser}
            disabled={!activeProject}
          >
            <Cloud data-icon="inline-start" />
            {t('addHiDrive')}
          </Button>
        </div>

        {linkOpen ? (
          <div className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row">
            <input
              value={linkValue}
              onChange={(event) => setLinkValue(event.target.value)}
              placeholder={t('addLinkPrompt')}
              className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <Button type="button" size="sm" onClick={onAddLink}>
              {t('addLink')}
            </Button>
          </div>
        ) : null}

        {browseOpen ? (
          <div className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{t('hidriveBrowseTitle')}</p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setBrowseOpen(false)}
              >
                {t('remove')}
              </Button>
            </div>
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {browsePath || '—'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={browseBusy || browsePath === '/' || !browsePath}
                onClick={() => void loadFolder(parentPath(browsePath))}
              >
                <FolderUp data-icon="inline-start" />
                {t('hidriveBrowseUp')}
              </Button>
            </div>
            {browseError ? (
              <p className="text-[11px] text-destructive">{browseError}</p>
            ) : null}
            {browseBusy ? (
              <p className="text-xs text-muted-foreground">…</p>
            ) : entries.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t('hidriveBrowseEmpty')}
              </p>
            ) : (
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {entries.map((entry) => (
                  <li key={entry.path}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/60"
                      onClick={() => attachHiDriveFile(entry)}
                    >
                      <span className="truncate">
                        {entry.isDir ? `[${entry.name}]` : entry.name}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {entry.isDir ? '→' : formatBytes(entry.sizeBytes)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {media.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('mediaEmpty')}</p>
        ) : (
          <ul className="space-y-2">
            {media.items.map((item) => {
              const source = item.sources[0]
              const sourceLabel = !source
                ? '—'
                : source.type === 'local'
                  ? t('sourceLocal')
                  : source.type === 'url'
                    ? t('sourceUrl')
                    : t('sourceCloud')
              return (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.fileName}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {sourceLabel} · {formatBytes(item.sizeBytes)}
                      {source ? ` · ${describeSource(source)}` : ''}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemove(item.id)}
                    aria-label={t('remove')}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        {!hasSyncData ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Cameras: {data.cameras.length}</li>
            <li>Anchors: {data.anchors.length}</li>
            <li>Clips: {data.clipOrder.length}</li>
          </ul>
        )}
      </section>
    </div>
  )
}
