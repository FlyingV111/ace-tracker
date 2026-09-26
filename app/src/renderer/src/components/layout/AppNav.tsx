import {
  forwardRef,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from 'react'
import { Home } from 'lucide-react'
import { ProfileMenu } from '@/components/layout/ProfileMenu'
import { WorkspaceSwitcher } from '@/components/layout/WorkspaceSwitcher'
import { cn } from '@/lib/utils'

type AppNavProps = {
  /** Center content: brand on projects list, tool switcher inside a project. */
  center?: ReactNode
  /** Right-side actions (e.g. collaboration). */
  end?: ReactNode
}

/**
 * Global top nav - same shell everywhere.
 *
 * | Identity (left) | Place (center) | Actions (right) |
 * | Avatar Workspace | Home + tabs / brand | Collab |
 */
export function AppNav({ center, end }: AppNavProps) {
  return (
    <header className="grid h-14 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-b border-border bg-background px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-0.5 justify-self-start">
        <ProfileMenu menuAlign="start" compact />
        <WorkspaceSwitcher menuAlign="start" compact />
      </div>

      <div className="justify-self-center">{center}</div>

      <div className="flex min-w-0 items-center justify-end gap-1 justify-self-end">
        {end}
      </div>
    </header>
  )
}

export function AppNavBrand({ children }: { children: ReactNode }) {
  return (
    <span className="select-none px-2 text-sm font-semibold tracking-tight text-foreground/80">
      {children}
    </span>
  )
}

export function AppNavPill({
  children,
  'aria-label': ariaLabel,
}: {
  children: ReactNode
  'aria-label'?: string
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className="flex max-w-[min(100vw-8rem,36rem)] items-center gap-0.5 overflow-x-auto rounded-full bg-muted/70 p-1"
    >
      {children}
    </nav>
  )
}

export function AppNavHomeButton({
  onClick,
  label,
}: {
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition hover:bg-background hover:text-foreground hover:shadow-sm focus-visible:ring-3 focus-visible:ring-ring/50"
      aria-label={label}
      title={label}
    >
      <Home className="size-3.5" />
    </button>
  )
}

export function AppNavTabButton({
  active,
  onClick,
  icon: Icon,
  label,
  iconOnly,
}: {
  active: boolean
  onClick: () => void
  icon: ComponentType<{ className?: string }>
  label: string
  iconOnly?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center justify-center gap-1.5 rounded-full outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50',
        iconOnly ? 'size-8' : 'h-8 px-3 text-xs font-medium',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
      )}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      title={label}
    >
      <Icon className="size-3.5 shrink-0" />
      {iconOnly ? null : (
        <span className="hidden max-w-[9rem] truncate lg:inline">{label}</span>
      )}
    </button>
  )
}

export const AppNavIconButton = forwardRef<
  HTMLButtonElement,
  ComponentProps<'button'> & { active?: boolean }
>(function AppNavIconButton(
  { active, className, type = 'button', children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50',
        active
          ? 'bg-muted text-foreground'
          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
})
