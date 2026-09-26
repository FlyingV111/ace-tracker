import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { Cloud, Download, FolderUp, Link2, Trash2, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  addMediaItem,
  createEmptyMediaManifest,
  createEmptyVideoAnalysisDocument,
  createId,
  describeSource,
  formatBytes,
  mediaFromLocalFile,
  mediaFromUrl,
  removeMediaItem,
  useToolStore,
  useWorkspace,
  type AnalysisEvent,
  type EventCategory,
  type EventQuality,
  type MediaAsset,
  type Player,
  type PlayerPositionId,
  type VideoAnalysisDocument,
} from '@/shared'
import {
  downloadHiDriveFile,
  listHiDriveFolder,
  mediaFromHiDriveFile,
  type HiDriveRemoteEntry,
} from '@/shared/cloud/hidrive-api'
import { ToolPageHeader } from '@/components/layout/ToolPageHeader'
import { useVideoAnalysisI18n } from '../locales/use-i18n'
import { ActionPalette } from '../components/ActionPalette'
import { ClipSwitcher } from '../components/ClipSwitcher'
import { EventList } from '../components/EventList'
import { Scoreboard } from '../components/Scoreboard'
import { TagDialog, type TagDraft } from '../components/TagDialog'
import { VideoPlayer } from '../components/VideoPlayer'
import {
  categoryFromShortcut,
  getCategoryDef,
  type ErrorTypeId,
} from '../events/catalog'
import { resolvePlaybackUrl } from '../events/media-url'

const SEEK_NEAR_MS = 800

export function VideoAnalysisPage() {
  const { activeProject, activeWorkspace, setProjectMedia, settings } =
    useWorkspace()
  const [doc, setDoc] = useToolStore('video-analysis')
  const t = useVideoAnalysisI18n()
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkValue, setLinkValue] = useState('')
  const [browseOpen, setBrowseOpen] = useState(false)
  const [browsePath, setBrowsePath] = useState('')
  const [entries, setEntries] = useState<HiDriveRemoteEntry[]>([])
  const [browseError, setBrowseError] = useState<string | null>(null)
  const [browseBusy, setBrowseBusy] = useState(false)
  const [downloadId, setDownloadId] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null)
  const [resolving, setResolving] = useState(false)
  const [resolveError, setResolveError] = useState<string | null>(null)
  const [timeMs, setTimeMs] = useState(0)
  const [seekToMs, setSeekToMs] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tagDraft, setTagDraft] = useState<TagDraft | null>(null)
  const [editEvent, setEditEvent] = useState<AnalysisEvent | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const dialogOpenRef = useRef(false)
  dialogOpenRef.current = dialogOpen

  const rawDoc = doc ?? activeProject?.tools['video-analysis']
  const data = useMemo(
    () => createEmptyVideoAnalysisDocument(rawDoc),
    [rawDoc],
  )
  const media = activeProject?.media ?? createEmptyMediaManifest()
  const hidrive = settings.hidrive

  const updateDoc = useCallback(
    (fn: (prev: VideoAnalysisDocument) => VideoAnalysisDocument) => {
      setDoc((prev) => fn(createEmptyVideoAnalysisDocument(prev)))
    },
    [setDoc],
  )

  const activeMediaId = data?.activeMediaId ?? null
  const activeAsset =
    media.items.find((item) => item.id === activeMediaId) ?? null

  const homeLineupPlayers = useMemo(() => {
    const tracker = activeProject?.tools['player-tracker']
    const workspaceSquad = activeWorkspace?.squad ?? []
    const matchSquad = tracker?.squad ?? activeProject?.project.squad ?? []
    const lineups = tracker?.lineups ??
      activeProject?.project.lineups ?? { home: [], away: [] }
    const byId = new Map<string, Player>()
    for (const p of matchSquad) byId.set(p.id, p)
    for (const p of workspaceSquad) {
      if (!byId.has(p.id)) byId.set(p.id, p)
    }
    return lineups.home
      .map((slot) => byId.get(slot.playerId))
      .filter((p): p is Player => Boolean(p))
  }, [activeProject, activeWorkspace])

  const playersById = useMemo(() => {
    const map = new Map<string, Player>()
    for (const p of homeLineupPlayers) map.set(p.id, p)
    const tracker = activeProject?.tools['player-tracker']
    const matchSquad = tracker?.squad ?? activeProject?.project.squad ?? []
    for (const p of matchSquad) map.set(p.id, p)
    for (const p of activeWorkspace?.squad ?? []) map.set(p.id, p)
    return map
  }, [homeLineupPlayers, activeProject, activeWorkspace])

  useEffect(() => {
    if (!activeAsset) {
      setPlaybackUrl(null)
      setResolveError(null)
      return
    }
    let cancelled = false
    setResolving(true)
    setResolveError(null)
    void resolvePlaybackUrl(activeAsset, hidrive).then((result) => {
      if (cancelled) return
      setResolving(false)
      if (!result.url) {
        setPlaybackUrl(null)
        setResolveError(t('resolveError'))
        return
      }
      setPlaybackUrl(result.url)
    })
    return () => {
      cancelled = true
    }
  }, [activeAsset, hidrive, t])

  useEffect(() => {
    if (!data || media.items.length === 0) return
    if (data.activeMediaId && media.items.some((i) => i.id === data.activeMediaId)) {
      return
    }
    updateDoc((prev) => ({
      ...prev,
      activeMediaId: media.items[0]?.id ?? null,
      clipOrder:
        prev.clipOrder.length > 0
          ? prev.clipOrder
          : media.items.map((i) => i.id),
    }))
  }, [data, media.items, updateDoc])

  function persistMedia(next: ReturnType<typeof createEmptyMediaManifest>) {
    if (!activeProject) return
    setProjectMedia(activeProject.project.id, next)
  }

  function onPickLocal(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    const asset = mediaFromLocalFile(file)
    persistMedia(addMediaItem(media, asset))
    updateDoc((prev) => ({
      ...prev,
      activeMediaId: asset.id,
      clipOrder: [...prev.clipOrder.filter((id) => id !== asset.id), asset.id],
    }))
    if (fileRef.current) fileRef.current.value = ''
  }

  function onAddLink() {
    const url = linkValue.trim()
    if (!url) return
    const asset = mediaFromUrl(url)
    persistMedia(addMediaItem(media, asset))
    updateDoc((prev) => ({
      ...prev,
      activeMediaId: asset.id,
      clipOrder: [...prev.clipOrder, asset.id],
    }))
    setLinkValue('')
    setLinkOpen(false)
  }

  function onRemove(id: string) {
    persistMedia(removeMediaItem(media, id))
    updateDoc((prev) => ({
      ...prev,
      activeMediaId: prev.activeMediaId === id ? null : prev.activeMediaId,
      clipOrder: prev.clipOrder.filter((cid) => cid !== id),
      events: prev.events.filter((e) => e.mediaId !== id),
      clipMeta: Object.fromEntries(
        Object.entries(prev.clipMeta).filter(([key]) => key !== id),
      ),
    }))
  }

  async function onDownloadCloud(
    itemId: string,
    remoteId: string,
    fileName: string,
  ) {
    if (!hidrive.connected) {
      setDownloadError(t('downloadCloudNeedConnect'))
      return
    }
    setDownloadId(itemId)
    setDownloadError(null)
    try {
      const result = await downloadHiDriveFile(hidrive, remoteId, fileName)
      if (!result.ok) {
        setDownloadError(result.error || t('downloadCloudError'))
        return
      }
      const open = window.electronAPI?.openPath
      if (open) {
        const opened = await open(result.localPath)
        if (!opened.ok) {
          setDownloadError(opened.error || t('downloadCloudError'))
        }
      }
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : t('downloadCloudError'),
      )
    } finally {
      setDownloadId(null)
    }
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
    const asset = mediaFromHiDriveFile({
      remotePath: entry.path,
      fileName: entry.name,
      sizeBytes: entry.sizeBytes,
      shareUrl: hidrive.shareUrl || undefined,
    })
    persistMedia(addMediaItem(media, asset))
    updateDoc((prev) => ({
      ...prev,
      activeMediaId: asset.id,
      clipOrder: [...prev.clipOrder, asset.id],
    }))
    setBrowseOpen(false)
  }

  const categoryLabel = useCallback(
    (id: EventCategory): string => {
      const map: Record<EventCategory, string> = {
        angriff: t('catAngriff'),
        block: t('catBlock'),
        annahme: t('catAnnahme'),
        rettung: t('catRettung'),
        abwehr: t('catAbwehr'),
        aufschlag: t('catAufschlag'),
        zuspiel: t('catZuspiel'),
        freeball: t('catFreeball'),
        touch: t('catTouch'),
        netz: t('catNetz'),
        aus: t('catAus'),
        fehler: t('catFehler'),
        wechsel: t('catWechsel'),
        positionswechsel: t('catPositionswechsel'),
        auszeit: t('catAuszeit'),
        satzbeginn: t('catSatzbeginn'),
        satzende: t('catSatzende'),
        highlight: t('catHighlight'),
        score_home: t('catScoreHome'),
        score_away: t('catScoreAway'),
      }
      return map[id]
    },
    [t],
  )

  const qualityLabel = useCallback(
    (q: EventQuality): string => {
      const map: Record<EventQuality, string> = {
        gut: t('qualityGut'),
        mittel: t('qualityMittel'),
        schlecht: t('qualitySchlecht'),
        fehler: t('qualityFehler'),
        kill: t('qualityKill'),
        ass: t('qualityAss'),
        punkt: t('qualityPunkt'),
      }
      return map[q]
    },
    [t],
  )

  const appendEvent = useCallback(
    (event: AnalysisEvent) => {
      updateDoc((prev) => ({
        ...prev,
        events: [...prev.events, event],
      }))
    },
    [updateDoc],
  )

  const commitTag = useCallback(
    (draft: TagDraft) => {
      if (!activeMediaId) return
      const pointSide =
        draft.pointSide ??
        (draft.quality === 'punkt' ||
        draft.quality === 'kill' ||
        draft.quality === 'ass' ||
        draft.category === 'score_home'
          ? 'home'
          : draft.category === 'score_away'
            ? 'away'
            : undefined)

      const at = Math.round(timeMs)

      if (editEvent) {
        updateDoc((prev) => ({
          ...prev,
          events: prev.events.map((e) =>
            e.id === editEvent.id
              ? {
                  ...e,
                  category: draft.category,
                  quality: draft.quality,
                  errorType: draft.errorType,
                  strength: draft.strength,
                  notloesung: draft.notloesung,
                  playerId: draft.opponentError ? null : draft.playerId,
                  playerInId: draft.playerInId,
                  newRole: draft.newRole,
                  pointSide,
                  label: draft.opponentError ? 'gegnerfehler' : e.label,
                }
              : e,
          ),
        }))
      } else {
        const event: AnalysisEvent = {
          id: createId(),
          mediaId: activeMediaId,
          timeMs: at,
          category: draft.category,
          quality: draft.quality,
          errorType: draft.errorType,
          strength: draft.strength,
          notloesung: draft.notloesung,
          playerId: draft.opponentError ? null : draft.playerId,
          playerInId: draft.playerInId,
          newRole: draft.newRole,
          teamSide: 'home',
          pointSide,
          label: draft.opponentError ? 'gegnerfehler' : undefined,
        }
        updateDoc((prev) => {
          const next = {
            ...prev,
            events: [...prev.events, event],
          }
          if (draft.category === 'score_home') {
            const home = prev.score.home + 1
            return {
              ...next,
              score: { ...prev.score, home },
              scoreHistory: [
                ...prev.scoreHistory,
                {
                  timeMs: at,
                  home,
                  away: prev.score.away,
                  reason: 'home',
                },
              ],
            }
          }
          return next
        })
      }
      setDialogOpen(false)
      setTagDraft(null)
      setEditEvent(null)
    },
    [activeMediaId, editEvent, timeMs, updateDoc],
  )

  const startCategory = useCallback(
    (category: EventCategory) => {
      if (!activeMediaId) return
      const def = getCategoryDef(category)
      if (!def) return
      if (def.instant || !def.needsDialog) {
        appendEvent({
          id: createId(),
          mediaId: activeMediaId,
          timeMs: Math.round(timeMs),
          category,
          highlight: category === 'highlight',
          teamSide: 'home',
        })
        return
      }
      setEditEvent(null)
      setTagDraft({ category })
      setDialogOpen(true)
    },
    [activeMediaId, appendEvent, timeMs],
  )

  const toggleHighlightAtPlayhead = useCallback(() => {
    if (!activeMediaId || !data) return
    const near = data.events.find(
      (e) =>
        e.mediaId === activeMediaId &&
        Math.abs(e.timeMs - timeMs) <= SEEK_NEAR_MS,
    )
    if (near) {
      updateDoc((prev) => ({
        ...prev,
        events: prev.events.map((e) =>
          e.id === near.id ? { ...e, highlight: !e.highlight } : e,
        ),
      }))
      return
    }
    appendEvent({
      id: createId(),
      mediaId: activeMediaId,
      timeMs: Math.round(timeMs),
      category: 'highlight',
      highlight: true,
    })
  }, [activeMediaId, appendEvent, data, timeMs, updateDoc])

  const undoLast = useCallback(() => {
    if (!activeMediaId) return
    updateDoc((prev) => {
      let lastIndex = -1
      for (let i = prev.events.length - 1; i >= 0; i--) {
        if (prev.events[i].mediaId === activeMediaId) {
          lastIndex = i
          break
        }
      }
      if (lastIndex < 0) return prev
      const removed = prev.events[lastIndex]
      const events = prev.events.filter((_, i) => i !== lastIndex)
      let score = prev.score
      let scoreHistory = prev.scoreHistory
      if (removed.category === 'score_home') {
        score = { ...score, home: Math.max(0, score.home - 1) }
        scoreHistory = scoreHistory.slice(0, -1)
      } else if (removed.category === 'score_away') {
        score = { ...score, away: Math.max(0, score.away - 1) }
        scoreHistory = scoreHistory.slice(0, -1)
      }
      return { ...prev, events, score, scoreHistory }
    })
  }, [activeMediaId, updateDoc])

  const onHomeDelta = useCallback(
    (delta: 1 | -1) => {
      if (!activeMediaId) return
      if (delta === 1) {
        setEditEvent(null)
        setTagDraft({ category: 'score_home', pointSide: 'home' })
        setDialogOpen(true)
        return
      }
      updateDoc((prev) => ({
        ...prev,
        score: { ...prev.score, home: Math.max(0, prev.score.home - 1) },
      }))
    },
    [activeMediaId, updateDoc],
  )

  const onAwayDelta = useCallback(
    (delta: 1 | -1) => {
      if (!activeMediaId) return
      const at = Math.round(timeMs)
      if (delta === 1) {
        updateDoc((prev) => {
          const away = prev.score.away + 1
          return {
            ...prev,
            events: [
              ...prev.events,
              {
                id: createId(),
                mediaId: activeMediaId,
                timeMs: at,
                category: 'score_away',
                pointSide: 'away',
                teamSide: 'away',
              },
            ],
            score: { ...prev.score, away },
            scoreHistory: [
              ...prev.scoreHistory,
              {
                timeMs: at,
                home: prev.score.home,
                away,
                reason: 'away',
              },
            ],
          }
        })
        return
      }
      updateDoc((prev) => ({
        ...prev,
        score: { ...prev.score, away: Math.max(0, prev.score.away - 1) },
      }))
    },
    [activeMediaId, timeMs, updateDoc],
  )

  const onNextSet = useCallback(() => {
    if (!activeMediaId) return
    const at = Math.round(timeMs)
    updateDoc((prev) => {
      const homeWins = prev.score.home > prev.score.away
      return {
        ...prev,
        events: [
          ...prev.events,
          {
            id: createId(),
            mediaId: activeMediaId,
            timeMs: at,
            category: 'satzende',
          },
          {
            id: createId(),
            mediaId: activeMediaId,
            timeMs: at + 1,
            category: 'satzbeginn',
          },
        ],
        score: {
          set: prev.score.set + 1,
          home: 0,
          away: 0,
          setsHome: prev.score.setsHome + (homeWins ? 1 : 0),
          setsAway: prev.score.setsAway + (homeWins ? 0 : 1),
        },
      }
    })
  }, [activeMediaId, timeMs, updateDoc])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (dialogOpenRef.current) return
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        const v = videoRef.current
        if (!v) return
        if (v.paused) void v.play()
        else v.pause()
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const v = videoRef.current
        if (v) v.currentTime = Math.max(0, v.currentTime - (e.shiftKey ? 5 : 1))
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        const v = videoRef.current
        if (v) v.currentTime = v.currentTime + (e.shiftKey ? 5 : 1)
        return
      }
      if (e.key === '[' || e.key === ',') {
        e.preventDefault()
        setSelectedIndex((i) => {
          const next = Math.max(0, i - 1)
          const list = (data?.events ?? [])
            .filter((ev) => ev.mediaId === activeMediaId)
            .sort((a, b) => b.timeMs - a.timeMs)
          const event = list[next]
          if (event) {
            setSeekToMs(event.timeMs)
            setTimeMs(event.timeMs)
          }
          return next
        })
        return
      }
      if (e.key === ']' || e.key === '.') {
        e.preventDefault()
        setSelectedIndex((i) => {
          const list = (data?.events ?? [])
            .filter((ev) => ev.mediaId === activeMediaId)
            .sort((a, b) => b.timeMs - a.timeMs)
          const next = Math.min(list.length - 1, i + 1)
          const event = list[Math.max(0, next)]
          if (event) {
            setSeekToMs(event.timeMs)
            setTimeMs(event.timeMs)
          }
          return Math.max(0, next)
        })
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undoLast()
        return
      }
      if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        toggleHighlightAtPlayhead()
        return
      }
      const cat = categoryFromShortcut(e.key)
      if (cat && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        startCategory(cat.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    activeMediaId,
    data?.events,
    startCategory,
    toggleHighlightAtPlayhead,
    undoLast,
  ])

  const homeName =
    activeProject?.project.teams.home.shortName ||
    activeProject?.project.teams.home.name ||
    t('scoreHome')
  const awayName =
    activeProject?.project.teams.away.shortName ||
    activeProject?.project.teams.away.name ||
    t('scoreAway')

  const score = data?.score ?? {
    set: 1,
    home: 0,
    away: 0,
    setsHome: 0,
    setsAway: 0,
  }

  return (
    <div className="space-y-6">
      <ToolPageHeader title={t('title')} description={t('description')} />

      <MediaSection
        t={t}
        fileRef={fileRef}
        activeProject={Boolean(activeProject)}
        media={media}
        linkOpen={linkOpen}
        linkValue={linkValue}
        setLinkOpen={setLinkOpen}
        setLinkValue={setLinkValue}
        onPickLocal={onPickLocal}
        onAddLink={onAddLink}
        onRemove={onRemove}
        browseOpen={browseOpen}
        browsePath={browsePath}
        entries={entries}
        browseError={browseError}
        browseBusy={browseBusy}
        setBrowseOpen={setBrowseOpen}
        openHiDriveBrowser={openHiDriveBrowser}
        loadFolder={loadFolder}
        parentPath={parentPath}
        attachHiDriveFile={attachHiDriveFile}
        downloadError={downloadError}
        downloadId={downloadId}
        onDownloadCloud={onDownloadCloud}
      />

      <ClipSwitcher
        items={media.items}
        activeMediaId={activeMediaId}
        clipMeta={data?.clipMeta ?? {}}
        labels={{
          title: t('clipsTitle'),
          active: t('clipActive'),
          done: t('clipDone'),
          open: t('clipOpen'),
        }}
        onSelect={(id) =>
          updateDoc((prev) => ({ ...prev, activeMediaId: id }))
        }
        onToggleDone={(id, done) =>
          updateDoc((prev) => ({
            ...prev,
            clipMeta: {
              ...prev.clipMeta,
              [id]: { analysisDone: done },
            },
          }))
        }
      />

      {media.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('pickClip')}</p>
      ) : (
        <>
          <VideoPlayer
            src={playbackUrl}
            resolving={resolving}
            error={resolveError}
            score={score}
            homeLabel={homeName}
            awayLabel={awayName}
            onTimeMs={setTimeMs}
            seekToMs={seekToMs}
            videoRef={videoRef}
          />

          <Scoreboard
            score={score}
            homeName={homeName}
            awayName={awayName}
            labels={{
              set: t('scoreSet'),
              sets: t('scoreSets'),
              plus: t('scorePlus'),
              minus: t('scoreMinus'),
              nextSet: t('scoreNextSet'),
            }}
            onHomeDelta={onHomeDelta}
            onAwayDelta={onAwayDelta}
            onNextSet={onNextSet}
          />

          <ActionPalette
            labelFor={categoryLabel}
            groupLabels={{
              skills: t('actionsSkills'),
              markers: t('actionsMarkers'),
              phases: t('actionsPhases'),
            }}
            highlightLabel={t('highlightToggle')}
            onAction={startCategory}
            onHighlight={toggleHighlightAtPlayhead}
            disabled={!activeMediaId || Boolean(resolveError)}
          />

          <EventList
            events={data?.events ?? []}
            mediaId={activeMediaId}
            playersById={playersById}
            categoryLabel={categoryLabel}
            qualityLabel={qualityLabel}
            labels={{
              title: t('eventsTitle'),
              empty: t('eventsEmpty'),
              search: t('eventsSearch'),
              filterAll: t('filterAll'),
              filterHighlights: t('filterHighlights'),
              filterAction: t('filterAction'),
              filterPlayer: t('filterPlayer'),
              filterQuality: t('filterQuality'),
              noPlayer: t('noPlayer'),
              missingPlayer: t('missingPlayer'),
              deleteEvent: t('deleteEvent'),
              editEvent: t('editEvent'),
              jumpEvent: t('jumpEvent'),
              toggleHighlight: t('toggleHighlight'),
              assignPlayer: t('assignPlayer'),
              undo: t('undo'),
            }}
            selectedIndex={selectedIndex}
            onSelectIndex={(index) => {
              setSelectedIndex(index)
              const list = (data?.events ?? [])
                .filter((e) => e.mediaId === activeMediaId)
                .sort((a, b) => b.timeMs - a.timeMs)
              const event = list[index]
              if (event) {
                setSeekToMs(event.timeMs)
                setTimeMs(event.timeMs)
              }
            }}
            onJump={(event) => {
              setSeekToMs(event.timeMs)
              setTimeMs(event.timeMs)
            }}
            onDelete={(id) =>
              updateDoc((prev) => ({
                ...prev,
                events: prev.events.filter((e) => e.id !== id),
              }))
            }
            onToggleHighlight={(id) =>
              updateDoc((prev) => ({
                ...prev,
                events: prev.events.map((e) =>
                  e.id === id ? { ...e, highlight: !e.highlight } : e,
                ),
              }))
            }
            onEdit={(event) => {
              setEditEvent(event)
              setTagDraft(null)
              setDialogOpen(true)
            }}
            onAssignPlayer={(event) => {
              setEditEvent(event)
              setTagDraft(null)
              setDialogOpen(true)
            }}
            onUndo={undoLast}
          />
        </>
      )}

      <TagDialog
        open={dialogOpen}
        draft={tagDraft}
        editEvent={editEvent}
        players={homeLineupPlayers}
        categoryLabel={categoryLabel}
        labels={{
          title: t('dialogTitle'),
          quality: t('dialogQuality'),
          errorType: t('dialogErrorType'),
          strength: t('dialogStrength'),
          notloesung: t('dialogNotloesung'),
          player: t('dialogPlayer'),
          playerOut: t('dialogPlayerOut'),
          playerIn: t('dialogPlayerIn'),
          role: t('dialogRole'),
          confirm: t('dialogConfirm'),
          cancel: t('dialogCancel'),
          noPlayer: t('noPlayer'),
          opponentError: t('opponentError'),
          qualityLabels: {
            gut: t('qualityGut'),
            mittel: t('qualityMittel'),
            schlecht: t('qualitySchlecht'),
            fehler: t('qualityFehler'),
            kill: t('qualityKill'),
            ass: t('qualityAss'),
            punkt: t('qualityPunkt'),
          },
          errorLabels: {
            netz: t('errorNetz'),
            aus: t('errorAus'),
            doppelberuehrung: t('errorDoppel'),
            uebertritt: t('errorUebertritt'),
            sonstig: t('errorSonstig'),
          } satisfies Record<ErrorTypeId, string>,
          strengthSoft: t('strengthSoft'),
          strengthMax: t('strengthMax'),
          roleLabels: {
            outside: t('posOutside'),
            opposite: t('posOpposite'),
            middle: t('posMiddle'),
            setter: t('posSetter'),
            libero: t('posLibero'),
            universal: t('posUniversal'),
          } satisfies Record<PlayerPositionId, string>,
          noLineup: t('noLineup'),
        }}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setTagDraft(null)
            setEditEvent(null)
          }
        }}
        onConfirm={commitTag}
      />
    </div>
  )
}

type MediaSectionProps = {
  t: (key: string) => string
  fileRef: RefObject<HTMLInputElement | null>
  activeProject: boolean
  media: { items: MediaAsset[] }
  linkOpen: boolean
  linkValue: string
  setLinkOpen: (v: boolean | ((b: boolean) => boolean)) => void
  setLinkValue: (v: string) => void
  onPickLocal: (files: FileList | null) => void
  onAddLink: () => void
  onRemove: (id: string) => void
  browseOpen: boolean
  browsePath: string
  entries: HiDriveRemoteEntry[]
  browseError: string | null
  browseBusy: boolean
  setBrowseOpen: (v: boolean) => void
  openHiDriveBrowser: () => void
  loadFolder: (path: string) => Promise<void>
  parentPath: (path: string) => string
  attachHiDriveFile: (entry: HiDriveRemoteEntry) => void
  downloadError: string | null
  downloadId: string | null
  onDownloadCloud: (
    itemId: string,
    remoteId: string,
    fileName: string,
  ) => Promise<void>
}

function MediaSection({
  t,
  fileRef,
  activeProject,
  media,
  linkOpen,
  linkValue,
  setLinkOpen,
  setLinkValue,
  onPickLocal,
  onAddLink,
  onRemove,
  browseOpen,
  browsePath,
  entries,
  browseError,
  browseBusy,
  setBrowseOpen,
  openHiDriveBrowser,
  loadFolder,
  parentPath,
  attachHiDriveFile,
  downloadError,
  downloadId,
  onDownloadCloud,
}: MediaSectionProps) {
  return (
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
          <Input
            value={linkValue}
            onChange={(event) => setLinkValue(event.target.value)}
            placeholder={t('addLinkPrompt')}
            className="h-9 min-w-0 flex-1"
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
            {browsePath || '-'}
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

      {downloadError ? (
        <p className="text-[11px] text-destructive">{downloadError}</p>
      ) : null}

      {media.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('mediaEmpty')}</p>
      ) : (
        <ul className="space-y-2">
          {media.items.map((item) => {
            const source = item.sources[0]
            const sourceLabel = !source
              ? '-'
              : source.type === 'local'
                ? t('sourceLocal')
                : source.type === 'url'
                  ? t('sourceUrl')
                  : t('sourceCloud')
            const canDownload =
              source?.type === 'cloud' &&
              source.connectorId === 'hidrive' &&
              Boolean(source.remoteId)
            return (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.fileName}</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {sourceLabel} · {formatBytes(item.sizeBytes)}
                    {source ? ` · ${describeSource(source)}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {canDownload ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={downloadId === item.id}
                      onClick={() =>
                        void onDownloadCloud(
                          item.id,
                          source.remoteId!,
                          item.fileName,
                        )
                      }
                      aria-label={t('downloadCloud')}
                    >
                      <Download className="size-3.5" />
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemove(item.id)}
                    aria-label={t('remove')}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
