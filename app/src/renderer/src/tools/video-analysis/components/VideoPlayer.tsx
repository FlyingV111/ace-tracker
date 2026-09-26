import { useEffect, useRef, useState } from 'react'
import type { AnalysisScore } from '@/shared'
import { formatTimecode } from '../events/catalog'

type VideoPlayerProps = {
  src: string | null
  resolving?: boolean
  error?: string | null
  score: AnalysisScore
  homeLabel: string
  awayLabel: string
  onTimeMs: (ms: number) => void
  seekToMs?: number | null
  videoRef?: React.RefObject<HTMLVideoElement | null>
}

export function VideoPlayer({
  src,
  resolving,
  error,
  score,
  homeLabel,
  awayLabel,
  onTimeMs,
  seekToMs,
  videoRef: externalRef,
}: VideoPlayerProps) {
  const internalRef = useRef<HTMLVideoElement>(null)
  const ref = externalRef ?? internalRef
  const [durationMs, setDurationMs] = useState(0)
  const [currentMs, setCurrentMs] = useState(0)

  useEffect(() => {
    if (seekToMs == null || !ref.current) return
    ref.current.currentTime = seekToMs / 1000
  }, [seekToMs, ref])

  if (resolving) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
        …
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg border border-destructive/40 bg-muted px-4 text-center text-sm text-destructive">
        {error}
      </div>
    )
  }

  if (!src) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
        —
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-lg bg-black">
      <video
        ref={ref}
        src={src}
        className="aspect-video w-full"
        controls
        onTimeUpdate={(e) => {
          const ms = e.currentTarget.currentTime * 1000
          setCurrentMs(ms)
          onTimeMs(ms)
        }}
        onLoadedMetadata={(e) => {
          setDurationMs(e.currentTarget.duration * 1000)
        }}
      />
      <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2 rounded-md bg-black/70 px-2.5 py-1.5 text-xs font-semibold text-white">
        <span className="text-emerald-400">
          {homeLabel} {score.home}
        </span>
        <span className="text-white/50">·</span>
        <span className="text-rose-400">
          {score.away} {awayLabel}
        </span>
        <span className="text-white/40">
          ({score.setsHome}:{score.setsAway})
        </span>
      </div>
      <div className="pointer-events-none absolute right-3 bottom-14 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white/90">
        {formatTimecode(currentMs)}
        {durationMs > 0 ? ` / ${formatTimecode(durationMs)}` : ''}
      </div>
    </div>
  )
}
