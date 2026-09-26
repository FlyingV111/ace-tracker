import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { MediaAsset } from '@/shared'
import type { ClipMeta } from '@/shared'

type ClipSwitcherProps = {
  items: MediaAsset[]
  activeMediaId: string | null
  clipMeta: Record<string, ClipMeta>
  labels: {
    title: string
    active: string
    done: string
    open: string
  }
  onSelect: (id: string) => void
  onToggleDone: (id: string, done: boolean) => void
}

export function ClipSwitcher({
  items,
  activeMediaId,
  clipMeta,
  labels,
  onSelect,
  onToggleDone,
}: ClipSwitcherProps) {
  if (items.length === 0) return null

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">{labels.title}</h2>
      <ul className="space-y-1.5">
        {items.map((item) => {
          const active = item.id === activeMediaId
          const done = clipMeta[item.id]?.analysisDone ?? false
          return (
            <li
              key={item.id}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${
                active ? 'border-foreground/40 bg-muted/50' : 'border-border'
              }`}
            >
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left text-sm font-medium"
                onClick={() => onSelect(item.id)}
              >
                {item.fileName}
                {active ? (
                  <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                    {labels.active}
                  </span>
                ) : null}
              </button>
              <label className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                <Checkbox
                  checked={done}
                  onCheckedChange={(v) => onToggleDone(item.id, v === true)}
                />
                {labels.done}
              </label>
              {!active ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelect(item.id)}
                >
                  {labels.open}
                </Button>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
