import { useLocales } from '@/locales'
import { videoAnalysisMessages } from '@/locales/tools/video-analysis'

export function useVideoAnalysisI18n() {
  return useLocales(videoAnalysisMessages)
}
