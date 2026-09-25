import { ProjectNav } from '@/components/layout/ProjectNav'
import { ToolPageHeader } from '@/components/layout/ToolPageHeader'
import { useLocales } from '@/locales'
import { projectMessages } from '@/locales/pages/project'
import { isToolId, useWorkspace, type ToolId } from '@/shared'
import { getToolPage, toolRegistry } from '@/tools/registry'
import { cn } from '@/lib/utils'

function ModePicker() {
  const { enterTool, locale, activeProject } = useWorkspace()
  const t = useLocales(projectMessages)

  if (!activeProject) return null

  return (
    <div className="flex flex-1 flex-col px-5 py-6 md:px-8 md:py-8">
      <ToolPageHeader
        title={activeProject.project.name}
        description={t('pickMode')}
      />

      <div className="mt-8 grid w-full max-w-5xl gap-4 self-center md:grid-cols-3">
        {toolRegistry.map(({ manifest }) => {
          const Icon = manifest.icon
          const available = manifest.available
          return (
            <button
              key={manifest.id}
              type="button"
              disabled={!available}
              onClick={() => {
                if (available) enterTool(manifest.id)
              }}
              className={cn(
                'flex min-h-[14rem] flex-col rounded-2xl border border-border bg-background p-6 text-left outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50',
                available
                  ? 'hover:bg-muted/40 hover:ring-1 hover:ring-foreground/10'
                  : 'cursor-not-allowed opacity-60',
              )}
            >
              <span className="mb-5 flex size-12 items-center justify-center rounded-xl bg-muted">
                <Icon className="size-5" />
              </span>
              <span className="flex items-center gap-2">
                <span className="text-lg font-semibold tracking-tight">
                  {manifest.title[locale]}
                </span>
                {!available ? (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {t('comingSoon')}
                  </span>
                ) : null}
              </span>
              <span className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {manifest.description[locale]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ComingSoonPanel({ toolId }: { toolId: ToolId }) {
  const { locale } = useWorkspace()
  const t = useLocales(projectMessages)
  const manifest = toolRegistry.find((tool) => tool.manifest.id === toolId)
    ?.manifest
  if (!manifest) return null

  return (
    <div className="flex flex-1 flex-col px-5 py-6 md:px-8 md:py-8">
      <ToolPageHeader
        title={manifest.title[locale]}
        description={t('comingSoonBody')}
      />
    </div>
  )
}

export function ProjectLayout() {
  const { activeProject, view } = useWorkspace()

  if (!activeProject) return null

  const hasEntered = Boolean(activeProject.lastToolId)
  const activeTool: ToolId | null = isToolId(view)
    ? view
    : activeProject.lastToolId

  const showPicker = !hasEntered
  const manifest = activeTool
    ? toolRegistry.find((tool) => tool.manifest.id === activeTool)?.manifest
    : null
  const Page =
    activeTool && manifest?.available ? getToolPage(activeTool) : null

  return (
    <main className="relative flex min-h-svh w-full flex-col">
      <ProjectNav showTabs={hasEntered} />
      {showPicker ? (
        <ModePicker />
      ) : Page ? (
        <div className="flex flex-1 flex-col px-5 py-6 md:px-8 md:py-8">
          <Page />
        </div>
      ) : activeTool ? (
        <ComingSoonPanel toolId={activeTool} />
      ) : (
        <ModePicker />
      )}
    </main>
  )
}
