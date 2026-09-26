import { useEffect, useMemo, useRef, useState, type SubmitEvent } from 'react'
import { ArrowLeft, Check, History, ImagePlus, Minus, Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { WorkspaceHomeNav } from '@/components/layout/WorkspaceHomeNav'
import { SkillRadar } from '@/components/player/SkillRadar'
import { TermInfo } from '@/components/player/TermInfo'
import { cn } from '@/lib/utils'
import {
  PLAYER_METRIC_KINDS,
  PLAYER_POSITIONS,
  PLAYER_SKILL_KINDS,
  aggregatePlayerSeasonStats,
  attackEfficiency,
  averageSkillRating,
  fileToAvatarDataUrl,
  formatMetricValue,
  isPlayerPositionId,
  latestMetricsByKey,
  metricUnit,
  parseOptionalNumber,
  previousSample,
  receptionPositivePct,
  samplesForKey,
  seasonHasAnyData,
  useWorkspace,
  type BuiltinPlayerMetricKind,
  type PlayerMetricKind,
  type PlayerMetricSample,
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

function todayInputValue(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function inputDateToIso(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T12:00:00.000Z`
  }
  return new Date().toISOString()
}

function formatListDate(iso: string, locale: 'de' | 'en'): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function MiniSparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const w = 64
  const h = 20
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * w
      const y = h - ((value - min) / span) * (h - 4) - 2
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="text-accent"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  )
}

function SeasonBars({
  values,
  label,
  info,
}: {
  values: number[]
  label: string
  info?: string
}) {
  if (values.length === 0) return null
  const max = Math.max(...values, 1)
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {info ? <TermInfo label={label} text={info} /> : null}
      </p>
      <div className="flex h-20 items-end gap-1">
        {values.map((value, index) => (
          <div
            key={`${label}-${index}`}
            className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
          >
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {value}
            </span>
            <div
              className="w-full rounded-sm bg-accent/80"
              style={{ height: `${Math.max(4, (value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function PlayerPage() {
  const {
    activeWorkspace,
    selectedPlayerId,
    projects,
    locale,
    navigate,
    updateSquadPlayer,
    removeSquadPlayer,
    addPlayerMetric,
    removePlayerMetric,
  } = useWorkspace()
  const t = useLocales(squadMessages)
  const tp = useLocales(projectsMessages)

  const player =
    selectedPlayerId && activeWorkspace
      ? (activeWorkspace.squad.find((p) => p.id === selectedPlayerId) ?? null)
      : null

  const [profile, setProfile] = useState<ProfileDraft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [logDate, setLogDate] = useState(todayInputValue)
  const [physicalDrafts, setPhysicalDrafts] = useState<
    Record<BuiltinPlayerMetricKind, string>
  >({
    jumpHeightCm: '',
    attackReachCm: '',
    blockReachCm: '',
  })
  const [historyOpen, setHistoryOpen] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setProfile(null)
    setError(null)
    setPhotoError(null)
    setPhysicalDrafts({
      jumpHeightCm: '',
      attackReachCm: '',
      blockReachCm: '',
    })
  }, [selectedPlayerId])

  const syncedProfile = useMemo(() => {
    if (!player) return null
    return {
      name: player.name,
      number: String(player.number),
      position: player.position,
      heightCm:
        player.heightCm !== undefined && player.heightCm !== null
          ? String(player.heightCm)
          : '',
    }
  }, [player])

  const draft = profile ?? syncedProfile
  const dirty =
    Boolean(profile) &&
    syncedProfile !== null &&
    (profile!.name !== syncedProfile.name ||
      profile!.number !== syncedProfile.number ||
      profile!.position !== syncedProfile.position ||
      profile!.heightCm !== syncedProfile.heightCm)

  const positionLabel = (value: string): string => {
    if (!isPlayerPositionId(value)) {
      return value.trim() || t('positionUnknown')
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

  const metricKindLabel = (kind: PlayerMetricKind, label?: string): string => {
    if (kind === 'jumpHeightCm') return t('metricJump')
    if (kind === 'attackReachCm') return t('metricAttackReach')
    if (kind === 'blockReachCm') return t('metricBlockReach')
    if (kind === 'weightKg') return t('metricWeight')
    if (kind === 'skillServe') return t('skillServe')
    if (kind === 'skillPass') return t('skillPass')
    if (kind === 'skillSet') return t('skillSet')
    if (kind === 'skillAttack') return t('skillAttack')
    if (kind === 'skillBlock') return t('skillBlock')
    if (kind === 'skillDefense') return t('skillDefense')
    if (kind === 'skillAthleticism') return t('skillAthleticism')
    if (kind === 'skillMentality') return t('skillMentality')
    return label?.trim() || t('metricCustom')
  }

  const metricKindInfo = (kind: PlayerMetricKind): string | null => {
    if (kind === 'jumpHeightCm') return t('infoJump')
    if (kind === 'attackReachCm') return t('infoAttackReach')
    if (kind === 'blockReachCm') return t('infoBlockReach')
    if (kind === 'skillAthleticism') return t('infoSkillAthleticism')
    if (kind === 'skillMentality') return t('infoSkillMentality')
    return null
  }

  const season = useMemo(() => {
    if (!player || !activeWorkspace) return null
    const workspaceProjects = projects.filter(
      (ace) => ace.workspaceId === activeWorkspace.id,
    )
    return aggregatePlayerSeasonStats(player.id, workspaceProjects)
  }, [player, projects, activeWorkspace])

  const history = player
    ? [...(player.metrics ?? [])].sort((a, b) =>
        a.recordedAt < b.recordedAt ? 1 : a.recordedAt > b.recordedAt ? -1 : 0,
      )
    : []

  const latest = latestMetricsByKey(player?.metrics ?? [])
  const skillAvg = averageSkillRating(player?.metrics ?? [])

  function parseJersey(value: string): number | null {
    const trimmed = value.trim()
    if (!trimmed) return null
    const n = Number(trimmed)
    if (!Number.isFinite(n)) return null
    return Math.max(0, Math.floor(n))
  }

  function patchProfile(next: ProfileDraft) {
    setProfile(next)
    setError(null)
  }

  function onSubmitProfile(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!player || !draft) return
    const name = draft.name.trim()
    const number = parseJersey(draft.number)
    if (!name || number === null) {
      setError(t('required'))
      return
    }
    const heightRaw = draft.heightCm.trim()
    const heightCm =
      heightRaw === '' ? null : parseOptionalNumber(draft.heightCm)
    if (heightRaw !== '' && heightCm === null) {
      setError(t('required'))
      return
    }
    updateSquadPlayer(player.id, {
      name,
      number,
      position: draft.position === '__none__' ? '' : draft.position,
      heightCm,
    })
    setProfile(null)
    setError(null)
  }

  function logMetric(kind: PlayerMetricKind, raw: string) {
    if (!player) return
    const value = parseOptionalNumber(raw)
    if (value === null) return
    addPlayerMetric(player.id, {
      kind,
      value,
      recordedAt: inputDateToIso(logDate),
    })
  }

  function logPhysical(kind: BuiltinPlayerMetricKind) {
    const raw = physicalDrafts[kind]
    logMetric(kind, raw)
    setPhysicalDrafts((prev) => ({ ...prev, [kind]: '' }))
  }

  function setSkill(kind: PlayerSkillKind, value: number) {
    if (!player) return
    const clamped = Math.max(1, Math.min(10, Math.round(value)))
    addPlayerMetric(player.id, {
      kind,
      value: clamped,
      recordedAt: inputDateToIso(logDate),
    })
  }

  function onDelete() {
    if (!player) return
    if (!window.confirm(t('deleteConfirm', { name: player.name }))) return
    removeSquadPlayer(player.id)
    navigate('squad')
  }

  async function onPhotoPick(file: File | undefined) {
    if (!player || !file) return
    setPhotoError(null)
    try {
      const photoDataUrl = await fileToAvatarDataUrl(file)
      updateSquadPlayer(player.id, { photoDataUrl })
    } catch {
      setPhotoError(t('photoError'))
    }
  }

  function formatDelta(latestSample: PlayerMetricSample): string {
    const prev = previousSample(player?.metrics ?? [], latestSample)
    if (!prev) return ''
    const delta = latestSample.value - prev.value
    if (Math.abs(delta) < 0.05) return t('deltaFlat')
    const formatted =
      locale === 'de'
        ? delta.toLocaleString('de-DE', {
            maximumFractionDigits: 1,
            signDisplay: 'exceptZero',
          })
        : delta.toLocaleString('en-US', {
            maximumFractionDigits: 1,
            signDisplay: 'exceptZero',
          })
    return delta > 0
      ? t('deltaUp', { value: formatted.replace(/^\+/, '') })
      : t('deltaDown', { value: formatted })
  }

  if (!activeWorkspace) {
    return (
      <main className="flex min-h-svh w-full flex-col">
        <WorkspaceHomeNav />
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            {tp('noWorkspaceTitle')}
          </h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {tp('noWorkspaceBody')}
          </p>
        </div>
      </main>
    )
  }

  if (!player || !draft) {
    return (
      <main className="flex min-h-svh w-full flex-col">
        <WorkspaceHomeNav />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">{t('playerMissing')}</p>
          <Button size="sm" onClick={() => navigate('squad')}>
            <ArrowLeft data-icon="inline-start" />
            {t('backToSquad')}
          </Button>
        </div>
      </main>
    )
  }

  const receptionPct = season ? receptionPositivePct(season) : null
  const attackEff = season ? attackEfficiency(season) : null
  const hasSeason = season ? seasonHasAnyData(season) : false

  return (
    <main className="flex min-h-svh w-full flex-col">
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <WorkspaceHomeNav />
        <div className="flex w-full flex-col gap-5 px-5 py-5 md:px-8 md:py-6">
          <header className="flex flex-wrap items-start gap-4">
            <div className="min-w-0 space-y-4">
              <button
                type="button"
                onClick={() => navigate('squad')}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <ArrowLeft className="size-3.5" />
                {t('backToSquad')}
              </button>
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => photoRef.current?.click()}
                    className="group relative flex size-14 items-center justify-center overflow-hidden rounded-2xl bg-foreground text-lg font-semibold tabular-nums text-background outline-none transition hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50"
                    aria-label={
                      player.photoDataUrl ? t('photoChange') : t('photoPick')
                    }
                  >
                    {player.photoDataUrl ? (
                      <img
                        src={player.photoDataUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      player.number
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
                      <ImagePlus className="size-5 text-white" />
                    </span>
                  </button>
                  <input
                    ref={photoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      void onPhotoPick(event.target.files?.[0])
                      event.target.value = ''
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="font-heading truncate text-2xl font-semibold tracking-tight md:text-3xl">
                    {player.name}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[
                      positionLabel(player.position),
                      player.heightCm != null
                        ? `${player.heightCm} ${t('heightUnit')}`
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
                      .join(' · ')}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => photoRef.current?.click()}
                    >
                      {player.photoDataUrl ? t('photoChange') : t('photoPick')}
                    </Button>
                    {player.photoDataUrl ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          updateSquadPlayer(player.id, { photoDataUrl: null })
                        }
                      >
                        {t('photoRemove')}
                      </Button>
                    ) : null}
                    {photoError ? (
                      <p className="text-xs text-destructive">{photoError}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <form
            onSubmit={onSubmitProfile}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[5.5rem_minmax(0,1.4fr)_minmax(0,1.2fr)_7rem_auto]"
          >
            <div className="flex flex-col gap-1.5">
              <span className="flex h-4 items-end text-[11px] font-medium uppercase leading-none tracking-wide text-muted-foreground">
                {t('number')}
              </span>
              <Input
                value={draft.number}
                onChange={(event) =>
                  patchProfile({ ...draft, number: event.target.value })
                }
                inputMode="numeric"
                className="h-10 tabular-nums"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="flex h-4 items-end text-[11px] font-medium uppercase leading-none tracking-wide text-muted-foreground">
                {t('name')}
              </span>
              <Input
                value={draft.name}
                onChange={(event) =>
                  patchProfile({ ...draft, name: event.target.value })
                }
                className="h-10"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="flex h-4 items-end text-[11px] font-medium uppercase leading-none tracking-wide text-muted-foreground">
                {t('position')}
              </span>
              <Select
                value={draft.position || '__none__'}
                onValueChange={(value) =>
                  patchProfile({
                    ...draft,
                    position: value === '__none__' ? '' : value,
                  })
                }
              >
                <SelectTrigger className="h-10 w-full">
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
                  {draft.position && !isPlayerPositionId(draft.position) ? (
                    <SelectItem value={draft.position}>
                      {draft.position}
                    </SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="h-4 shrink-0 text-[11px] font-medium uppercase leading-none tracking-wide text-muted-foreground">
                {t('height')}
              </span>
              <div className="relative h-10">
                <Input
                  value={draft.heightCm}
                  onChange={(event) =>
                    patchProfile({ ...draft, heightCm: event.target.value })
                  }
                  inputMode="decimal"
                  className="h-10 pr-10 tabular-nums"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                  {t('heightUnit')}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="h-4 shrink-0" aria-hidden />
              <Button
                type="submit"
                disabled={!dirty}
                className="h-10 w-full lg:w-auto"
              >
                <Check data-icon="inline-start" />
                {t('save')}
              </Button>
            </div>
            {error ? (
              <p className="text-xs text-destructive sm:col-span-2 lg:col-span-5">
                {error}
              </p>
            ) : null}
          </form>
        </div>
      </div>

      <div className="flex w-full flex-1 flex-col gap-5 px-5 py-5 md:px-8 md:py-6">
        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold tracking-tight">
                {t('sectionPhysical')}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t('sectionPhysicalHint')}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {t('logDateLabel')}
              </span>
              <Input
                type="date"
                value={logDate}
                onChange={(event) => setLogDate(event.target.value)}
                className="h-9 w-auto"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {PLAYER_METRIC_KINDS.map((kind) => {
              const sample = latest.get(kind) ?? null
              const series = samplesForKey(player.metrics ?? [], kind).map(
                (s) => s.value,
              )
              const unit = metricUnit(kind)
              return (
                <div
                  key={kind}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {metricKindLabel(kind)}
                        {metricKindInfo(kind) ? (
                          <TermInfo
                            label={t('infoAria', {
                              term: metricKindLabel(kind),
                            })}
                            text={metricKindInfo(kind)!}
                          />
                        ) : null}
                      </p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                        {sample ? formatMetricValue(sample, locale) : '-'}
                      </p>
                      {sample ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[
                            formatDelta(sample),
                            formatListDate(sample.recordedAt, locale),
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {t('metricUnset')}
                        </p>
                      )}
                    </div>
                    <span className="text-accent">
                      <MiniSparkline values={series} />
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative min-w-0 flex-1">
                      <Input
                        value={physicalDrafts[kind]}
                        onChange={(event) =>
                          setPhysicalDrafts((prev) => ({
                            ...prev,
                            [kind]: event.target.value,
                          }))
                        }
                        placeholder={t('metricValuePlaceholder')}
                        inputMode="decimal"
                        className="pr-10 tabular-nums"
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            logPhysical(kind)
                          }
                        }}
                      />
                      {unit ? (
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                          {unit}
                        </span>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-10 shrink-0"
                      disabled={!physicalDrafts[kind].trim()}
                      aria-label={t('metricAdd')}
                      onClick={() => logPhysical(kind)}
                    >
                      <Save />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">
                {t('sectionSkills')}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t('sectionSkillsHint')}
              </p>
            </div>
            {skillAvg != null ? (
              <p className="text-sm tabular-nums text-muted-foreground">
                Ø{' '}
                <span className="font-semibold text-foreground">
                  {locale === 'de'
                    ? skillAvg.toLocaleString('de-DE', {
                        maximumFractionDigits: 1,
                      })
                    : skillAvg.toLocaleString('en-US', {
                        maximumFractionDigits: 1,
                      })}
                </span>
              </p>
            ) : null}
          </div>
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]">
            <div className="text-accent">
              <SkillRadar
                values={PLAYER_SKILL_KINDS.map((kind) => {
                  const sample = latest.get(kind)
                  return sample ? Math.round(sample.value) : 0
                })}
                labels={PLAYER_SKILL_KINDS.map((kind) => metricKindLabel(kind))}
              />
            </div>
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {PLAYER_SKILL_KINDS.map((kind) => {
                const sample = latest.get(kind) ?? null
                const value = sample ? Math.round(sample.value) : null
                return (
                  <div key={kind} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="flex items-center gap-1 text-sm font-medium">
                        {metricKindLabel(kind)}
                        {metricKindInfo(kind) ? (
                          <TermInfo
                            label={t('infoAria', {
                              term: metricKindLabel(kind),
                            })}
                            text={metricKindInfo(kind)!}
                          />
                        ) : null}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="outline"
                          aria-label={`${metricKindLabel(kind)} -`}
                          disabled={value == null || value <= 1}
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            setSkill(kind, (value ?? 1) - 1)
                          }}
                        >
                          <Minus />
                        </Button>
                        <p className="min-w-[2.75rem] text-center text-sm tabular-nums text-muted-foreground">
                          {value != null ? (
                            <span className="font-semibold text-foreground">
                              {value}
                            </span>
                          ) : (
                            '-'
                          )}
                          <span className="text-muted-foreground">/10</span>
                        </p>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="outline"
                          aria-label={`${metricKindLabel(kind)} +`}
                          disabled={value != null && value >= 10}
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            setSkill(kind, (value ?? 0) + 1)
                          }}
                        >
                          <Plus />
                        </Button>
                      </div>
                    </div>
                    <div
                      role="group"
                      aria-label={metricKindLabel(kind)}
                      className="flex gap-1"
                    >
                      {Array.from({ length: 10 }, (_, index) => {
                        const rating = index + 1
                        const active = value != null && rating <= value
                        return (
                          <button
                            key={rating}
                            type="button"
                            aria-label={`${metricKindLabel(kind)} ${rating}`}
                            aria-pressed={value === rating}
                            onClick={() => setSkill(kind, rating)}
                            className={cn(
                              'h-2.5 flex-1 rounded-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring/50',
                              active
                                ? 'bg-accent'
                                : 'bg-muted hover:bg-accent/25',
                            )}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t border-border pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight">
              {t('sectionMatchStats')}
            </h2>
            {hasSeason && season ? (
              <p className="text-xs text-muted-foreground">
                {t('seasonMatches', { count: season.matchCount })}
              </p>
            ) : null}
          </div>
          {!hasSeason || !season ? (
            <p className="text-sm text-muted-foreground">
              {t('matchStatsEmpty')}
            </p>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <Kpi
                  label={t('seasonKills')}
                  value={String(season.attackKill + season.blockStuff)}
                />
                <Kpi
                  label={t('seasonAces')}
                  value={String(season.serveAce)}
                />
                <Kpi
                  label={t('seasonErrors')}
                  value={String(
                    season.serveError +
                      season.receptionError +
                      season.digError +
                      season.setError +
                      season.attackError +
                      season.blockError,
                  )}
                />
                <Kpi
                  label={t('seasonReception')}
                  info={t('infoSeasonReception')}
                  value={
                    receptionPct == null
                      ? '-'
                      : `${receptionPct.toFixed(0)} %`
                  }
                />
                <Kpi
                  label={t('seasonAttackEff')}
                  info={t('infoSeasonAttackEff')}
                  value={
                    attackEff == null
                      ? '-'
                      : attackEff.toLocaleString(
                          locale === 'de' ? 'de-DE' : 'en-US',
                          { maximumFractionDigits: 2 },
                        )
                  }
                />
              </div>
              <div className="grid gap-6 lg:grid-cols-3">
                <SeasonBars
                  label={t('chartKills')}
                  values={season.perMatch.map((m) => m.kills)}
                />
                <SeasonBars
                  label={t('chartAces')}
                  values={season.perMatch.map((m) => m.aces)}
                />
                <SeasonBars
                  label={t('chartErrors')}
                  values={season.perMatch.map((m) => m.errors)}
                />
              </div>
            </div>
          )}
        </section>

        <section className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight">
              {t('metricHistory')}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {history.length > 0
                ? t('historyCount', { count: history.length })
                : t('metricEmpty')}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setHistoryOpen(true)}
          >
            <History data-icon="inline-start" />
            {t('historyOpen')}
          </Button>
        </section>

        <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
          <SheetContent side="right" className="gap-0 p-0">
            <SheetHeader className="border-b border-border pb-4">
              <SheetTitle>{t('metricHistory')}</SheetTitle>
              <SheetDescription>{t('historyHint')}</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('metricEmpty')}
                </p>
              ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                  {history.map((sample) => (
                    <li
                      key={sample.id}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {metricKindLabel(sample.kind, sample.label)}{' '}
                          <span className="tabular-nums">
                            {formatMetricValue(sample, locale)}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatListDate(sample.recordedAt, locale)}
                          {sample.note ? ` · ${sample.note}` : ''}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={t('metricDelete')}
                        onClick={() =>
                          removePlayerMetric(player.id, sample.id)
                        }
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <section className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h2 className="text-sm font-semibold tracking-tight text-destructive">
                {t('dangerZone')}
              </h2>
              <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
                {t('dangerZoneHint')}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={onDelete}
            >
              <Trash2 data-icon="inline-start" />
              {t('delete')}
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}

function Kpi({
  label,
  value,
  info,
}: {
  label: string
  value: string
  info?: string
}) {
  return (
    <div className="rounded-2xl bg-muted/40 px-3.5 py-3">
      <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {info ? <TermInfo label={label} text={info} /> : null}
      </p>
      <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  )
}
