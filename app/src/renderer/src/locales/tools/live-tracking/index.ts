import type { Locale } from '@/shared'
import { de } from './de'
import { en } from './en'

export const liveTrackingMessages = { de, en } as const satisfies Record<
  Locale,
  Record<string, string>
>
