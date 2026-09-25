import type { Locale } from '@/shared'
import { createTranslator, useWorkspace } from '@/shared'

type Catalog = Record<string, string>

export function useLocales(messages: Record<Locale, Catalog>) {
  const { locale } = useWorkspace()
  return createTranslator(messages, locale)
}

export function translate(
  messages: Record<Locale, Catalog>,
  locale: Locale,
) {
  return createTranslator(messages, locale)
}
