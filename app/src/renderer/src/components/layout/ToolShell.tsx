import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/shared'

type ToolShellProps = {
  title: string
  description?: string
  children: ReactNode
}

export function ToolShell({ title, description, children }: ToolShellProps) {
  const { navigate, activeProject } = useWorkspace()

  return (
    <div className="flex min-h-svh w-full flex-col gap-6 p-6 md:p-8">
      <header className="flex items-start gap-3 border-b border-border pb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('project')}
          aria-label="Zurück zum Projekt"
        >
          <ArrowLeft />
        </Button>
        <div>
          {activeProject ? (
            <p className="text-xs text-muted-foreground">
              {activeProject.project.name}
            </p>
          ) : null}
          <h1 className="font-heading text-2xl font-medium tracking-tight">
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  )
}
