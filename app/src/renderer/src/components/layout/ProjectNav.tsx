import {
  AppNav,
  AppNavHomeButton,
  AppNavPill,
  AppNavTabButton,
} from '@/components/layout/AppNav'
import { CollabMenu } from '@/components/layout/CollabMenu'
import { useLocales } from '@/locales'
import { projectMessages } from '@/locales/pages/project'
import { isToolId, useWorkspace, type ToolId } from '@/shared'
import { toolRegistry } from '@/tools/registry'

export function ProjectNav({ showTabs }: { showTabs: boolean }) {
  const { activeProject, closeProject, enterTool, view, locale } =
    useWorkspace()
  const t = useLocales(projectMessages)

  if (!activeProject) return null

  const activeTab: ToolId | null = isToolId(view)
    ? view
    : activeProject.lastToolId

  return (
    <AppNav
      center={
        <AppNavPill aria-label={t('toolTabs')}>
          <AppNavHomeButton
            onClick={closeProject}
            label={t('homeToProjects')}
          />
          {showTabs
            ? toolRegistry.map(({ manifest }) => (
                <AppNavTabButton
                  key={manifest.id}
                  active={activeTab === manifest.id}
                  onClick={() => enterTool(manifest.id)}
                  icon={manifest.icon}
                  label={manifest.title[locale]}
                  iconOnly={false}
                />
              ))
            : null}
        </AppNavPill>
      }
      end={<CollabMenu />}
    />
  )
}
