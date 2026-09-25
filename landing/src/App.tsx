import { useEffect, useState } from 'react'
import { copy, type Locale } from './i18n'
import {
  fetchLatestRelease,
  formatBytes,
  releasesPageUrl,
  type LatestRelease,
} from './releases'

const btnPrimary =
  'inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
const btnOutline =
  'inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    const stored = localStorage.getItem('ace-landing-locale')
    return stored === 'en' || stored === 'de' ? stored : 'de'
  })
  const [release, setRelease] = useState<LatestRelease | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>(
    'loading',
  )

  const t = copy[locale]
  const releasesUrl = releasesPageUrl()

  useEffect(() => {
    localStorage.setItem('ace-landing-locale', locale)
    document.documentElement.lang = locale
  }, [locale])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    fetchLatestRelease()
      .then((data) => {
        if (cancelled) return
        if (!data || (!data.installer && !data.portable)) {
          setRelease(data)
          setStatus('empty')
          return
        }
        setRelease(data)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const installerUrl = release?.installer?.url ?? releasesUrl
  const portableUrl = release?.portable?.url ?? releasesUrl

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="absolute inset-x-0 top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-5 backdrop-blur-md md:px-8">
        <div className="flex items-center gap-2.5">
          <img
            src="/icon-light.png"
            alt=""
            className="size-8 rounded-lg object-cover ring-1 ring-foreground/10"
          />
          <span className="text-sm font-semibold tracking-tight">{t.brand}</span>
        </div>
        <button
          type="button"
          onClick={() => setLocale((l) => (l === 'de' ? 'en' : 'de'))}
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {t.langToggle}
        </button>
      </header>

      <section className="relative flex min-h-dvh flex-col overflow-hidden">
        <div
          aria-hidden
          className="anim-fade pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,oklch(0.97_0_0)_0%,transparent_55%),radial-gradient(ellipse_50%_40%_at_15%_80%,oklch(0.95_0_0)_0%,transparent_50%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,oklch(0.922_0_0)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.922_0_0)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]"
        />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-12 px-5 pb-16 pt-28 md:flex-row md:items-center md:gap-16 md:px-8 md:pb-20 md:pt-32">
          <div className="max-w-xl shrink-0">
            <div className="anim-rise flex items-center gap-3">
              <img
                src="/icon-light.png"
                alt=""
                className="size-12 rounded-xl object-cover ring-1 ring-foreground/10 md:size-14"
              />
              <p className="text-2xl font-semibold tracking-tight md:text-3xl">
                {t.brand}
              </p>
            </div>

            <h1 className="anim-rise anim-rise-1 mt-8 text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl lg:leading-[1.1]">
              {t.headline}
            </h1>
            <p className="anim-rise anim-rise-2 mt-4 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
              {t.support}
            </p>

            <div className="anim-rise anim-rise-3 mt-8 flex flex-wrap items-center gap-3">
              <a href={installerUrl} className={btnPrimary}>
                {t.ctaInstaller}
              </a>
              <a href={portableUrl} className={btnOutline}>
                {t.ctaPortable}
              </a>
            </div>

            <p className="anim-rise anim-rise-3 mt-4 text-sm text-muted-foreground">
              {status === 'loading' && t.loading}
              {status === 'ready' && release && (
                <>
                  {t.versionLabel} {release.version}
                  {release.installer
                    ? ` · ${formatBytes(release.installer.size, locale)}`
                    : null}
                </>
              )}
              {(status === 'empty' || status === 'error') && (
                <a
                  href={releasesUrl}
                  className="underline-offset-4 hover:underline"
                >
                  {t.unavailable} — {t.ctaReleases}
                </a>
              )}
            </p>
          </div>

          <div className="anim-fade relative mx-auto flex w-full max-w-md flex-1 items-center justify-center md:max-w-none">
            <div
              aria-hidden
              className="absolute size-[min(72vw,28rem)] rounded-full bg-muted/80 blur-3xl"
            />
            <img
              src="/icon-light.png"
              alt=""
              className="anim-float relative z-10 w-[min(70vw,22rem)] rounded-[2rem] object-cover shadow-[0_40px_80px_-40px_oklch(0.145_0_0/0.35)] ring-1 ring-foreground/10"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/40 px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {t.aboutTitle}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            {t.aboutBody}
          </p>
        </div>
      </section>

      <section className="border-t border-border px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {t.toolsTitle}
          </h2>
          <ul className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {t.tools.map((tool, index) => (
              <li key={tool.title} className="space-y-2">
                <p className="text-xs font-medium tabular-nums text-muted-foreground">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="text-base font-semibold tracking-tight">
                  {tool.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {tool.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="download"
        className="border-t border-border bg-muted/40 px-5 py-20 md:px-8 md:py-24"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {t.downloadTitle}
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {t.downloadBody}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{t.offlineNote}</p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <a
              href={installerUrl}
              className="flex flex-col rounded-xl border border-border bg-background p-5 transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="text-base font-semibold tracking-tight">
                {t.installerTitle}
              </span>
              <span className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {t.installerBody}
              </span>
              {release?.installer ? (
                <span className="mt-4 text-xs text-muted-foreground">
                  {release.installer.name} ·{' '}
                  {formatBytes(release.installer.size, locale)}
                </span>
              ) : null}
            </a>
            <a
              href={portableUrl}
              className="flex flex-col rounded-xl border border-border bg-background p-5 transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="text-base font-semibold tracking-tight">
                {t.portableTitle}
              </span>
              <span className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {t.portableBody}
              </span>
              {release?.portable ? (
                <span className="mt-4 text-xs text-muted-foreground">
                  {release.portable.name} ·{' '}
                  {formatBytes(release.portable.size, locale)}
                </span>
              ) : null}
            </a>
          </div>

          <a
            href={releasesUrl}
            className="mt-8 inline-block text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t.ctaReleases}
          </a>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-8 md:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/icon-light.png"
              alt=""
              className="size-6 rounded-md object-cover ring-1 ring-foreground/10"
            />
            <p className="text-sm text-muted-foreground">{t.footerNote}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {release ? `${t.versionLabel} ${release.version}` : 'v0.1.0'}
          </p>
        </div>
      </footer>
    </div>
  )
}
