import { useRef, useState, type ReactNode } from 'react'
import {
  Check,
  FolderOpen,
  FolderPlus,
  ImagePlus,
  Info,
  Languages,
  Monitor,
  Moon,
  Palette,
  Shield,
  Sun,
  UserRound,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProjectTitleFields } from '@/components/project/ProjectTitleFields'
import { AceTrackerIcon } from '@/components/brand/AceTrackerIcon'
import {
  buildProjectTitle,
  useWorkspace,
  fileToAvatarDataUrl,
  type ProjectDateFormat,
  type ThemeMode,
  type UserSettings,
  type Locale,
} from '@/shared'
import { translate } from '@/locales'
import { onboardingMessages } from '@/locales/pages/onboarding'

type Step = 0 | 1 | 2 | 3 | 4

const TOTAL_STEPS = 5

const fieldClass =
  'h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:ring-3 focus-visible:ring-ring/50'

function OptionCard({
  selected,
  title,
  icon,
  onClick,
}: {
  selected: boolean
  title: string
  icon?: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left ring-1 transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
        selected
          ? 'bg-primary text-primary-foreground ring-primary'
          : 'bg-background ring-foreground/10 hover:bg-muted/40'
      }`}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span className="min-w-0 flex-1 text-sm font-medium">{title}</span>
      {selected ? (
        <Check className="size-3.5 shrink-0" strokeWidth={2.5} />
      ) : null}
    </button>
  )
}

function StepIcon({
  active,
  done,
  children,
}: {
  active: boolean
  done: boolean
  children: ReactNode
}) {
  return (
    <span
      className={`flex size-10 shrink-0 items-center justify-center rounded-full transition ${
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : done
            ? 'bg-primary/15 text-primary'
            : 'bg-muted text-muted-foreground'
      }`}
    >
      {done && !active ? <Check className="size-4" strokeWidth={2.5} /> : children}
    </span>
  )
}

export function OnboardingPage() {
  const { completeSetup, saveSetupProgress, setTheme, settings } =
    useWorkspace()
  const [step, setStep] = useState<Step>(
    () => Math.min(4, Math.max(0, settings.setupStep)) as Step,
  )
  const [draft, setDraft] = useState<UserSettings>({
    ...settings,
    setupComplete: false,
  })
  const [workspaceName, setWorkspaceName] = useState(
    () => settings.pendingWorkspaceName,
  )
  const [homeTeam, setHomeTeam] = useState(() => settings.pendingHomeTeam)
  const [awayTeam, setAwayTeam] = useState(() => settings.pendingAwayTeam)
  const [projectName, setProjectName] = useState(
    () => settings.pendingProjectName,
  )
  const [folderNote, setFolderNote] = useState<string | null>(null)
  const [folderSkipped, setFolderSkipped] = useState(
    () => !settings.projectsFolderLabel && settings.setupStep >= 4,
  )
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const avatarRef = useRef<HTMLInputElement>(null)

  const t = translate(onboardingMessages, draft.locale)
  const nameOk = draft.displayName.trim().length > 0
  const workspaceOk = workspaceName.trim().length > 0
  const teamsOk = homeTeam.trim().length > 0 && awayTeam.trim().length > 0
  const folderOk = Boolean(draft.projectsFolderLabel) || folderSkipped
  const projectOk = teamsOk && folderOk

  const steps = [
    {
      phase: 'app' as const,
      title: t('stepLanguageTitle'),
      desc: t('stepLanguageDesc'),
      icon: <Languages className="size-4" />,
    },
    {
      phase: 'app' as const,
      title: t('stepThemeTitle'),
      desc: t('stepThemeDesc'),
      icon: <Palette className="size-4" />,
    },
    {
      phase: 'app' as const,
      title: t('stepNameTitle'),
      desc: t('stepNameDesc'),
      icon: <UserRound className="size-4" />,
    },
    {
      phase: 'setup' as const,
      title: t('stepWorkspaceTitle'),
      desc: t('stepWorkspaceDesc'),
      icon: <Users className="size-4" />,
    },
    {
      phase: 'setup' as const,
      title: t('stepProjectTitle'),
      desc: t('stepProjectDesc'),
      icon: <FolderPlus className="size-4" />,
    },
  ] as const

  const headings = [
    t('stepLanguageHeading'),
    t('stepThemeHeading'),
    t('stepNameHeading'),
    t('stepWorkspaceHeading'),
    t('stepProjectHeading'),
  ] as const

  const bodies = [
    t('stepLanguageBody'),
    t('stepThemeBody'),
    t('stepNameBody'),
    t('stepWorkspaceBody'),
    t('stepProjectBody'),
  ] as const

  async function pickFolder() {
    const picker = (
      window as Window & {
        showDirectoryPicker?: () => Promise<{ name: string }>
      }
    ).showDirectoryPicker

    if (!picker) {
      setFolderNote(t('folderFallback'))
      setFolderSkipped(true)
      setDraft((prev) => ({
        ...prev,
        projectsFolderLabel: null,
      }))
      return
    }

    try {
      const handle = await picker()
      setDraft((prev) => ({
        ...prev,
        projectsFolderLabel: handle.name,
      }))
      setFolderSkipped(false)
      setFolderNote(t('folderPicked', { name: handle.name }))
    } catch {
    }
  }

  function setLocale(locale: Locale) {
    setDraft((prev) => ({ ...prev, locale }))
  }

  function setThemeMode(theme: ThemeMode) {
    setDraft((prev) => ({ ...prev, theme }))
    setTheme(theme)
  }

  async function onAvatarFile(file: File | undefined) {
    if (!file) return
    setAvatarError(null)
    try {
      const avatarDataUrl = await fileToAvatarDataUrl(file)
      setDraft((prev) => ({ ...prev, avatarDataUrl }))
    } catch {
      setAvatarError(t('avatarError'))
    }
  }

  function buildProgress(nextStep: Step): UserSettings {
    return {
      ...draft,
      displayName: draft.displayName.trim(),
      pendingWorkspaceName: workspaceName.trim(),
      pendingHomeTeam: homeTeam.trim(),
      pendingAwayTeam: awayTeam.trim(),
      pendingProjectName: projectName.trim(),
      setupComplete: false,
      setupStep: nextStep,
    }
  }

  function canProceed(): boolean {
    if (step === 2) return nameOk
    if (step === 3) return workspaceOk
    if (step === 4) return projectOk
    return true
  }

  function goNext() {
    if (!canProceed()) return
    if (step < 4) {
      const nextStep = (step + 1) as Step
      const progress = buildProgress(nextStep)
      setDraft(progress)
      saveSetupProgress(progress)
      setStep(nextStep)
      return
    }
    completeSetup(buildProgress(4), {
      workspaceName,
      homeTeam,
      awayTeam,
      projectName: buildProjectTitle({
        customName: projectName,
        homeTeam,
        awayTeam,
        includeDate: draft.projectTitleIncludeDate,
        dateFormat: draft.projectTitleDateFormat,
      }),
    })
  }

  return (
    <main className="flex min-h-svh w-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 md:px-6">
        <AceTrackerIcon className="size-8 rounded-lg ring-1 ring-foreground/10" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">
            {t('brand')}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {t('navSetup')}
          </p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="relative flex w-full flex-col gap-8 overflow-hidden border-b border-border bg-muted/40 px-6 py-8 lg:w-[min(38%,26rem)] lg:shrink-0 lg:border-b-0 lg:border-r lg:px-8 lg:py-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-48 opacity-[0.07]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='%23000' stroke-width='1'%3E%3Cpath d='M20 80 L50 60 L80 80 L50 100 Z'/%3E%3Cpath d='M50 60 L50 20 L80 40 L80 80'/%3E%3Cpath d='M50 20 L20 40 L20 80'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              backgroundPosition: 'bottom left',
            }}
          />

          <div className="relative flex gap-2.5 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p className="leading-relaxed">{t('sidebarIntro')}</p>
          </div>

          <div className="relative space-y-6">
            {(['app', 'setup'] as const).map((phase) => {
              const phaseSteps = steps
                .map((item, index) => ({ item, index }))
                .filter(({ item }) => item.phase === phase)
              return (
                <div key={phase} className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {phase === 'app' ? t('phaseApp') : t('phaseSetup')}
                  </p>
                  <ol className="relative space-y-0">
                    {phaseSteps.map(({ item, index }, phaseIndex) => {
                      const active = step === index
                      const done = step > index
                      const isLast = phaseIndex === phaseSteps.length - 1
                      return (
                        <li
                          key={item.title}
                          className="relative flex gap-4 pb-6 last:pb-0"
                        >
                          {!isLast ? (
                            <span
                              aria-hidden
                              className={`absolute top-10 bottom-0 left-5 w-px -translate-x-1/2 border-l border-dashed ${
                                done ? 'border-primary/40' : 'border-border'
                              }`}
                            />
                          ) : null}
                          <StepIcon active={active} done={done}>
                            {item.icon}
                          </StepIcon>
                          <div className="min-w-0 pt-1.5">
                            <p
                              className={`text-sm font-semibold leading-snug ${
                                active
                                  ? 'text-foreground'
                                  : done
                                    ? 'text-foreground/80'
                                    : 'text-muted-foreground'
                              }`}
                            >
                              {item.title}
                            </p>
                            <p
                              className={`mt-1 text-xs leading-relaxed ${
                                active
                                  ? 'text-muted-foreground'
                                  : 'text-muted-foreground/70'
                              }`}
                            >
                              {item.desc}
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                </div>
              )
            })}
          </div>
        </aside>

        <section className="flex flex-1 flex-col px-6 py-8 md:px-10 md:py-12 lg:px-14 lg:py-14">
          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
            <p className="text-xs font-semibold tracking-[0.12em] text-primary">
              {t('stepOf', {
                current: String(step + 1),
                total: String(TOTAL_STEPS),
              })}
            </p>
            <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              {headings[step]}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-[0.95rem]">
              {bodies[step]}
            </p>

            <div className="mt-8 flex flex-1 flex-col gap-6">
              {step === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t('languageHint')}
                  </p>
                  <div className="grid gap-2.5">
                    <OptionCard
                      selected={draft.locale === 'de'}
                      title={t('langDe')}
                      onClick={() => setLocale('de')}
                    />
                    <OptionCard
                      selected={draft.locale === 'en'}
                      title={t('langEn')}
                      onClick={() => setLocale('en')}
                    />
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t('themeHint')}
                  </p>
                  <div className="grid gap-2.5">
                    <OptionCard
                      selected={draft.theme === 'light'}
                      title={t('themeLight')}
                      icon={<Sun className="size-4" />}
                      onClick={() => setThemeMode('light')}
                    />
                    <OptionCard
                      selected={draft.theme === 'system'}
                      title={t('themeSystem')}
                      icon={<Monitor className="size-4" />}
                      onClick={() => setThemeMode('system')}
                    />
                    <OptionCard
                      selected={draft.theme === 'dark'}
                      title={t('themeDark')}
                      icon={<Moon className="size-4" />}
                      onClick={() => setThemeMode('dark')}
                    />
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => avatarRef.current?.click()}
                      className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-foreground/10 outline-none transition hover:ring-foreground/25 focus-visible:ring-3 focus-visible:ring-ring/50"
                      aria-label={t('avatarPick')}
                    >
                      {draft.avatarDataUrl ? (
                        <img
                          src={draft.avatarDataUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <ImagePlus className="size-6 text-muted-foreground" />
                      )}
                    </button>
                    <div className="min-w-0 space-y-2">
                      <p className="text-sm font-semibold">{t('avatarLabel')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('avatarHint')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => avatarRef.current?.click()}
                        >
                          {draft.avatarDataUrl
                            ? t('avatarChange')
                            : t('avatarPick')}
                        </Button>
                        {draft.avatarDataUrl ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                avatarDataUrl: null,
                              }))
                            }
                          >
                            {t('avatarRemove')}
                          </Button>
                        ) : null}
                      </div>
                      <input
                        ref={avatarRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) =>
                          void onAvatarFile(event.target.files?.[0])
                        }
                      />
                    </div>
                  </div>
                  {avatarError ? (
                    <p className="text-sm text-destructive">{avatarError}</p>
                  ) : null}

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold">{t('nameLabel')}</span>
                    <input
                      value={draft.displayName}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          displayName: event.target.value,
                        }))
                      }
                      placeholder={t('namePlaceholder')}
                      autoFocus
                      className={fieldClass}
                    />
                  </label>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {nameOk ? t('nameHint') : t('nameRequired')}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        isPlayer: !prev.isPlayer,
                      }))
                    }
                    aria-pressed={draft.isPlayer}
                    className={`flex w-full items-start gap-3 rounded-xl px-4 py-3.5 text-left ring-1 transition outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                      draft.isPlayer
                        ? 'bg-primary text-primary-foreground ring-primary'
                        : 'bg-background ring-foreground/10 hover:bg-muted/40'
                    }`}
                  >
                    <span className="min-w-0 flex-1 space-y-0.5">
                      <span className="block text-sm font-semibold">
                        {t('isPlayerLabel')}
                      </span>
                      <span
                        className={`block text-xs leading-relaxed ${
                          draft.isPlayer
                            ? 'text-primary-foreground/80'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {t('isPlayerHint')}
                      </span>
                    </span>
                    {draft.isPlayer ? (
                      <Check
                        className="mt-0.5 size-3.5 shrink-0"
                        strokeWidth={2.5}
                      />
                    ) : null}
                  </button>

                  <div className="flex gap-2.5 rounded-xl bg-muted/40 px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
                    <Shield className="mt-0.5 size-4 shrink-0" />
                    <p>{t('profilePrivacy')}</p>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold">
                      {t('workspaceLabel')}
                    </span>
                    <input
                      value={workspaceName}
                      onChange={(event) => setWorkspaceName(event.target.value)}
                      placeholder={t('workspacePlaceholder')}
                      autoFocus
                      className={fieldClass}
                    />
                  </label>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {workspaceOk ? t('workspaceHint') : t('workspaceRequired')}
                  </p>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold">
                        {t('homeTeam')}
                      </span>
                      <input
                        value={homeTeam}
                        onChange={(event) => setHomeTeam(event.target.value)}
                        placeholder={t('homeTeamPlaceholder')}
                        autoFocus
                        className={fieldClass}
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-semibold">
                        {t('awayTeam')}
                      </span>
                      <input
                        value={awayTeam}
                        onChange={(event) => setAwayTeam(event.target.value)}
                        placeholder={t('awayTeamPlaceholder')}
                        className={fieldClass}
                      />
                    </label>
                  </div>
                  <ProjectTitleFields
                    projectName={projectName}
                    onProjectNameChange={setProjectName}
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    includeDate={draft.projectTitleIncludeDate}
                    onIncludeDateChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        projectTitleIncludeDate: value,
                      }))
                    }
                    dateFormat={draft.projectTitleDateFormat}
                    onDateFormatChange={(value: ProjectDateFormat) =>
                      setDraft((prev) => ({
                        ...prev,
                        projectTitleDateFormat: value,
                      }))
                    }
                    labels={{
                      titleOptional: t('projectNameOptional'),
                      titlePlaceholder: t('projectNamePlaceholder'),
                      includeDate: t('projectTitleIncludeDate'),
                      dateFormat: t('projectTitleDateFormat'),
                      preview: t('projectTitlePreview'),
                    }}
                  />
                  {!teamsOk ? (
                    <p className="text-xs text-muted-foreground">
                      {t('projectTeamsRequired')}
                    </p>
                  ) : null}

                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background ring-1 ring-foreground/5">
                        <FolderOpen
                          className="size-4 text-foreground/80"
                          strokeWidth={1.75}
                        />
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-semibold">
                          {draft.projectsFolderLabel
                            ? t('folderPicked', {
                                name: draft.projectsFolderLabel,
                              })
                            : t('pickFolder')}
                        </p>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {folderNote ?? t('folderHint')}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          draft.projectsFolderLabel ? 'outline' : 'default'
                        }
                        onClick={() => void pickFolder()}
                      >
                        <FolderOpen data-icon="inline-start" />
                        {draft.projectsFolderLabel
                          ? t('changeFolder')
                          : t('pickFolder')}
                      </Button>
                    </div>
                  </div>
                  {!folderOk ? (
                    <p className="text-xs text-muted-foreground">
                      {t('folderRequired')}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <footer className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-6">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    const prevStep = (step - 1) as Step
                    const progress = buildProgress(prevStep)
                    setDraft(progress)
                    saveSetupProgress(progress)
                    setStep(prevStep)
                  }}
                >
                  {t('back')}
                </Button>
              ) : (
                <span />
              )}
              <div className="flex-1" />
              <Button
                type="button"
                size="lg"
                onClick={goNext}
                disabled={!canProceed()}
              >
                {step < 4 ? t('continue') : t('finish')}
              </Button>
            </footer>
          </div>
        </section>
      </div>
    </main>
  )
}
