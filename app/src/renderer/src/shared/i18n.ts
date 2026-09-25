import type { Locale } from './types'

type Vars = Record<string, string | number>
type Catalog = Record<string, string>

export function createTranslator(
  catalogs: Record<Locale, Catalog>,
  locale: Locale,
) {
  return (key: string, vars?: Vars): string => {
    let text = catalogs[locale][key] ?? catalogs.de[key] ?? key
    if (!vars) return text
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
    return text
  }
}
