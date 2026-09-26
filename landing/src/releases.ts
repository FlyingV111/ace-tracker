export type ReleaseAsset = {
  name: string
  url: string
  size: number
}

export type LatestRelease = {
  tag: string
  version: string
  htmlUrl: string
  installer: ReleaseAsset | null
  portable: ReleaseAsset | null
}

const DEFAULT_REPO = 'ace-tracker/ace-tracker'

export function getGithubRepo(): string {
  return import.meta.env.VITE_GITHUB_REPO?.trim() || DEFAULT_REPO
}

export function releasesPageUrl(repo = getGithubRepo()): string {
  return `https://github.com/${repo}/releases`
}

function stripV(tag: string): string {
  return tag.replace(/^v/i, '')
}

function pickAsset(
  assets: Array<{ name: string; browser_download_url: string; size: number }>,
  kind: 'installer' | 'portable',
): ReleaseAsset | null {
  const match =
    kind === 'installer'
      ? assets.find((a) => /setup/i.test(a.name) && /\.exe$/i.test(a.name))
      : assets.find((a) => /portable/i.test(a.name) && /\.exe$/i.test(a.name))

  if (!match) return null
  return {
    name: match.name,
    url: match.browser_download_url,
    size: match.size,
  }
}

export async function fetchLatestRelease(
  repo = getGithubRepo(),
): Promise<LatestRelease | null> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/releases/latest`,
    {
      headers: { Accept: 'application/vnd.github+json' },
    },
  )

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub API ${res.status}`)

  const data = (await res.json()) as {
    tag_name: string
    html_url: string
    assets: Array<{
      name: string
      browser_download_url: string
      size: number
    }>
  }

  return {
    tag: data.tag_name,
    version: stripV(data.tag_name),
    htmlUrl: data.html_url,
    installer: pickAsset(data.assets, 'installer'),
    portable: pickAsset(data.assets, 'portable'),
  }
}

export function formatBytes(bytes: number, locale: 'de' | 'en'): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '-'
  const units =
    locale === 'de'
      ? (['B', 'KB', 'MB', 'GB'] as const)
      : (['B', 'KB', 'MB', 'GB'] as const)
  let value = bytes
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i += 1
  }
  const formatted =
    locale === 'de'
      ? value.toLocaleString('de-DE', { maximumFractionDigits: 1 })
      : value.toLocaleString('en-US', { maximumFractionDigits: 1 })
  return `${formatted} ${units[i]}`
}
