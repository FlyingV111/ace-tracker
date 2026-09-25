import type { TaggingEvent } from '@/shared'
import { useToolStore, useWorkspace } from '@/shared'
import { ToolPageHeader } from '@/components/layout/ToolPageHeader'
import { useLiveTrackingI18n } from '../locales/use-i18n'

export function LiveTrackingPage() {
  const { activeProject } = useWorkspace()
  const [live] = useToolStore('live-tracking')
  const t = useLiveTrackingI18n()
  const events: TaggingEvent[] =
    live?.events ??
    activeProject?.tools['live-tracking']?.events ??
    activeProject?.project.events ??
    []

  return (
    <div className="space-y-4">
      <ToolPageHeader title={t('title')} description={t('description')} />
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {events.map((event) => (
            <li key={event.id}>
              {event.type} @ {event.timeMs}ms
              {event.label ? ` - ${event.label}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
