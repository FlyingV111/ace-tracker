import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Star,
  Trash2,
  Undo2,
  UserRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  AnalysisEvent,
  EventCategory,
  EventQuality,
  Player,
} from '@/shared'
import { formatTimecode, getCategoryDef } from '../events/catalog'

type EventListProps = {
  events: AnalysisEvent[]
  mediaId: string | null
  playersById: Map<string, Player>
  categoryLabel: (id: EventCategory) => string
  qualityLabel: (q: EventQuality) => string
  labels: {
    title: string
    empty: string
    search: string
    filterAll: string
    filterHighlights: string
    filterAction: string
    filterPlayer: string
    filterQuality: string
    noPlayer: string
    missingPlayer: string
    deleteEvent: string
    editEvent: string
    jumpEvent: string
    toggleHighlight: string
    assignPlayer: string
    undo: string
  }
  onJump: (event: AnalysisEvent) => void
  onDelete: (id: string) => void
  onToggleHighlight: (id: string) => void
  onEdit: (event: AnalysisEvent) => void
  onAssignPlayer: (event: AnalysisEvent) => void
  onUndo: () => void
  onSelectIndex: (index: number) => void
  selectedIndex: number
}

export function EventList({
  events,
  mediaId,
  playersById,
  categoryLabel,
  qualityLabel,
  labels,
  onJump,
  onDelete,
  onToggleHighlight,
  onEdit,
  onAssignPlayer,
  onUndo,
  onSelectIndex,
  selectedIndex,
}: EventListProps) {
  const [search, setSearch] = useState('')
  const [onlyHighlights, setOnlyHighlights] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPlayer, setFilterPlayer] = useState<string>('all')
  const [filterQuality, setFilterQuality] = useState<string>('all')

  const scoped = useMemo(() => {
    const list = mediaId
      ? events.filter((e) => e.mediaId === mediaId)
      : events
    return [...list].sort((a, b) => b.timeMs - a.timeMs)
  }, [events, mediaId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return scoped.filter((e) => {
      if (onlyHighlights && !e.highlight) return false
      if (filterCategory !== 'all' && e.category !== filterCategory) return false
      if (filterQuality !== 'all' && e.quality !== filterQuality) return false
      if (filterPlayer === 'missing') {
        if (e.playerId || e.category === 'highlight' || e.category === 'score_away')
          return false
        if (
          e.category === 'auszeit' ||
          e.category === 'satzbeginn' ||
          e.category === 'satzende'
        )
          return false
      } else if (filterPlayer !== 'all' && e.playerId !== filterPlayer) {
        return false
      }
      if (!q) return true
      const player = e.playerId ? playersById.get(e.playerId) : null
      const hay = [
        categoryLabel(e.category),
        e.quality ?? '',
        e.errorType ?? '',
        player?.name ?? '',
        String(player?.number ?? ''),
        e.label ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [
    scoped,
    onlyHighlights,
    filterCategory,
    filterPlayer,
    filterQuality,
    search,
    playersById,
    categoryLabel,
  ])

  const categories = useMemo(() => {
    const set = new Set(scoped.map((e) => e.category))
    return [...set]
  }, [scoped])

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{labels.title}</h2>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={filtered.length === 0}
            onClick={() =>
              onSelectIndex(Math.min(selectedIndex + 1, filtered.length - 1))
            }
            aria-label="prev"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={filtered.length === 0}
            onClick={() => onSelectIndex(Math.max(selectedIndex - 1, 0))}
            aria-label="next"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onUndo}>
            <Undo2 data-icon="inline-start" className="size-3.5" />
            {labels.undo}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={labels.search}
          className="h-8 max-w-xs"
        />
        <Button
          type="button"
          size="sm"
          variant={onlyHighlights ? 'default' : 'outline'}
          onClick={() => setOnlyHighlights((v) => !v)}
        >
          <Star data-icon="inline-start" className="size-3.5" />
          {labels.filterHighlights}
        </Button>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue placeholder={labels.filterAction} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{labels.filterAll}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {categoryLabel(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPlayer} onValueChange={setFilterPlayer}>
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue placeholder={labels.filterPlayer} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{labels.filterAll}</SelectItem>
            <SelectItem value="missing">{labels.missingPlayer}</SelectItem>
            {[...playersById.values()].map((p) => (
              <SelectItem key={p.id} value={p.id}>
                #{p.number} {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterQuality} onValueChange={setFilterQuality}>
          <SelectTrigger className="h-8 w-[120px]">
            <SelectValue placeholder={labels.filterQuality} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{labels.filterAll}</SelectItem>
            {(
              [
                'gut',
                'mittel',
                'schlecht',
                'fehler',
                'kill',
                'ass',
                'punkt',
              ] as EventQuality[]
            ).map((q) => (
              <SelectItem key={q} value={q}>
                {qualityLabel(q)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{labels.empty}</p>
      ) : (
        <ul className="max-h-[28rem] space-y-1 overflow-y-auto">
          {filtered.map((event, index) => {
            const def = getCategoryDef(event.category)
            const player = event.playerId
              ? playersById.get(event.playerId)
              : null
            const needsPlayer =
              !event.playerId &&
              event.category !== 'highlight' &&
              event.category !== 'score_away' &&
              event.category !== 'auszeit' &&
              event.category !== 'satzbeginn' &&
              event.category !== 'satzende' &&
              event.label !== 'gegnerfehler'
            const selected = index === selectedIndex
            const pointClass =
              event.pointSide === 'home'
                ? 'bg-emerald-500/10'
                : event.pointSide === 'away'
                  ? 'bg-rose-500/10'
                  : ''

            return (
              <li
                key={event.id}
                className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 ${
                  selected ? 'border-foreground/40' : 'border-border'
                } ${pointClass} ${needsPlayer ? 'ring-1 ring-amber-500/50' : ''}`}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    onSelectIndex(index)
                    onJump(event)
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {formatTimecode(event.timeMs)}
                    </span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
                      style={{ backgroundColor: def?.color ?? '#666' }}
                    >
                      {categoryLabel(event.category)}
                    </span>
                    {event.quality ? (
                      <span className="text-[11px] text-muted-foreground">
                        {qualityLabel(event.quality)}
                      </span>
                    ) : null}
                    {event.strength ? (
                      <span className="text-[11px] text-muted-foreground">
                        ⚡{event.strength}
                      </span>
                    ) : null}
                    {event.highlight ? (
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                    ) : null}
                  </div>
                  <p
                    className={`mt-0.5 text-xs ${
                      needsPlayer
                        ? 'font-medium text-amber-700 dark:text-amber-400'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {player
                      ? `#${player.number} ${player.name}`
                      : event.label === 'gegnerfehler'
                        ? labels.noPlayer
                        : needsPlayer
                          ? labels.missingPlayer
                          : labels.noPlayer}
                  </p>
                </button>
                <div className="flex shrink-0 gap-0.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => onToggleHighlight(event.id)}
                    aria-label={labels.toggleHighlight}
                  >
                    <Star
                      className={`size-3.5 ${
                        event.highlight
                          ? 'fill-amber-400 text-amber-400'
                          : ''
                      }`}
                    />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => onAssignPlayer(event)}
                    aria-label={labels.assignPlayer}
                  >
                    <UserRound className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => onEdit(event)}
                    aria-label={labels.editEvent}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => onDelete(event.id)}
                    aria-label={labels.deleteEvent}
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
