import { Trophy, Users } from 'lucide-react'
import {
  AppNav,
  AppNavBrand,
  AppNavPill,
  AppNavTabButton,
} from '@/components/layout/AppNav'
import { useLocales } from '@/locales'
import { projectsMessages } from '@/locales/pages/projects'
import { useWorkspace, type AppView } from '@/shared'

export function WorkspaceHomeNav({
  brandFallback,
}: {
  brandFallback?: string
}) {
  const { view, navigate, activeWorkspace } = useWorkspace()
  const t = useLocales(projectsMessages)

  if (!activeWorkspace) {
    return (
      <AppNav
        center={
          <AppNavBrand>{brandFallback ?? t('brand')}</AppNavBrand>
        }
      />
    )
  }

  const activeTab: Extract<AppView, 'squad' | 'games'> =
    view === 'squad' || view === 'player' ? 'squad' : 'games'

  return (
    <AppNav
      center={
        <AppNavPill aria-label={t('workspaceTabs')}>
          <AppNavTabButton
            active={activeTab === 'squad'}
            onClick={() => navigate('squad')}
            icon={Users}
            label={t('tabSquad')}
          />
          <AppNavTabButton
            active={activeTab === 'games'}
            onClick={() => navigate('games')}
            icon={Trophy}
            label={t('tabGames')}
          />
        </AppNavPill>
      }
    />
  )
}
