import type { Player } from '@/shared'
import { useToolStore, useWorkspace } from '@/shared'
import { ToolPageHeader } from '@/components/layout/ToolPageHeader'
import { usePlayerTrackerI18n } from '../locales/use-i18n'

export function PlayerTrackerPage() {
  const { activeProject } = useWorkspace()
  const [tracker] = useToolStore('player-tracker')
  const t = usePlayerTrackerI18n()
  const squad: Player[] =
    tracker?.squad ??
    activeProject?.tools['player-tracker']?.squad ??
    activeProject?.project.squad ??
    []

  return (
    <div className="space-y-4">
      <ToolPageHeader title={t('title')} description={t('description')} />
      {squad.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl ring-1 ring-foreground/10">
          {squad.map((player) => (
            <li
              key={player.id}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <span>
                #{player.number} {player.name}
              </span>
              <span className="text-muted-foreground">{player.position}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
