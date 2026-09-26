export const PROJECT_DATE_FORMATS = [
  'dd.MM.yyyy',
  'dd.MM.yy',
  'yyyy-MM-dd',
  'dd/MM/yyyy',
  'MM/dd/yyyy',
] as const

export type ProjectDateFormat = (typeof PROJECT_DATE_FORMATS)[number]

export function isProjectDateFormat(value: unknown): value is ProjectDateFormat {
  return (
    typeof value === 'string' &&
    (PROJECT_DATE_FORMATS as readonly string[]).includes(value)
  )
}

export function formatProjectDate(
  date: Date,
  format: ProjectDateFormat,
): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const MM = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = String(date.getFullYear())
  const yy = yyyy.slice(-2)

  switch (format) {
    case 'dd.MM.yyyy':
      return `${dd}.${MM}.${yyyy}`
    case 'dd.MM.yy':
      return `${dd}.${MM}.${yy}`
    case 'yyyy-MM-dd':
      return `${yyyy}-${MM}-${dd}`
    case 'dd/MM/yyyy':
      return `${dd}/${MM}/${yyyy}`
    case 'MM/dd/yyyy':
      return `${MM}/${dd}/${yyyy}`
  }
}

export function buildBaseProjectTitle(input: {
  customName?: string
  homeTeam: string
  awayTeam: string
}): string {
  const custom = input.customName?.trim()
  if (custom) return custom
  const home = input.homeTeam.trim()
  const away = input.awayTeam.trim()
  if (home && away) return `${home} vs ${away}`
  return home || away || 'Spiel'
}

export function buildProjectTitle(input: {
  customName?: string
  homeTeam: string
  awayTeam: string
  includeDate: boolean
  dateFormat: ProjectDateFormat
  date?: Date
}): string {
  const base = buildBaseProjectTitle(input)
  if (!input.includeDate) return base
  const stamp = formatProjectDate(input.date ?? new Date(), input.dateFormat)
  return `${base} - ${stamp}`
}

export function previewProjectTitle(input: {
  customName?: string
  homeTeam: string
  awayTeam: string
  includeDate: boolean
  dateFormat: ProjectDateFormat
  emptyLabel: string
}): string {
  const home = input.homeTeam.trim()
  const away = input.awayTeam.trim()
  const custom = input.customName?.trim()
  if (!custom && !(home && away) && !home && !away) {
    if (!input.includeDate) return input.emptyLabel
    return `${input.emptyLabel} - ${formatProjectDate(new Date(), input.dateFormat)}`
  }
  return buildProjectTitle(input)
}
