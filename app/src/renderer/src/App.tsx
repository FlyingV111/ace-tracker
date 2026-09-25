import { useEffect } from 'react'
import { WorkspaceProvider, useWorkspace, isToolId } from '@/shared'
import { CollabProvider } from '@/shared/collab'
import '@/shared/cloud'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { ProjectsPage } from '@/pages/ProjectsPage'
import { ProjectLayout } from '@/pages/ProjectLayout'

function AppRoutes() {
  const { settings, view, activeProject, activeWorkspace } = useWorkspace()

  useEffect(() => {
    window.electronAPI?.setSplashStatus?.(
      settings.setupComplete
        ? 'Projekte werden geladen…'
        : 'Einrichtung wird vorbereitet…',
    )

    const frame = requestAnimationFrame(() => {
      window.electronAPI?.setSplashStatus?.('Fertig')
      window.electronAPI?.notifyAppReady?.()
    })

    return () => cancelAnimationFrame(frame)
  }, [settings.setupComplete])

  if (!settings.setupComplete) {
    return <OnboardingPage />
  }

  if (view === 'projects' || !activeWorkspace) {
    return <ProjectsPage />
  }

  if (view === 'project' || isToolId(view)) {
    if (activeProject) return <ProjectLayout />
    return <ProjectsPage />
  }

  return <ProjectsPage />
}

export default function App() {
  return (
    <WorkspaceProvider>
      <CollabProvider>
        <AppRoutes />
      </CollabProvider>
    </WorkspaceProvider>
  )
}
