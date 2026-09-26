import { cn } from '@/lib/utils'

type SkillRadarProps = {
  values: number[]
  labels: string[]
  size?: 'default' | 'compact'
  className?: string
}

export function SkillRadar({
  values,
  labels,
  size = 'default',
  className,
}: SkillRadarProps) {
  const compact = size === 'compact'
  const canvas = compact ? 220 : 280
  const cx = canvas / 2
  const cy = canvas / 2
  const radius = compact ? 70 : 96
  const dataRadius = radius * 0.86
  const levels = [2, 4, 6, 8, 10]
  const count = Math.max(values.length, 3)
  const labelRadius = compact ? 11.2 : 11.8
  const fontSize = compact ? 8.5 : 10

  function point(index: number, value: number, maxR: number) {
    const angle = -Math.PI / 2 + (index / count) * Math.PI * 2
    const r = (Math.max(0, Math.min(10, value)) / 10) * maxR
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    }
  }

  function ringPoints(level: number) {
    return Array.from({ length: count }, (_, index) => {
      const p = point(index, level, radius)
      return `${p.x},${p.y}`
    }).join(' ')
  }

  const dataPoints = Array.from({ length: count }, (_, index) =>
    point(index, values[index] ?? 0, dataRadius),
  )
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ')
  const hasData = values.some((value) => value > 0)

  return (
    <div
      className={cn(
        'relative mx-auto w-full',
        compact ? 'max-w-[16rem]' : 'max-w-[20rem]',
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${canvas} ${canvas}`}
        className="h-auto w-full"
        role="img"
        aria-label="Skills radar"
      >
        {levels.map((level) => (
          <polygon
            key={level}
            points={ringPoints(level)}
            fill="none"
            className="stroke-foreground"
            strokeOpacity={0.12}
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: count }, (_, index) => {
          const outer = point(index, 10, radius)
          return (
            <line
              key={`axis-${index}`}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              className="stroke-foreground"
              strokeOpacity={0.12}
              strokeWidth={1}
            />
          )
        })}
        {hasData ? (
          <polygon
            points={dataPolygon}
            fill="currentColor"
            fillOpacity={0.15}
            stroke="currentColor"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {labels.map((label, index) => {
          const p = point(index, 10, (labelRadius / 10) * radius)
          return (
            <text
              key={`label-${index}`}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground"
              fontSize={fontSize}
            >
              {label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
