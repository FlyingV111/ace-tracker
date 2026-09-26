import { useMemo, useState, type SubmitEvent } from 'react'
import { Plus, Trash2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToolPageHeader } from '@/components/layout/ToolPageHeader'
import {
  PLAYER_POSITIONS,
  createPlayer,
  isPlayerPositionId,
  useWorkspace,
  type LineupSlot,
  type Player,
  type PlayerPositionId,
} from '@/shared'
import { usePlayerTrackerI18n } from '../locales/use-i18n'
import { useLocales } from '@/locales'
import { squadMessages } from '@/locales/pages/squad'

type Side = 'home' | 'away'

type TempDraft = {
  name: string
  number: string
  position: string
  side: Side
}

function emptyTemp(): TempDraft {
  return { name: '', number: '', position: '', side: 'home' }
}

export function PlayerTrackerPage() {
  const { activeWorkspace, activeProject, navigate, updatePlayerTracker } =
    useWorkspace()
  const t = usePlayerTrackerI18n()
  const ts = useLocales(squadMessages)
  const [temp, setTemp] = useState<TempDraft>(emptyTemp)
  const [tempOpen, setTempOpen] = useState(false)

  const workspaceSquad = activeWorkspace?.squad ?? []
  const tracker = activeProject?.tools['player-tracker']
  const matchSquad = tracker?.squad ?? activeProject?.project.squad ?? []
  const lineups = tracker?.lineups ??
    activeProject?.project.lineups ?? { home: [], away: [] }

  const playersById = useMemo(() => {
    const map = new Map<string, Player>()
    for (const player of matchSquad) map.set(player.id, player)
    for (const player of workspaceSquad) {
      if (!map.has(player.id)) map.set(player.id, player)
    }
    return map
  }, [matchSquad, workspaceSquad])

  const temps = matchSquad.filter((player) => player.temporary)
  const workspaceIds = useMemo(
    () => new Set(workspaceSquad.map((player) => player.id)),
    [workspaceSquad],
  )

  const positionLabel = (value: string): string => {
    if (!isPlayerPositionId(value)) return value.trim() || '-'
    const map: Record<PlayerPositionId, string> = {
      outside: ts('positionOutside'),
      opposite: ts('positionOpposite'),
      middle: ts('positionMiddle'),
      setter: ts('positionSetter'),
      libero: ts('positionLibero'),
      universal: ts('positionUniversal'),
    }
    return map[value]
  }

  function addToLineup(player: Player, side: Side) {
    updatePlayerTracker((prev) => {
      const byId = new Map(prev.squad.map((entry) => [entry.id, entry]))
      if (!byId.has(player.id)) {
        byId.set(player.id, {
          ...player,
          metrics: player.metrics.map((sample) => ({ ...sample })),
        })
      }
      const squad = Array.from(byId.values())
      const slots = prev.lineups[side]
      if (slots.some((slot) => slot.playerId === player.id)) {
        return { ...prev, squad }
      }
      const nextSlot: LineupSlot = {
        playerId: player.id,
        role: player.position || '',
      }
      return {
        ...prev,
        squad,
        lineups: {
          ...prev.lineups,
          [side]: [...slots, nextSlot],
        },
      }
    })
  }

  function removeFromLineup(playerId: string, side: Side) {
    updatePlayerTracker((prev) => ({
      ...prev,
      lineups: {
        ...prev.lineups,
        [side]: prev.lineups[side].filter((slot) => slot.playerId !== playerId),
      },
    }))
  }

  function removeTemp(playerId: string) {
    updatePlayerTracker((prev) => ({
      ...prev,
      squad: prev.squad.filter((player) => player.id !== playerId),
      lineups: {
        home: prev.lineups.home.filter((slot) => slot.playerId !== playerId),
        away: prev.lineups.away.filter((slot) => slot.playerId !== playerId),
      },
    }))
  }

  function onCreateTemp(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = temp.name.trim()
    const number = Number(temp.number)
    if (!name || !Number.isFinite(number)) return
    const player = createPlayer({
      name,
      number: Math.max(0, Math.floor(number)),
      position: temp.position === '__none__' ? '' : temp.position,
      temporary: true,
    })
    updatePlayerTracker((prev) => {
      const nextSlot: LineupSlot = {
        playerId: player.id,
        role: player.position || '',
      }
      return {
        ...prev,
        squad: [...prev.squad, player],
        lineups: {
          ...prev.lineups,
          [temp.side]: [...prev.lineups[temp.side], nextSlot],
        },
      }
    })
    setTemp(emptyTemp())
    setTempOpen(false)
  }

  function inLineup(playerId: string, side: Side): boolean {
    return lineups[side].some((slot) => slot.playerId === playerId)
  }

  return (
    <div className="space-y-6">
      <ToolPageHeader title={t('title')} description={t('description')} />

      {workspaceSquad.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
          <button
            type="button"
            onClick={() => navigate('squad')}
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            {t('editSquad')}
          </button>
        </div>
      ) : (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">{t('squadFromWorkspace')}</h2>
            <button
              type="button"
              onClick={() => navigate('squad')}
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              {t('editSquad')}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">{t('referenceHint')}</p>
          <ul className="divide-y divide-border overflow-hidden rounded-xl ring-1 ring-foreground/10">
            {workspaceSquad.map((player) => (
              <li
                key={player.id}
                className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    #{player.number} {player.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {positionLabel(player.position)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={inLineup(player.id, 'home') ? 'default' : 'outline'}
                    onClick={() =>
                      inLineup(player.id, 'home')
                        ? removeFromLineup(player.id, 'home')
                        : addToLineup(player, 'home')
                    }
                  >
                    {t('addHome')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={inLineup(player.id, 'away') ? 'default' : 'outline'}
                    onClick={() =>
                      inLineup(player.id, 'away')
                        ? removeFromLineup(player.id, 'away')
                        : addToLineup(player, 'away')
                    }
                  >
                    {t('addAway')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">{t('lineupsTitle')}</h2>
          <p className="text-xs text-muted-foreground">
            {t('lineupsCount', {
              home: lineups.home.length,
              away: lineups.away.length,
            })}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <LineupList
            title={t('homeLineup')}
            slots={lineups.home}
            playersById={playersById}
            positionLabel={positionLabel}
            onRemove={(id) => removeFromLineup(id, 'home')}
            empty={t('lineupEmpty')}
            guestLabel={t('tempBadge')}
            isGuest={(id) =>
              Boolean(playersById.get(id)?.temporary) || !workspaceIds.has(id)
            }
          />
          <LineupList
            title={t('awayLineup')}
            slots={lineups.away}
            playersById={playersById}
            positionLabel={positionLabel}
            onRemove={(id) => removeFromLineup(id, 'away')}
            empty={t('lineupEmpty')}
            guestLabel={t('tempBadge')}
            isGuest={(id) =>
              Boolean(playersById.get(id)?.temporary) || !workspaceIds.has(id)
            }
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">{t('tempTitle')}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t('tempHint')}</p>
          </div>
          {!tempOpen ? (
            <Button size="sm" variant="outline" onClick={() => setTempOpen(true)}>
              <UserPlus data-icon="inline-start" />
              {t('tempAdd')}
            </Button>
          ) : null}
        </div>

        {tempOpen ? (
          <form
            onSubmit={onCreateTemp}
            className="space-y-3 rounded-xl border border-border p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs font-normal text-muted-foreground">
                  {ts('number')}
                </Label>
                <Input
                  value={temp.number}
                  onChange={(event) =>
                    setTemp((prev) => ({ ...prev, number: event.target.value }))
                  }
                  inputMode="numeric"
                  className="h-10"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-normal text-muted-foreground">
                  {ts('name')}
                </Label>
                <Input
                  value={temp.name}
                  onChange={(event) =>
                    setTemp((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="h-10"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-normal text-muted-foreground">
                  {ts('position')}
                </Label>
                <select
                  value={temp.position || '__none__'}
                  onChange={(event) =>
                    setTemp((prev) => ({
                      ...prev,
                      position:
                        event.target.value === '__none__'
                          ? ''
                          : event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="__none__">{ts('positionPlaceholder')}</option>
                  {PLAYER_POSITIONS.map((id) => (
                    <option key={id} value={id}>
                      {positionLabel(id)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-normal text-muted-foreground">
                  {t('tempSide')}
                </Label>
                <select
                  value={temp.side}
                  onChange={(event) =>
                    setTemp((prev) => ({
                      ...prev,
                      side: event.target.value as Side,
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="home">{t('homeLineup')}</option>
                  <option value="away">{t('awayLineup')}</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={!temp.name.trim() || !temp.number.trim()}
              >
                <Plus data-icon="inline-start" />
                {t('tempCreate')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setTempOpen(false)
                  setTemp(emptyTemp())
                }}
              >
                {ts('cancel')}
              </Button>
            </div>
          </form>
        ) : null}

        {temps.length > 0 ? (
          <ul className="divide-y divide-border overflow-hidden rounded-xl ring-1 ring-foreground/10">
            {temps.map((player) => (
              <li
                key={player.id}
                className="flex items-center gap-3 px-4 py-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    #{player.number} {player.name}{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({t('tempBadge')})
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {positionLabel(player.position)}
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t('tempRemove')}
                  onClick={() => removeTemp(player.id)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  )
}

function LineupList({
  title,
  slots,
  playersById,
  positionLabel,
  onRemove,
  empty,
  guestLabel,
  isGuest,
}: {
  title: string
  slots: LineupSlot[]
  playersById: Map<string, Player>
  positionLabel: (value: string) => string
  onRemove: (playerId: string) => void
  empty: string
  guestLabel: string
  isGuest: (playerId: string) => boolean
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      {slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {slots.map((slot) => {
            const player = playersById.get(slot.playerId)
            return (
              <li
                key={`${title}-${slot.playerId}`}
                className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {player
                      ? `#${player.number} ${player.name}`
                      : slot.playerId}
                    {isGuest(slot.playerId) ? (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        ({guestLabel})
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {positionLabel(player?.position || slot.role)}
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => onRemove(slot.playerId)}
                >
                  <Trash2 />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
