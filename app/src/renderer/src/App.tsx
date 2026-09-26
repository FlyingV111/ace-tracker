import { useEffect } from 'react'
import { WorkspaceProvider, useWorkspace, isToolId } from '@/shared'
import { CollabProvider } from '@/shared/collab'
import '@/shared/cloud'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { ProjectsPage } from '@/pages/ProjectsPage'
import { SquadPage } from '@/pages/SquadPage'
import { PlayerPage } from '@/pages/PlayerPage'
import { ProjectLayout } from '@/pages/ProjectLayout'

function AppRoutes() {
  const { settings, view, activeProject, activeWorkspace } = useWorkspace()

  useEffect(() => {
    window.electronAPI?.setSplashStatus?.(
      settings.setupComplete
        ? 'Workspace wird geladen…'
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

  if (!activeWorkspace) {
    return <ProjectsPage />
  }

  if (view === 'squad') {
    return <SquadPage />
  }

  if (view === 'player') {
    return <PlayerPage />
  }

  if (view === 'games') {
    return <ProjectsPage />
  }

  if (view === 'game' || isToolId(view)) {
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
