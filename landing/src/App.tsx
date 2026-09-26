import { useEffect, useId, useState } from 'react'
import { copy, type Copy, type Locale } from './i18n'
import {
  fetchLatestRelease,
  formatBytes,
  getGithubRepo,
  releasesPageUrl,
  type LatestRelease,
} from './releases'

const btnPrimary =
  'inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
const btnOutline =
  'inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
const btnGhost =
  'inline-flex h-11 items-center justify-center rounded-lg border border-border/80 bg-transparent px-5 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

const coffeeUrl = import.meta.env.VITE_COFFEE_URL?.trim() || ''

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SectionHeading({
  title,
  body,
}: {
  title: string
  body?: string
}) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
        {title}
      </h2>
      {body ? (
        <p className="mt-3 text-base leading-relaxed text-muted-foreground md:text-lg">
          {body}
        </p>
      ) : null}
    </div>
  )
}

function FaqItem({
  question,
  answer,
}: {
  question: string
  answer: string
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <div className="border-b border-border">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="text-base font-medium tracking-tight">{question}</span>
        <span
          aria-hidden
          className={`shrink-0 text-lg leading-none text-muted-foreground transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
        >
          +
        </span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-hidden={!open}
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <p className="pb-5 pr-8 text-sm leading-relaxed text-muted-foreground md:text-base">
            {answer}
          </p>
        </div>
      </div>
    </div>
  )
}

function WorkflowPanel({
  phase,
}: {
  phase: Copy['workflow']['phases'][number]
}) {
  return (
    <div className="anim-panel grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
      <div>
        <h3 className="text-xl font-semibold tracking-tight">{phase.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
          {phase.description}
        </p>
        <ul className="mt-5 space-y-2.5">
          {phase.points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-2.5 text-sm text-foreground/90"
            >
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-foreground" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 p-8">
        <div className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-xl border border-border bg-background text-sm font-semibold tracking-tight">
            {phase.id === 'project' ? '.ace' : phase.label.slice(0, 2)}
          </div>
          <p className="mt-3 text-xs font-medium tracking-wide text-muted-foreground">
            {phase.label}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    const stored = localStorage.getItem('ace-landing-locale')
    return stored === 'en' || stored === 'de' ? stored : 'de'
  })
  const [release, setRelease] = useState<LatestRelease | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>(
    'loading',
  )
  const [phaseIndex, setPhaseIndex] = useState(0)

  const t = copy[locale]
  const releasesUrl = releasesPageUrl()
  const githubUrl = `https://github.com/${getGithubRepo()}`
  const licenseUrl = `${githubUrl}#license`
  const phase = t.workflow.phases[phaseIndex] ?? t.workflow.phases[0]

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
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 md:h-16 md:px-8">
          <a
            href="#top"
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <img
              src="/icon-light.png"
              alt=""
              className="size-7 rounded-md object-cover ring-1 ring-foreground/10"
            />
            <span className="text-sm font-semibold tracking-tight">
              {t.brand}
            </span>
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            {(
              [
                ['#features', t.nav.features],
                ['#workflow', t.nav.workflow],
                ['#faq', t.nav.faq],
              ] as const
            ).map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {label}
              </a>
            ))}
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {t.nav.github}
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLocale((l) => (l === 'de' ? 'en' : 'de'))}
              className="rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {t.langToggle}
            </button>
            <a href="#download" className={`${btnPrimary} hidden sm:inline-flex`}>
              {t.nav.download}
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.96_0_0),transparent_60%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.4] [background-image:linear-gradient(to_right,oklch(0.922_0_0)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.922_0_0)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_30%,black,transparent)]"
          />

          <div className="relative mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="anim-rise text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                {t.hero.eyebrow}
              </p>
              <h1 className="anim-rise anim-rise-1 mt-5 text-3xl font-semibold tracking-tight text-balance md:text-5xl md:leading-[1.1]">
                {t.hero.headline}{' '}
                <span className="text-foreground/70">{t.hero.headlineAccent}</span>
              </h1>
              <p className="anim-rise anim-rise-2 mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                {t.hero.support}
              </p>

              <div className="anim-rise anim-rise-3 mt-8 flex flex-wrap items-center justify-center gap-3">
                <a href={installerUrl} className={btnPrimary}>
                  {t.hero.ctaPrimary}
                </a>
                <a href={portableUrl} className={btnOutline}>
                  {t.hero.ctaSecondary}
                </a>
              </div>

              <ul className="anim-rise anim-rise-3 mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {t.hero.trust.map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <CheckIcon className="size-3.5 text-foreground" />
                    {item}
                  </li>
                ))}
              </ul>

              <p className="anim-rise anim-rise-3 mt-4 text-sm text-muted-foreground">
                {status === 'loading' && t.hero.loading}
                {status === 'ready' && release && (
                  <>
                    {t.hero.versionLabel} {release.version}
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
                    {t.hero.unavailable} - {t.hero.allReleases}
                  </a>
                )}
              </p>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 border-b border-border px-5 py-20 md:px-8 md:py-24">
          <div className="mx-auto max-w-6xl">
            <SectionHeading title={t.features.title} body={t.features.body} />
            <ul className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
              {t.features.items.map((item, index) => (
                <li key={item.title} className="space-y-3">
                  <p className="text-xs font-medium tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="text-base font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="workflow"
          className="scroll-mt-20 border-b border-border bg-muted/35 px-5 py-20 md:px-8 md:py-24"
        >
          <div className="mx-auto max-w-6xl">
            <SectionHeading title={t.workflow.title} body={t.workflow.body} />

            <div
              role="tablist"
              aria-label={t.workflow.title}
              className="mt-10 flex gap-1 overflow-x-auto rounded-xl border border-border bg-background p-1"
            >
              {t.workflow.phases.map((item, index) => {
                const selected = index === phaseIndex
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setPhaseIndex(index)}
                    className={`shrink-0 rounded-lg px-3.5 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                      selected
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>

            <div
              role="tabpanel"
              className="mt-6 rounded-xl border border-border bg-background p-6 md:p-8"
            >
              <WorkflowPanel key={phase.id} phase={phase} />
            </div>
          </div>
        </section>

        <section className="border-b border-border px-5 py-20 md:px-8 md:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-8 rounded-2xl border border-border bg-muted/30 p-6 md:flex-row md:items-center md:justify-between md:p-10">
              <div className="max-w-xl">
                <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  {t.support.eyebrow}
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                  {t.support.title}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                  {coffeeUrl ? t.support.bodyWithCoffee : t.support.body}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
                {coffeeUrl ? (
                  <a
                    href={coffeeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={btnPrimary}
                  >
                    {t.support.ctaCoffee}
                  </a>
                ) : null}
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={coffeeUrl ? btnGhost : btnPrimary}
                >
                  {t.support.ctaGithub}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section
          id="faq"
          className="scroll-mt-20 border-b border-border px-5 py-20 md:px-8 md:py-24"
        >
          <div className="mx-auto max-w-3xl">
            <SectionHeading title={t.faq.title} />
            <div className="mt-8 border-t border-border">
              {t.faq.items.map((item) => (
                <FaqItem key={item.q} question={item.q} answer={item.a} />
              ))}
            </div>
          </div>
        </section>

        <section
          id="download"
          className="scroll-mt-20 border-b border-border bg-muted/35 px-5 py-20 md:px-8 md:py-24"
        >
          <div className="mx-auto max-w-6xl">
            <SectionHeading title={t.download.title} body={t.download.body} />
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              <DownloadCard
                href={installerUrl}
                title={t.download.installerTitle}
                body={t.download.installerBody}
                meta={
                  release?.installer
                    ? `${release.installer.name} · ${formatBytes(release.installer.size, locale)}`
                    : null
                }
              />
              <DownloadCard
                href={portableUrl}
                title={t.download.portableTitle}
                body={t.download.portableBody}
                meta={
                  release?.portable
                    ? `${release.portable.name} · ${formatBytes(release.portable.size, locale)}`
                    : null
                }
              />
            </div>
            <a
              href={releasesUrl}
              className="mt-8 inline-block text-sm font-medium underline-offset-4 hover:underline"
            >
              {t.hero.allReleases}
            </a>
          </div>
        </section>
      </main>

      <footer className="px-5 py-10 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5">
                <img
                  src="/icon-light.png"
                  alt=""
                  className="size-6 rounded-md object-cover ring-1 ring-foreground/10"
                />
                <span className="text-sm font-semibold tracking-tight">
                  {t.brand}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {t.footer.tagline}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t.footer.github}
              </a>
              <a
                href={licenseUrl}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t.footer.license}
              </a>
              <a
                href={releasesUrl}
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t.footer.releases}
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {t.footer.copyright}
              {release ? ` · ${t.hero.versionLabel} ${release.version}` : ''}
            </p>
            <p className="text-xs font-medium tracking-wide text-muted-foreground">
              {t.footer.offlineBadge}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function DownloadCard({
  href,
  title,
  body,
  meta,
}: {
  href: string
  title: string
  body: string
  meta: string | null
}) {
  return (
    <a
      href={href}
      className="flex flex-col rounded-xl border border-border bg-background p-5 transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="text-base font-semibold tracking-tight">{title}</span>
      <span className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {body}
      </span>
      {meta ? (
        <span className="mt-4 text-xs text-muted-foreground">{meta}</span>
      ) : null}
    </a>
  )
}
