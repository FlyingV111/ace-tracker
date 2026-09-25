import { Check } from 'lucide-react'
import {
  PROJECT_DATE_FORMATS,
  previewProjectTitle,
  type ProjectDateFormat,
} from '@/shared'

const fieldClass =
  'h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-3 focus-visible:ring-ring/50'

function ChoiceCard({
  selected,
  title,
  onClick,
  compact,
}: {
  selected: boolean
  title: string
  onClick: () => void
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-2.5 rounded-xl text-left ring-1 transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
        compact ? 'px-3 py-2.5' : 'px-4 py-3.5'
      } ${
        selected
          ? 'bg-primary text-primary-foreground ring-primary'
          : 'bg-background ring-foreground/10 hover:bg-muted/40'
      }`}
    >
      <span className={`min-w-0 flex-1 font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
        {title}
      </span>
      {selected ? (
        <Check className="size-3.5 shrink-0" strokeWidth={2.5} />
      ) : null}
    </button>
  )
}

type ProjectTitleFieldsProps = {
  projectName: string
  onProjectNameChange: (value: string) => void
  homeTeam: string
  awayTeam: string
  includeDate: boolean
  onIncludeDateChange: (value: boolean) => void
  dateFormat: ProjectDateFormat
  onDateFormatChange: (value: ProjectDateFormat) => void
  labels: {
    titleOptional: string
    titlePlaceholder: string
    includeDate: string
    dateFormat: string
    preview: string
  }
}

export function ProjectTitleFields({
  projectName,
  onProjectNameChange,
  homeTeam,
  awayTeam,
  includeDate,
  onIncludeDateChange,
  dateFormat,
  onDateFormatChange,
  labels,
}: ProjectTitleFieldsProps) {
  const preview = previewProjectTitle({
    customName: projectName,
    homeTeam,
    awayTeam,
    includeDate,
    dateFormat,
    emptyLabel: labels.titlePlaceholder,
  })

  return (
    <div className="space-y-3">
      <label className="block space-y-1.5">
        <span className="text-xs text-muted-foreground">
          {labels.titleOptional}
        </span>
        <input
          value={projectName}
          onChange={(event) => onProjectNameChange(event.target.value)}
          placeholder={
            homeTeam.trim() && awayTeam.trim()
              ? `${homeTeam.trim()} vs ${awayTeam.trim()}`
              : labels.titlePlaceholder
          }
          className={fieldClass}
        />
      </label>

      <ChoiceCard
        selected={includeDate}
        title={labels.includeDate}
        onClick={() => onIncludeDateChange(!includeDate)}
      />

      {includeDate ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{labels.dateFormat}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PROJECT_DATE_FORMATS.map((format) => (
              <ChoiceCard
                key={format}
                compact
                selected={dateFormat === format}
                title={format}
                onClick={() => onDateFormatChange(format)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        {labels.preview}:{' '}
        <span className="font-medium text-foreground">{preview}</span>
      </p>
    </div>
  )
}
