import type { Player, PlayerMetricKind, PlayerMetricSample } from '../core/types'
import { createId } from '../core/id'

export const PLAYER_METRIC_KINDS = [
  'jumpHeightCm',
  'attackReachCm',
  'blockReachCm',
] as const satisfies readonly PlayerMetricKind[]

export const PLAYER_SKILL_KINDS = [
  'skillServe',
  'skillPass',
  'skillSet',
  'skillAttack',
  'skillBlock',
  'skillDefense',
  'skillAthleticism',
  'skillMentality',
] as const satisfies readonly PlayerMetricKind[]

export type BuiltinPlayerMetricKind = (typeof PLAYER_METRIC_KINDS)[number]
export type PlayerSkillKind = (typeof PLAYER_SKILL_KINDS)[number]

export function isPlayerMetricKind(value: unknown): value is PlayerMetricKind {
  return (
    value === 'jumpHeightCm' ||
    value === 'attackReachCm' ||
    value === 'blockReachCm' ||
    value === 'weightKg' ||
    value === 'custom' ||
    (typeof value === 'string' &&
      (PLAYER_SKILL_KINDS as readonly string[]).includes(value))
  )
}

export function isSkillMetricKind(kind: PlayerMetricKind): kind is PlayerSkillKind {
  return (PLAYER_SKILL_KINDS as readonly string[]).includes(kind)
}

export function metricUnit(kind: PlayerMetricKind): string {
  if (kind === 'weightKg') return 'kg'
  if (kind === 'custom' || isSkillMetricKind(kind)) return ''
  return 'cm'
}

export function createMetricSample(input: {
  kind: PlayerMetricKind
  value: number
  recordedAt?: string
  label?: string
  note?: string
}): PlayerMetricSample {
  return {
    id: createId(),
    kind: input.kind,
    value: input.value,
    recordedAt: input.recordedAt?.trim() || new Date().toISOString(),
    ...(input.label?.trim() ? { label: input.label.trim() } : {}),
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
  }
}

export function normalizeMetricSample(value: unknown): PlayerMetricSample | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<PlayerMetricSample>
  if (typeof raw.id !== 'string' || !isPlayerMetricKind(raw.kind)) return null
  if (typeof raw.value !== 'number' || !Number.isFinite(raw.value)) return null
  return {
    id: raw.id,
    kind: raw.kind,
    value: raw.value,
    recordedAt:
      typeof raw.recordedAt === 'string' && raw.recordedAt
        ? raw.recordedAt
        : new Date().toISOString(),
    ...(typeof raw.label === 'string' && raw.label.trim()
      ? { label: raw.label.trim() }
      : {}),
    ...(typeof raw.note === 'string' && raw.note.trim()
      ? { note: raw.note.trim() }
      : {}),
  }
}

export function normalizePlayerMetrics(value: unknown): PlayerMetricSample[] {
  if (!Array.isArray(value)) return []
  return value
    .map(normalizeMetricSample)
    .filter((sample): sample is PlayerMetricSample => sample !== null)
}

/** Latest sample per kind (custom grouped by label). */
export function latestMetricsByKey(
  metrics: PlayerMetricSample[],
): Map<string, PlayerMetricSample> {
  const sorted = [...metrics].sort((a, b) =>
    a.recordedAt < b.recordedAt ? -1 : a.recordedAt > b.recordedAt ? 1 : 0,
  )
  const map = new Map<string, PlayerMetricSample>()
  for (const sample of sorted) {
    const key =
      sample.kind === 'custom'
        ? `custom:${sample.label ?? sample.id}`
        : sample.kind
    map.set(key, sample)
  }
  return map
}

export function metricDayKey(iso: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(iso)
  if (match) return match[1]
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10)
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function metricSampleKey(sample: PlayerMetricSample): string {
  return sample.kind === 'custom'
    ? `custom:${sample.label ?? sample.id}`
    : sample.kind
}

export function samplesForKey(
  metrics: PlayerMetricSample[],
  key: string,
): PlayerMetricSample[] {
  return [...metrics]
    .filter((sample) => {
      const sampleKey =
        sample.kind === 'custom'
          ? `custom:${sample.label ?? sample.id}`
          : sample.kind
      return sampleKey === key
    })
    .sort((a, b) =>
      a.recordedAt < b.recordedAt ? -1 : a.recordedAt > b.recordedAt ? 1 : 0,
    )
}

export function previousSample(
  metrics: PlayerMetricSample[],
  latest: PlayerMetricSample,
): PlayerMetricSample | null {
  const key =
    latest.kind === 'custom'
      ? `custom:${latest.label ?? latest.id}`
      : latest.kind
  const series = samplesForKey(metrics, key)
  if (series.length < 2) return null
  const idx = series.findIndex((sample) => sample.id === latest.id)
  if (idx <= 0) return series[series.length - 2] ?? null
  return series[idx - 1] ?? null
}

export function formatMetricValue(
  sample: PlayerMetricSample,
  locale: 'de' | 'en',
): string {
  const unit = metricUnit(sample.kind)
  const formatted =
    locale === 'de'
      ? sample.value.toLocaleString('de-DE', { maximumFractionDigits: 1 })
      : sample.value.toLocaleString('en-US', { maximumFractionDigits: 1 })
  if (isSkillMetricKind(sample.kind)) return `${formatted}/10`
  return unit ? `${formatted} ${unit}` : formatted
}

export function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim().replace(',', '.')
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return null
  return n
}

export function averageSkillRating(metrics: PlayerMetricSample[]): number | null {
  const latest = latestMetricsByKey(metrics)
  const values: number[] = []
  for (const kind of PLAYER_SKILL_KINDS) {
    const sample = latest.get(kind)
    if (sample) values.push(sample.value)
  }
  if (values.length === 0) return null
  return values.reduce((sum, n) => sum + n, 0) / values.length
}

export function createPlayer(input: {
  name: string
  number: number
  position?: string
  heightCm?: number | null
  photoDataUrl?: string | null
  metrics?: PlayerMetricSample[]
  temporary?: boolean
}): Player {
  return {
    id: createId(),
    name: input.name.trim(),
    number: Number.isFinite(input.number)
      ? Math.max(0, Math.floor(input.number))
      : 0,
    position: input.position?.trim() ?? '',
    heightCm:
      input.heightCm !== undefined &&
      input.heightCm !== null &&
      Number.isFinite(input.heightCm)
        ? input.heightCm
        : null,
    photoDataUrl: input.photoDataUrl ?? null,
    metrics: (input.metrics ?? []).map((sample) => ({ ...sample })),
    ...(input.temporary ? { temporary: true } : {}),
  }
}
