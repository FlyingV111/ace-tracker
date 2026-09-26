import { Button } from '@/components/ui/button'
import type { AnalysisScore } from '@/shared'

type ScoreboardProps = {
  score: AnalysisScore
  homeName: string
  awayName: string
  labels: {
    set: string
    sets: string
    plus: string
    minus: string
    nextSet: string
  }
  onHomeDelta: (delta: 1 | -1) => void
  onAwayDelta: (delta: 1 | -1) => void
  onNextSet: () => void
}

export function Scoreboard({
  score,
  homeName,
  awayName,
  labels,
  onHomeDelta,
  onAwayDelta,
  onNextSet,
}: ScoreboardProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
          {homeName}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={() => onHomeDelta(-1)}
        >
          {labels.minus}
        </Button>
        <span className="min-w-8 text-center text-lg font-semibold tabular-nums">
          {score.home}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={() => onHomeDelta(1)}
        >
          {labels.plus}
        </Button>
      </div>

      <div className="text-[11px] text-muted-foreground">
        {labels.set} {score.set} · {labels.sets} {score.setsHome}:{score.setsAway}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={() => onAwayDelta(-1)}
        >
          {labels.minus}
        </Button>
        <span className="min-w-8 text-center text-lg font-semibold tabular-nums">
          {score.away}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={() => onAwayDelta(1)}
        >
          {labels.plus}
        </Button>
        <span className="text-xs font-medium text-rose-700 dark:text-rose-400">
          {awayName}
        </span>
      </div>

      <Button type="button" size="sm" variant="secondary" onClick={onNextSet}>
        {labels.nextSet}
      </Button>
    </div>
  )
}
