import { useLocales } from '@/locales'
import { playerTrackerMessages } from '@/locales/tools/player-tracker'

export function usePlayerTrackerI18n() {
  return useLocales(playerTrackerMessages)
}
