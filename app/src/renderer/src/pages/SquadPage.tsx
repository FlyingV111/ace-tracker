import { useMemo, useState, type SubmitEvent } from 'react'
import { LayoutGrid, List, Pencil, Plus, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WorkspaceHomeNav } from '@/components/layout/WorkspaceHomeNav'
import { SkillRadar } from '@/components/player/SkillRadar'
import { TermInfo } from '@/components/player/TermInfo'
import { cn } from '@/lib/utils'
import {
  PLAYER_POSITIONS,
  PLAYER_SKILL_KINDS,
  averageSkillRating,
  formatMetricValue,
  isPlayerPositionId,
  latestMetricsByKey,
  parseOptionalNumber,
  useWorkspace,
  type Player,
  type PlayerPositionId,
  type PlayerSkillKind,
} from '@/shared'
import { useLocales } from '@/locales'
import { squadMessages } from '@/locales/pages/squad'
import { projectsMessages } from '@/locales/pages/projects'

type ProfileDraft = {
  name: string
  number: string
  position: string
  heightCm: string
}

function emptyProfile(): ProfileDraft {
  return { name: '', number: '', position: '', heightCm: '' }
}

export function SquadPage() {
  const {
    activeWorkspace,
    addSquadPlayer,
    removeSquadPlayer,
    openPlayer,
    navigate,
    locale,
    settings,
    setSquadViewMode,
  } = useWorkspace()
  const t = useLocales(squadMessages)
  const tp = useLocales(projectsMessages)
  const [creating, setCreating] = useState(false)
  const [profile, setProfile] = useState<ProfileDraft>(emptyProfile)
  const [error, setError] = useState<string | null>(null)

  const cards = settings.squadViewMode === 'cards'
  const squad = activeWorkspace?.squad ?? []
  const sorted = useMemo(
    () =>
      [...squad].sort(
        (a, b) => a.number - b.number || a.name.localeCompare(b.name),
      ),
    [squad],
  )

  const positionLabel = (value: string): string => {
    if (!isPlayerPositionId(value)) {
      return value.trim() || ''
    }
    const map: Record<PlayerPositionId, string> = {
      outside: t('positionOutside'),
      opposite: t('positionOpposite'),
      middle: t('positionMiddle'),
      setter: t('positionSetter'),
      libero: t('positionLibero'),
      universal: t('positionUniversal'),
    }
    return map[value]
  }

  const skillLabel = (kind: PlayerSkillKind): string => {
    const map: Record<PlayerSkillKind, string> = {
      skillServe: t('skillServe'),
      skillPass: t('skillPass'),
      skillSet: t('skillSet'),
      skillAttack: t('skillAttack'),
      skillBlock: t('skillBlock'),
      skillDefense: t('skillDefense'),
      skillAthleticism: t('skillAthleticism'),
      skillMentality: t('skillMentality'),
    }
    return map[kind]
  }

  const skillShortLabel = (kind: PlayerSkillKind): string => {
    const full = skillLabel(kind)
    return full.length <= 6 ? full : `${full.slice(0, 4)}.`
  }

  function startCreate() {
    setProfile(emptyProfile())
    setError(null)
    setCreating(true)
  }

  function resetForm() {
    setCreating(false)
    setProfile(emptyProfile())
    setError(null)
  }

  function parseJersey(value: string): number | null {
    const trimmed = value.trim()
    if (!trimmed) return null
    const n = Number(trimmed)
    if (!Number.isFinite(n)) return null
    return Math.max(0, Math.floor(n))
  }

  function onSubmitProfile(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = profile.name.trim()
    const number = parseJersey(profile.number)
    if (!name || number === null) {
      setError(t('required'))
      return
    }
    const heightRaw = profile.heightCm.trim()
    const heightCm =
      heightRaw === '' ? null : parseOptionalNumber(profile.heightCm)
    if (heightRaw !== '' && heightCm === null) {
      setError(t('required'))
      return
    }

    addSquadPlayer({
      name,
      number,
      position: profile.position === '__none__' ? '' : profile.position,
      heightCm,
    })
    resetForm()
  }

  function onDelete(player: Player) {
    if (!window.confirm(t('deleteConfirm', { name: player.name }))) return
    removeSquadPlayer(player.id)
  }

  function playerMeta(player: Player): string {
    const latest = latestMetricsByKey(player.metrics ?? [])
    const jump = latest.get('jumpHeightCm')
    const skillAvg = averageSkillRating(player.metrics ?? [])
    return [
      positionLabel(player.position) || null,
      player.heightCm != null
        ? `${player.heightCm} ${t('heightUnit')}`
        : t('noHeight'),
      jump
        ? t('latestJump', {
            value: formatMetricValue(jump, locale),
          })
        : null,
      skillAvg != null
        ? t('latestSkillAvg', {
            value:
              locale === 'de'
                ? skillAvg.toLocaleString('de-DE', {
                    maximumFractionDigits: 1,
                  })
                : skillAvg.toLocaleString('en-US', {
                    maximumFractionDigits: 1,
                  }),
          })
        : null,
    ]
      .filter(Boolean)
      .join(' · ')
  }

  function radarValues(player: Player): number[] {
    const latest = latestMetricsByKey(player.metrics ?? [])
    return PLAYER_SKILL_KINDS.map((kind) => {
      const sample = latest.get(kind)
      return sample ? Math.round(sample.value) : 0
    })
  }

  return (
    <main className="flex min-h-svh w-full flex-col">
      <WorkspaceHomeNav />

      {!activeWorkspace ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            {tp('noWorkspaceTitle')}
          </h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {tp('noWorkspaceBody')}
          </p>
        </div>
      ) : (
        <div className="flex w-full flex-1 flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h1 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
                {t('title')}
              </h1>
              <p className="text-sm text-muted-foreground">{t('tagline')}</p>
            </div>
          </div>

          {creating ? (
            <form
              onSubmit={onSubmitProfile}
              className="space-y-4 rounded-xl border border-border p-4"
            >
              <h2 className="text-sm font-semibold">{t('addPlayer')}</h2>
              <p className="text-xs font-medium text-muted-foreground">
                {t('sectionProfile')}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs font-normal text-muted-foreground">
                    {t('number')}
                  </Label>
                  <Input
                    value={profile.number}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        number: event.target.value,
                      }))
                    }
                    placeholder={t('numberPlaceholder')}
                    inputMode="numeric"
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-normal text-muted-foreground">
                    {t('name')}
                  </Label>
                  <Input
                    value={profile.name}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    placeholder={t('namePlaceholder')}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-normal text-muted-foreground">
                    {t('position')}
                  </Label>
                  <Select
                    value={profile.position || '__none__'}
                    onValueChange={(value) =>
                      setProfile((prev) => ({
                        ...prev,
                        position: value === '__none__' ? '' : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('positionPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        {t('positionPlaceholder')}
                      </SelectItem>
                      {PLAYER_POSITIONS.map((id) => (
                        <SelectItem key={id} value={id}>
                          {positionLabel(id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-normal text-muted-foreground">
                    {t('height')} ({t('heightUnit')})
                  </Label>
                  <Input
                    value={profile.heightCm}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        heightCm: event.target.value,
                      }))
                    }
                    placeholder={t('heightPlaceholder')}
                    inputMode="decimal"
                  />
                </div>
              </div>
              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm">
                  {t('create')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={resetForm}
                >
                  {t('cancel')}
                </Button>
              </div>
            </form>
          ) : null}

          {sorted.length === 0 && !creating ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
              <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-background ring-1 ring-foreground/10">
                <Users
                  className="size-5 text-muted-foreground"
                  strokeWidth={1.75}
                />
              </span>
              <h2 className="text-base font-semibold tracking-tight">
                {t('emptyTitle')}
              </h2>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
                {t('emptyBody')}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button size="sm" onClick={startCreate}>
                  <Plus data-icon="inline-start" />
                  {t('addPlayer')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('games')}
                >
                  {t('goToGames')}
                </Button>
              </div>
            </div>
          ) : null}

          {sorted.length > 0 ? (
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {t('count', { count: sorted.length })}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    role="group"
                    aria-label={t('viewSwitch')}
                    className="grid grid-cols-2 rounded-lg bg-muted/60 p-1"
                  >
                    <button
                      type="button"
                      aria-pressed={cards}
                      aria-label={t('viewCards')}
                      onClick={() => setSquadViewMode('cards')}
                      className={cn(
                        'flex size-8 items-center justify-center rounded-md outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50',
                        cards
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <LayoutGrid className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-pressed={!cards}
                      aria-label={t('viewTable')}
                      onClick={() => setSquadViewMode('table')}
                      className={cn(
                        'flex size-8 items-center justify-center rounded-md outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50',
                        !cards
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <List className="size-3.5" />
                    </button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('games')}
                  >
                    {t('goToGames')}
                  </Button>
                  {!creating ? (
                    <Button size="sm" onClick={startCreate}>
                      <Plus data-icon="inline-start" />
                      {t('addPlayer')}
                    </Button>
                  ) : null}
                </div>
              </div>

              {cards ? (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {sorted.map((player) => {
                    const latest = latestMetricsByKey(player.metrics ?? [])
                    const skillAvg = averageSkillRating(player.metrics ?? [])
                    const jump = latest.get('jumpHeightCm')
                    const attack = latest.get('attackReachCm')
                    const block = latest.get('blockReachCm')
                    const pos = positionLabel(player.position)
                    const formatNum = (value: number) =>
                      locale === 'de'
                        ? value.toLocaleString('de-DE', {
                            maximumFractionDigits: 1,
                          })
                        : value.toLocaleString('en-US', {
                            maximumFractionDigits: 1,
                          })
                    const stats: {
                      label: string
                      value: string
                      info?: string
                    }[] = [
                      {
                        label: t('height'),
                        value:
                          player.heightCm != null
                            ? `${formatNum(player.heightCm)} ${t('heightUnit')}`
                            : t('cardNoValue'),
                      },
                      {
                        label: t('cardJump'),
                        value: jump
                          ? formatMetricValue(jump, locale)
                          : t('cardNoValue'),
                        info: t('infoJump'),
                      },
                      {
                        label: t('cardAttack'),
                        value: attack
                          ? formatMetricValue(attack, locale)
                          : t('cardNoValue'),
                        info: t('infoAttackReach'),
                      },
                      {
                        label: t('cardBlock'),
                        value: block
                          ? formatMetricValue(block, locale)
                          : t('cardNoValue'),
                        info: t('infoBlockReach'),
                      },
                      {
                        label: t('cardSkills'),
                        value:
                          skillAvg != null
                            ? `Ø ${formatNum(skillAvg)}`
                            : t('cardNoValue'),
                      },
                    ]

                    return (
                      <li key={player.id}>
                        <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm transition hover:border-foreground/15 hover:shadow-md">
                          <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
                            <button
                              type="button"
                              onClick={() => openPlayer(player.id)}
                              className="flex min-w-0 flex-1 items-center gap-2.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                            >
                              <span className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10">
                                {player.photoDataUrl ? (
                                  <img
                                    src={player.photoDataUrl}
                                    alt=""
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  <span className="flex size-full items-center justify-center bg-primary text-sm font-semibold tabular-nums text-primary-foreground">
                                    {player.number}
                                  </span>
                                )}
                                {player.photoDataUrl ? (
                                  <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[9px] font-semibold tabular-nums text-white">
                                    #{player.number}
                                  </span>
                                ) : null}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-heading text-sm font-semibold tracking-tight">
                                  {player.name}
                                </span>
                                <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground/80">
                                    {pos || t('positionUnknown')}
                                  </span>
                                  {skillAvg != null ? (
                                    <span className="text-[10px] tabular-nums text-muted-foreground">
                                      {t('latestSkillAvg', {
                                        value: formatNum(skillAvg),
                                      })}
                                    </span>
                                  ) : null}
                                </span>
                              </span>
                            </button>
                            <div className="flex shrink-0 items-center gap-0.5">
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                aria-label={t('openPlayer')}
                                onClick={() => openPlayer(player.id)}
                              >
                                <Pencil />
                              </Button>
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                aria-label={t('delete')}
                                onClick={() => onDelete(player)}
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          </div>

                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => openPlayer(player.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                openPlayer(player.id)
                              }
                            }}
                            className="flex cursor-pointer flex-col gap-2 px-3 pb-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50"
                          >
                            <div className="rounded-lg bg-muted/35 px-1 py-1.5 text-accent">
                              <SkillRadar
                                size="compact"
                                values={radarValues(player)}
                                labels={PLAYER_SKILL_KINDS.map(skillShortLabel)}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                              {stats.map((stat) => (
                                <div
                                  key={stat.label}
                                  className="rounded-lg border border-border/80 bg-background px-2 py-1.5"
                                >
                                  <div className="flex items-center gap-1">
                                    <span className="truncate text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                                      {stat.label}
                                    </span>
                                    {stat.info ? (
                                      <TermInfo
                                        label={t('infoAria', {
                                          term: stat.label,
                                        })}
                                        text={stat.info}
                                      />
                                    ) : null}
                                  </div>
                                  <p
                                    className={cn(
                                      'mt-0.5 truncate text-xs tabular-nums',
                                      stat.value === t('cardNoValue')
                                        ? 'text-muted-foreground/70'
                                        : 'font-semibold text-foreground',
                                    )}
                                  >
                                    {stat.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                  {sorted.map((player) => (
                    <li key={player.id} className="flex items-stretch">
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left outline-none transition hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50"
                        onClick={() => openPlayer(player.id)}
                      >
                        <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-sm font-semibold tabular-nums">
                          {player.photoDataUrl ? (
                            <>
                              <img
                                src={player.photoDataUrl}
                                alt=""
                                className="size-full object-cover"
                              />
                              <span className="absolute right-0 bottom-0 rounded-tl bg-background/90 px-0.5 text-[9px] font-semibold leading-tight">
                                {player.number}
                              </span>
                            </>
                          ) : (
                            player.number
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {player.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {playerMeta(player)}
                          </p>
                        </div>
                      </button>
                      <div className="flex shrink-0 items-center gap-1 pr-2">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label={t('openPlayer')}
                          onClick={() => openPlayer(player.id)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          aria-label={t('delete')}
                          onClick={() => onDelete(player)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </div>
      )}
    </main>
  )
}
