import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import {
  FolderOpen,
  FolderPlus,
  ImagePlus,
  LayoutGrid,
  List,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WorkspaceHomeNav } from '@/components/layout/WorkspaceHomeNav'
import { ProjectTitleFields } from '@/components/project/ProjectTitleFields'
import { ProjectCard } from '@/components/project/ProjectCard'
import { TeamIcon } from '@/components/project/ProjectIcon'
import {
  buildProjectTitle,
  fileToAvatarDataUrl,
  useWorkspace,
  type MatchResult,
  type ProjectDateFormat,
} from '@/shared'
import { useLocales } from '@/locales'
import { projectsMessages } from '@/locales/pages/projects'
import { cn } from '@/lib/utils'

export function ProjectsPage() {
  const {
    projects,
    createProject,
    importAceproj,
    activeWorkspace,
    settings,
    updateProjectTitlePrefs,
    setProjectsViewMode,
    navigate,
  } = useWorkspace()
  const t = useLocales(projectsMessages)
  const [creating, setCreating] = useState(false)
  const [homeTeam, setHomeTeam] = useState('')
  const [awayTeam, setAwayTeam] = useState('')
  const [projectName, setProjectName] = useState('')
  const [includeDate, setIncludeDate] = useState(
    () => settings.projectTitleIncludeDate,
  )
  const [dateFormat, setDateFormat] = useState<ProjectDateFormat>(
    () => settings.projectTitleDateFormat,
  )
  const [result, setResult] = useState<MatchResult>(null)
  const [homeIcon, setHomeIcon] = useState<string | null>(null)
  const [awayIcon, setAwayIcon] = useState<string | null>(null)
  const [iconError, setIconError] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const homeIconRef = useRef<HTMLInputElement>(null)
  const awayIconRef = useRef<HTMLInputElement>(null)

  const canCreate = homeTeam.trim().length > 0 && awayTeam.trim().length > 0
  const viewMode = settings.projectsViewMode
  const tiles = viewMode === 'tiles'
  const previewName =
    projectName.trim() ||
    (homeTeam.trim() && awayTeam.trim()
      ? `${homeTeam.trim()} vs ${awayTeam.trim()}`
      : t('projectNamePlaceholder'))

  useEffect(() => {
    if (!creating || !activeWorkspace) return
    setHomeTeam((prev) => prev || activeWorkspace.name)
    setHomeIcon((prev) => prev ?? activeWorkspace.teamLogoDataUrl ?? null)
  }, [creating, activeWorkspace])

  function resetForm() {
    setHomeTeam('')
    setAwayTeam('')
    setProjectName('')
    setResult(null)
    setHomeIcon(null)
    setAwayIcon(null)
    setIconError(null)
    setCreating(false)
  }

  function onIncludeDateChange(value: boolean) {
    setIncludeDate(value)
    updateProjectTitlePrefs({ includeDate: value })
  }

  function onDateFormatChange(value: ProjectDateFormat) {
    setDateFormat(value)
    updateProjectTitlePrefs({ dateFormat: value })
  }

  async function pickIcon(
    file: File | undefined,
    setter: (value: string | null) => void,
  ) {
    if (!file) return
    setIconError(null)
    try {
      setter(await fileToAvatarDataUrl(file))
    } catch {
      setIconError(t('iconError'))
    }
  }

  function onCreate(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canCreate || !activeWorkspace) return
    createProject({
      homeTeam,
      awayTeam,
      name: buildProjectTitle({
        customName: projectName,
        homeTeam,
        awayTeam,
        includeDate,
        dateFormat,
      }),
      homeIconDataUrl: homeIcon,
      awayIconDataUrl: awayIcon,
      result,
    })
    resetForm()
  }

  async function onImport(file: File | undefined) {
    if (!file) return
    setImportError(null)
    try {
      await importAceproj(file)
    } catch {
      setImportError(t('importError'))
    }
  }

  const squadCount = activeWorkspace?.squad.length ?? 0

  return (
    <main className="flex min-h-svh w-full flex-col">
      <WorkspaceHomeNav brandFallback={t('brand')} />

      {!activeWorkspace ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            {t('noWorkspaceTitle')}
          </h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {t('noWorkspaceBody')}
          </p>
        </div>
      ) : (
        <div className="flex w-full flex-1 flex-col gap-6 px-5 py-6 md:px-8 md:py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h1 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
                {t('projectsTitle')}
              </h1>
              <p className="text-sm text-muted-foreground">{t('tagline')}</p>
              {squadCount === 0 ? (
                <button
                  type="button"
                  onClick={() => navigate('squad')}
                  className="mt-2 text-left text-xs font-medium text-primary underline-offset-2 hover:underline"
                >
                  {t('squadMissingHint')}
                </button>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('squadReadyHint', { count: squadCount })}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!creating ? (
                <>
                  <Button onClick={() => setCreating(true)}>
                    <FolderPlus data-icon="inline-start" />
                    {t('newProject')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                  >
                    <FolderOpen data-icon="inline-start" />
                    {t('importFile')}
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".aceproj,application/zip"
                    className="hidden"
                    onChange={(event) =>
                      void onImport(event.target.files?.[0])
                    }
                  />
                </>
              ) : null}
            </div>
          </div>

          {creating ? (
            <form
              onSubmit={onCreate}
              className="space-y-4 rounded-xl border border-border p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">{t('createTitle')}</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={resetForm}
                  aria-label={t('cancel')}
                >
                  <X />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => projectIconRef.current?.click()}
                  className="outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {projectIcon ? (
                    <img
                      src={projectIcon}
                      alt=""
                      className="size-14 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="flex size-14 items-center justify-center rounded-xl bg-muted px-1 text-center text-[0.7rem] font-semibold">
                      {canCreate
                        ? projectLetterMark(homeTeam, awayTeam)
                        : <ImagePlus className="size-5 text-muted-foreground" />}
                    </span>
                  )}
                </button>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t('projectIcon')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('projectIconHint')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => projectIconRef.current?.click()}
                    >
                      {t('projectIconChange')}
                    </Button>
                    {projectIcon ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setProjectIcon(null)}
                      >
                        {t('iconRemove')}
                      </Button>
                    ) : null}
                  </div>
                </div>
                <input
                  ref={projectIconRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    void pickIcon(event.target.files?.[0], setProjectIcon)
                  }
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs font-normal text-muted-foreground">
                    {t('homeTeam')}
                  </Label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => homeIconRef.current?.click()}
                      className="shrink-0 outline-none"
                    >
                      <TeamIcon name={homeTeam} iconDataUrl={homeIcon} />
                    </button>
                    <Input
                      value={homeTeam}
                      onChange={(event) => setHomeTeam(event.target.value)}
                      placeholder={t('homeTeamPlaceholder')}
                      className="h-10"
                      autoFocus
                    />
                  </div>
                  <input
                    ref={homeIconRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      void pickIcon(event.target.files?.[0], setHomeIcon)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-normal text-muted-foreground">
                    {t('awayTeam')}
                  </Label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => awayIconRef.current?.click()}
                      className="shrink-0 outline-none"
                    >
                      <TeamIcon name={awayTeam} iconDataUrl={awayIcon} />
                    </button>
                    <Input
                      value={awayTeam}
                      onChange={(event) => setAwayTeam(event.target.value)}
                      placeholder={t('awayTeamPlaceholder')}
                      className="h-10"
                    />
                  </div>
                  <input
                    ref={awayIconRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      void pickIcon(event.target.files?.[0], setAwayIcon)
                    }
                  />
                </div>
              </div>

              <ProjectTitleFields
                projectName={projectName}
                onProjectNameChange={setProjectName}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                includeDate={includeDate}
                onIncludeDateChange={onIncludeDateChange}
                dateFormat={dateFormat}
                onDateFormatChange={onDateFormatChange}
                labels={{
                  titleOptional: t('projectNameOptional'),
                  titlePlaceholder: t('projectNamePlaceholder'),
                  includeDate: t('projectTitleIncludeDate'),
                  dateFormat: t('projectTitleDateFormat'),
                  preview: t('projectTitlePreview'),
                }}
              />

              <div className="space-y-1.5">
                <Label className="text-xs font-normal text-muted-foreground">
                  {t('matchResult')}
                </Label>
                <Select
                  value={result ?? 'open'}
                  onValueChange={(value) => {
                    setResult(
                      value === 'open'
                        ? null
                        : (value as Exclude<MatchResult, null>),
                    )
                  }}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">{t('resultOpen')}</SelectItem>
                    <SelectItem value="home" disabled={!homeTeam.trim()}>
                      {t('resultHome', {
                        team: homeTeam.trim() || t('homeTeam'),
                      })}
                    </SelectItem>
                    <SelectItem value="away" disabled={!awayTeam.trim()}>
                      {t('resultAway', {
                        team: awayTeam.trim() || t('awayTeam'),
                      })}
                    </SelectItem>
                    <SelectItem value="draw">{t('resultDraw')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  {t('matchResultHint')}
                </p>
              </div>

              {iconError ? (
                <p className="text-xs text-destructive">{iconError}</p>
              ) : null}

              <p className="text-xs text-muted-foreground">
                {t('projectTitlePreview')}:{' '}
                <span className="font-medium text-foreground">
                  {previewName}
                </span>
              </p>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm" disabled={!canCreate}>
                  {t('create')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={resetForm}
                >
                  {t('cancel')}
                </Button>
              </div>
            </form>
          ) : null}

          {importError ? (
            <p className="text-sm text-destructive">{importError}</p>
          ) : null}

          {projects.length === 0 && !creating ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
              <h2 className="text-base font-semibold tracking-tight">
                {t('projectsEmptyTitle')}
              </h2>
              <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {t('projectsEmptyBody')}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button onClick={() => setCreating(true)}>
                  <FolderPlus data-icon="inline-start" />
                  {t('newProject')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                >
                  <FolderOpen data-icon="inline-start" />
                  {t('importFile')}
                </Button>
              </div>
            </div>
          ) : null}

          {projects.length > 0 ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {t('projectsCount', { count: projects.length })}
                </p>
                <div
                  role="group"
                  aria-label={t('projectsViewSwitch')}
                  className="grid grid-cols-2 rounded-lg bg-muted/60 p-1"
                >
                  <button
                    type="button"
                    aria-pressed={tiles}
                    aria-label={t('projectsViewTiles')}
                    onClick={() => setProjectsViewMode('tiles')}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-md outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50',
                      tiles
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <LayoutGrid className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-pressed={!tiles}
                    aria-label={t('projectsViewList')}
                    onClick={() => setProjectsViewMode('list')}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-md outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50',
                      !tiles
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <List className="size-3.5" />
                  </button>
                </div>
              </div>
              {tiles ? (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {projects.map((ace) => (
                    <ProjectCard
                      key={ace.project.id}
                      ace={ace}
                      layout="tiles"
                    />
                  ))}
                </ul>
              ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                  {projects.map((ace) => (
                    <ProjectCard
                      key={ace.project.id}
                      ace={ace}
                      layout="list"
                    />
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </div>
      )}
    </main>
  )
}
