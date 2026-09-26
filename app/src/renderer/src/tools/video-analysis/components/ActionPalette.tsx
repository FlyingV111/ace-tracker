import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EventCategory } from '@/shared'
import {
  categoriesByGroup,
  type CategoryDef,
} from '../events/catalog'

type ActionPaletteProps = {
  labelFor: (id: EventCategory) => string
  groupLabels: {
    skills: string
    markers: string
    phases: string
  }
  highlightLabel: string
  onAction: (category: EventCategory) => void
  onHighlight: () => void
  disabled?: boolean
}

function PaletteRow({
  title,
  items,
  labelFor,
  onAction,
  disabled,
}: {
  title: string
  items: CategoryDef[]
  labelFor: (id: EventCategory) => string
  onAction: (category: EventCategory) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-muted-foreground">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled}
            className="h-8 gap-1.5"
            style={{
              borderColor: item.color,
              borderWidth: 1,
              backgroundColor: `${item.color}18`,
            }}
            onClick={() => onAction(item.id)}
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {labelFor(item.id)}
            {item.shortcut ? (
              <kbd className="ml-0.5 rounded bg-black/5 px-1 font-mono text-[10px] text-muted-foreground dark:bg-white/10">
                {item.shortcut.toUpperCase()}
              </kbd>
            ) : null}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function ActionPalette({
  labelFor,
  groupLabels,
  highlightLabel,
  onAction,
  onHighlight,
  disabled,
}: ActionPaletteProps) {
  return (
    <div className="space-y-3">
      <PaletteRow
        title={groupLabels.skills}
        items={categoriesByGroup('skill')}
        labelFor={labelFor}
        onAction={onAction}
        disabled={disabled}
      />
      <PaletteRow
        title={groupLabels.markers}
        items={categoriesByGroup('marker')}
        labelFor={labelFor}
        onAction={onAction}
        disabled={disabled}
      />
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <PaletteRow
            title={groupLabels.phases}
            items={categoriesByGroup('phase')}
            labelFor={labelFor}
            onAction={onAction}
            disabled={disabled}
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={onHighlight}
        >
          <Star data-icon="inline-start" className="size-3.5" />
          {highlightLabel}
          <kbd className="ml-1 rounded bg-black/5 px-1 font-mono text-[10px] dark:bg-white/10">
            H
          </kbd>
        </Button>
      </div>
    </div>
  )
}
