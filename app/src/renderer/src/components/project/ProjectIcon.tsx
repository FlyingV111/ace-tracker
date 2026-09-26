import { cn } from '@/lib/utils'
import { projectLetterMark } from '@/shared/project'
import type { ProjectDocument } from '@/shared'

type ProjectIconProps = {
  project: ProjectDocument
  className?: string
  textClassName?: string
}

export function ProjectIcon({
  project,
  className,
  textClassName,
}: ProjectIconProps) {
  if (project.iconDataUrl) {
    return (
      <img
        src={project.iconDataUrl}
        alt=""
        className={cn('size-11 shrink-0 rounded-xl object-cover', className)}
      />
    )
  }

  const mark = projectLetterMark(
    project.teams.home.name,
    project.teams.away.name,
  )

  return (
    <span
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted px-1 text-center font-semibold tracking-tight text-foreground',
        className,
      )}
      aria-hidden
    >
      <span className={cn('text-[0.65rem] leading-tight sm:text-xs', textClassName)}>
        {mark}
      </span>
    </span>
  )
}

type TeamIconProps = {
  name: string
  iconDataUrl?: string | null
  className?: string
}

export function TeamIcon({ name, iconDataUrl, className }: TeamIconProps) {
  if (iconDataUrl) {
    return (
      <img
        src={iconDataUrl}
        alt=""
        className={cn(
          'size-10 shrink-0 rounded-full object-cover ring-1 ring-foreground/10',
          className,
        )}
      />
    )
  }

  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold ring-1 ring-foreground/10',
        className,
      )}
      aria-hidden
    >
      {name.trim() ? name.trim()[0]!.toLocaleUpperCase() : '?'}
    </span>
  )
}
