import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type {
  AnalysisEvent,
  EventCategory,
  EventQuality,
  EventStrength,
  Player,
} from '@/shared'
import { PLAYER_POSITIONS, type PlayerPositionId } from '@/shared'
import {
  ERROR_TYPES,
  getCategoryDef,
  type ErrorTypeId,
} from '../events/catalog'

export type TagDraft = {
  category: EventCategory
  quality?: EventQuality
  errorType?: string
  strength?: EventStrength
  notloesung?: boolean
  playerId?: string | null
  playerInId?: string
  newRole?: string
  pointSide?: 'home' | 'away'
  opponentError?: boolean
}

type TagDialogProps = {
  open: boolean
  draft: TagDraft | null
  editEvent?: AnalysisEvent | null
  players: Player[]
  categoryLabel: (id: EventCategory) => string
  labels: {
    title: string
    quality: string
    errorType: string
    strength: string
    notloesung: string
    player: string
    playerOut: string
    playerIn: string
    role: string
    confirm: string
    cancel: string
    noPlayer: string
    opponentError: string
    qualityLabels: Record<EventQuality, string>
    errorLabels: Record<ErrorTypeId, string>
    strengthSoft: string
    strengthMax: string
    roleLabels: Record<PlayerPositionId, string>
    noLineup: string
  }
  onOpenChange: (open: boolean) => void
  onConfirm: (draft: TagDraft) => void
}

const STRENGTHS: EventStrength[] = [1, 2, 3, 4, 5]

export function TagDialog({
  open,
  draft: initial,
  editEvent,
  players,
  categoryLabel,
  labels,
  onOpenChange,
  onConfirm,
}: TagDialogProps) {
  const [draft, setDraft] = useState<TagDraft | null>(null)

  useEffect(() => {
    if (!open) {
      setDraft(null)
      return
    }
    if (editEvent) {
      setDraft({
        category: editEvent.category,
        quality: editEvent.quality,
        errorType: editEvent.errorType,
        strength: editEvent.strength,
        notloesung: editEvent.notloesung,
        playerId: editEvent.playerId,
        playerInId: editEvent.playerInId,
        newRole: editEvent.newRole,
        pointSide: editEvent.pointSide,
        opponentError: editEvent.label === 'gegnerfehler',
      })
      return
    }
    setDraft(initial)
  }, [open, initial, editEvent])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (!draft) return
      const def = getCategoryDef(draft.category)
      if (e.key === 'Escape') {
        onOpenChange(false)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        onConfirm(draft)
        return
      }
      if (def?.hasStrength && e.key >= '1' && e.key <= '5') {
        setDraft((d) =>
          d ? { ...d, strength: Number(e.key) as EventStrength } : d,
        )
        return
      }
      if (players.length > 0 && e.key >= '1' && e.key <= '9' && !def?.hasStrength) {
        const idx = Number(e.key) - 1
        if (players[idx]) {
          setDraft((d) => (d ? { ...d, playerId: players[idx].id } : d))
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, draft, players, onConfirm, onOpenChange])

  if (!draft) return null
  const def = getCategoryDef(draft.category)
  const isWechsel = draft.category === 'wechsel'
  const isPos = draft.category === 'positionswechsel'
  const isScoreHome = draft.category === 'score_home'
  const showQuality = Boolean(def?.qualities?.length)
  const showError =
    Boolean(def?.hasErrorType) &&
    (draft.quality === 'fehler' || draft.category === 'fehler')
  const showStrength = Boolean(def?.hasStrength)
  const showPlayer = !isWechsel && draft.category !== 'score_away'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>
            {labels.title}: {categoryLabel(draft.category)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {showQuality && def?.qualities ? (
            <fieldset className="space-y-1.5">
              <legend className="text-xs font-medium">{labels.quality}</legend>
              <div className="flex flex-wrap gap-1.5">
                {def.qualities.map((q) => (
                  <Button
                    key={q}
                    type="button"
                    size="sm"
                    variant={draft.quality === q ? 'default' : 'outline'}
                    onClick={() => setDraft({ ...draft, quality: q })}
                  >
                    {labels.qualityLabels[q]}
                  </Button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {showError ? (
            <fieldset className="space-y-1.5">
              <legend className="text-xs font-medium">{labels.errorType}</legend>
              <div className="flex flex-wrap gap-1.5">
                {ERROR_TYPES.map((err) => (
                  <Button
                    key={err}
                    type="button"
                    size="sm"
                    variant={draft.errorType === err ? 'default' : 'outline'}
                    onClick={() => setDraft({ ...draft, errorType: err })}
                  >
                    {labels.errorLabels[err]}
                  </Button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {showStrength ? (
            <fieldset className="space-y-1.5">
              <legend className="text-xs font-medium">{labels.strength}</legend>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">
                  {labels.strengthSoft}
                </span>
                {STRENGTHS.map((s) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant={draft.strength === s ? 'default' : 'outline'}
                    className="h-8 w-8 p-0"
                    onClick={() => setDraft({ ...draft, strength: s })}
                  >
                    {s}
                  </Button>
                ))}
                <span className="text-[11px] text-muted-foreground">
                  {labels.strengthMax}
                </span>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={Boolean(draft.notloesung)}
                  onCheckedChange={(v) =>
                    setDraft({ ...draft, notloesung: v === true })
                  }
                />
                {labels.notloesung}
              </label>
            </fieldset>
          ) : null}

          {isWechsel ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <PlayerPick
                label={labels.playerOut}
                players={players}
                value={draft.playerId ?? undefined}
                onChange={(id) => setDraft({ ...draft, playerId: id })}
                emptyHint={labels.noLineup}
              />
              <PlayerPick
                label={labels.playerIn}
                players={players}
                value={draft.playerInId}
                onChange={(id) => setDraft({ ...draft, playerInId: id })}
                emptyHint={labels.noLineup}
              />
            </div>
          ) : null}

          {isPos ? (
            <div className="space-y-3">
              <PlayerPick
                label={labels.player}
                players={players}
                value={draft.playerId ?? undefined}
                onChange={(id) => setDraft({ ...draft, playerId: id })}
                emptyHint={labels.noLineup}
              />
              <fieldset className="space-y-1.5">
                <legend className="text-xs font-medium">{labels.role}</legend>
                <div className="flex flex-wrap gap-1.5">
                  {PLAYER_POSITIONS.map((role) => (
                    <Button
                      key={role}
                      type="button"
                      size="sm"
                      variant={draft.newRole === role ? 'default' : 'outline'}
                      onClick={() => setDraft({ ...draft, newRole: role })}
                    >
                      {labels.roleLabels[role]}
                    </Button>
                  ))}
                </div>
              </fieldset>
            </div>
          ) : null}

          {showPlayer && !isPos ? (
            <div className="space-y-2">
              <PlayerPick
                label={labels.player}
                players={players}
                value={
                  draft.opponentError
                    ? undefined
                    : (draft.playerId ?? undefined)
                }
                onChange={(id) =>
                  setDraft({
                    ...draft,
                    playerId: id,
                    opponentError: false,
                  })
                }
                emptyHint={labels.noLineup}
                allowNone
                noneLabel={labels.noPlayer}
                noneSelected={draft.playerId === null && !draft.opponentError}
                onNone={() =>
                  setDraft({
                    ...draft,
                    playerId: null,
                    opponentError: false,
                  })
                }
              />
              {(isScoreHome ||
                draft.quality === 'punkt' ||
                draft.quality === 'kill' ||
                draft.quality === 'ass') && (
                <Button
                  type="button"
                  size="sm"
                  variant={draft.opponentError ? 'default' : 'outline'}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      opponentError: true,
                      playerId: null,
                    })
                  }
                >
                  {labels.opponentError}
                </Button>
              )}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {labels.cancel}
          </Button>
          <Button type="button" onClick={() => onConfirm(draft)}>
            {labels.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PlayerPick({
  label,
  players,
  value,
  onChange,
  emptyHint,
  allowNone,
  noneLabel,
  noneSelected,
  onNone,
}: {
  label: string
  players: Player[]
  value?: string
  onChange: (id: string) => void
  emptyHint: string
  allowNone?: boolean
  noneLabel?: string
  noneSelected?: boolean
  onNone?: () => void
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-xs font-medium">{label}</legend>
      {players.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">{emptyHint}</p>
      ) : (
        <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          {allowNone && onNone && noneLabel ? (
            <Button
              type="button"
              size="sm"
              variant={noneSelected ? 'default' : 'outline'}
              onClick={onNone}
            >
              {noneLabel}
            </Button>
          ) : null}
          {players.map((p, i) => (
            <Button
              key={p.id}
              type="button"
              size="sm"
              variant={value === p.id ? 'default' : 'outline'}
              onClick={() => onChange(p.id)}
            >
              <span className="font-mono text-[10px] opacity-60">{i + 1}</span>
              #{p.number} {p.name}
            </Button>
          ))}
        </div>
      )}
    </fieldset>
  )
}
