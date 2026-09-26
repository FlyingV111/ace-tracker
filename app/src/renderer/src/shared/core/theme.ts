export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveTheme(theme: ThemeMode): ResolvedTheme {
  if (theme === 'system') {
    return getSystemPrefersDark() ? 'dark' : 'light'
  }
  return theme
}

export function applyDocumentTheme(resolved: ResolvedTheme): void {
  document.documentElement.classList.toggle('dark', resolved === 'dark')

  const existing = document.querySelectorAll<HTMLLinkElement>(
    "link[rel='icon']",
  )
  for (const link of existing) {
    link.remove()
  }

  const favicon = document.createElement('link')
  favicon.rel = 'icon'
  favicon.type = 'image/png'
  favicon.dataset.appIcon = '1'
  favicon.href =
    resolved === 'dark'
      ? '/ace-tracker-icon-light.png'
      : '/ace-tracker-icon-dark.png'
  document.head.appendChild(favicon)
}

export function syncElectronThemePreference(theme: ThemeMode): void {
  window.electronAPI?.setThemePreference?.(theme)
}
