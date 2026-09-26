import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PROJECT_DATE_FORMATS,
  previewProjectTitle,
  type ProjectDateFormat,
} from '@/shared'

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
      <div className="space-y-1.5">
        <Label className="text-xs font-normal text-muted-foreground">
          {labels.titleOptional}
        </Label>
        <Input
          value={projectName}
          onChange={(event) => onProjectNameChange(event.target.value)}
          placeholder={
            homeTeam.trim() && awayTeam.trim()
              ? `${homeTeam.trim()} vs ${awayTeam.trim()}`
              : labels.titlePlaceholder
          }
          className="h-11"
        />
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border px-3.5 py-3">
        <Checkbox
          checked={includeDate}
          onCheckedChange={(checked) => onIncludeDateChange(checked === true)}
          className="mt-0.5"
        />
        <span className="text-sm">{labels.includeDate}</span>
      </label>

      {includeDate ? (
        <div className="space-y-1.5">
          <Label className="text-xs font-normal text-muted-foreground">
            {labels.dateFormat}
          </Label>
          <Select
            value={dateFormat}
            onValueChange={(value) =>
              onDateFormatChange(value as ProjectDateFormat)
            }
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_DATE_FORMATS.map((format) => (
                <SelectItem key={format} value={format}>
                  {format}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        {labels.preview}:{' '}
        <span className="font-medium text-foreground">{preview}</span>
      </p>
    </div>
  )
}
