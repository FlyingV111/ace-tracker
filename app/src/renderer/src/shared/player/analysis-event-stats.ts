import type { AnalysisEvent } from '../core/types'

/** Map analysis event → season-stats type string (or null if not countable). */
export function analysisEventToStatType(event: AnalysisEvent): string | null {
  if (event.category === 'highlight') return null
  if (event.category === 'score_home' || event.category === 'score_away') {
    return null
  }
  if (
    event.category === 'wechsel' ||
    event.category === 'positionswechsel' ||
    event.category === 'auszeit' ||
    event.category === 'satzbeginn' ||
    event.category === 'satzende'
  ) {
    return null
  }
  if (
    event.category === 'freeball' ||
    event.category === 'touch' ||
    event.category === 'netz' ||
    event.category === 'aus'
  ) {
    return null
  }

  const q = event.quality
  switch (event.category) {
    case 'angriff':
      if (q === 'kill' || q === 'punkt') return 'angriff_kill'
      if (q === 'fehler') return 'angriff_fehler'
      return 'angriff'
    case 'block':
      if (q === 'kill' || q === 'punkt') return 'block_stuff'
      if (q === 'fehler') return 'block_fehler'
      return 'block'
    case 'annahme':
      if (q === 'gut') return 'annahme_gut'
      if (q === 'mittel') return 'annahme_mittel'
      if (q === 'fehler') return 'annahme_fehler'
      if (q === 'schlecht') return 'annahme_mittel'
      return 'annahme_perfekt'
    case 'abwehr':
    case 'rettung':
      if (q === 'fehler') return 'abwehr_fehler'
      return 'abwehr'
    case 'aufschlag':
      if (q === 'ass') return 'aufschlag_ace'
      if (q === 'fehler') return 'aufschlag_fehler'
      return 'aufschlag'
    case 'zuspiel':
      if (q === 'fehler') return 'zuspiel_fehler'
      return 'zuspiel_assist'
    case 'fehler':
      return null
    default:
      return null
  }
}
