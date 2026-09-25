import { Download } from 'lucide-react'
import { ToolCard } from '@/components/home/ToolCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/shared'
import { toolRegistry } from '@/tools/registry'
import { useLocales } from '@/locales'
import { projectMessages } from '@/locales/pages/project'

export function ProjectPage() {
  const { activeProject, navigate, exportAceproj, locale } = useWorkspace()
  const t = useLocales(projectMessages)

  if (!activeProject) {
    return null
  }

  const { project } = activeProject

  return (
    <main className="flex min-h-svh w-full flex-col gap-8 p-6 md:p-8">
      <header className="space-y-4 border-b border-border pb-6">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void exportAceproj()}
          >
            <Download data-icon="inline-start" />
            {t('exportFile')}
          </Button>
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {t('playersCount', { count: project.squad.length })}
            </Badge>
            <Badge variant="outline">
              {t('eventsCount', { count: project.events.length })}
            </Badge>
            {project.lineups.home.length > 0 ? (
              <Badge variant="outline">
                {t('inLineup', { count: project.lineups.home.length })}
              </Badge>
            ) : null}
            {project.teams.home.name && project.teams.away.name ? (
              <Badge variant="outline">
                {project.teams.home.name} vs {project.teams.away.name}
              </Badge>
            ) : null}
          </div>
          <h1 className="font-heading text-3xl font-medium tracking-tight">
            {project.name}
          </h1>
          <p className="text-sm text-muted-foreground">{t('projectTools')}</p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {toolRegistry.map(({ manifest }) => (
          <ToolCard
            key={manifest.id}
            title={manifest.title[locale]}
            description={manifest.description[locale]}
            icon={manifest.icon}
            onClick={() => navigate(manifest.id)}
          />
        ))}
      </section>
    </main>
  )
}
