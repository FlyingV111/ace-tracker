import { useLocales } from '@/locales'
import { liveTrackingMessages } from '@/locales/tools/live-tracking'

export function useLiveTrackingI18n() {
  return useLocales(liveTrackingMessages)
}
