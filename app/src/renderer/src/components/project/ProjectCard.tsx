import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ImagePlus, MoreVertical, Settings2, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ProjectIcon, TeamIcon } from '@/components/project/ProjectIcon'
import {
  fileToAvatarDataUrl,
  projectMatchupLabel,
  useWorkspace,
  winnerTeamName,
  type AceProject,
  type MatchResult,
} from '@/shared'
import { useLocales } from '@/locales'
import { projectsMessages } from '@/locales/pages/projects'
import { cn } from '@/lib/utils'

const fieldClass =
  'h-10 w-full rounded-lg border border-border bg-background px-3.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

type ProjectCardProps = {
  ace: AceProject
  layout: 'tiles' | 'list'
}

export function ProjectCard({ ace, layout }: ProjectCardProps) {
  const { openProject, updateProject, deleteProject } = useWorkspace()
  const t = useLocales(projectsMessages)
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editName, setEditName] = useState(ace.project.name)
  const [editResult, setEditResult] = useState<MatchResult>(
    ace.project.result ?? null,
  )
  const [editIcon, setEditIcon] = useState<string | null>(
    ace.project.iconDataUrl ?? null,
  )
  const [editHomeIcon, setEditHomeIcon] = useState<string | null>(
    ace.project.teams.home.iconDataUrl ?? null,
  )
  const [editAwayIcon, setEditAwayIcon] = useState<string | null>(
    ace.project.teams.away.iconDataUrl ?? null,
  )
  const [confirmName, setConfirmName] = useState('')
  const [iconError, setIconError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const projectIconRef = useRef<HTMLInputElement>(null)
  const homeIconRef = useRef<HTMLInputElement>(null)
  const awayIconRef = useRef<HTMLInputElement>(null)

  const matchup = projectMatchupLabel(ace.project)
  const winner = winnerTeamName(ace.project)
  const resultOpen = !ace.project.result

  useEffect(() => {
    if (!menuOpen) return
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [menuOpen])

  useEffect(() => {
    if (!settingsOpen) return
    setEditName(ace.project.name)
    setEditResult(ace.project.result ?? null)
    setEditIcon(ace.project.iconDataUrl ?? null)
    setEditHomeIcon(ace.project.teams.home.iconDataUrl ?? null)
    setEditAwayIcon(ace.project.teams.away.iconDataUrl ?? null)
    setIconError(null)
  }, [settingsOpen, ace])

  useEffect(() => {
    if (!deleteOpen) setConfirmName('')
  }, [deleteOpen])

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

  function onSaveSettings(event: FormEvent) {
    event.preventDefault()
    if (!editName.trim()) return
    updateProject(ace.project.id, {
      name: editName,
      result: editResult,
      iconDataUrl: editIcon,
      homeIconDataUrl: editHomeIcon,
      awayIconDataUrl: editAwayIcon,
    })
    setSettingsOpen(false)
  }

  function onConfirmDelete(event: FormEvent) {
    event.preventDefault()
    if (confirmName.trim() !== ace.project.name.trim()) return
    deleteProject(ace.project.id)
    setDeleteOpen(false)
  }

  const menu = (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={t('projectMenu')}
        aria-expanded={menuOpen}
        onClick={(event) => {
          event.stopPropagation()
          setMenuOpen((value) => !value)
        }}
        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <MoreVertical className="size-4" />
      </button>
      {menuOpen ? (
        <div className="absolute top-full right-0 z-20 mt-1 w-44 rounded-xl border border-border bg-background p-1.5 shadow-lg">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setMenuOpen(false)
              setSettingsOpen(true)
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition hover:bg-muted/60"
          >
            <Settings2 className="size-3.5 text-muted-foreground" />
            {t('projectSettings')}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setMenuOpen(false)
              setDeleteOpen(true)
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-destructive outline-none transition hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
            {t('projectDelete')}
          </button>
        </div>
      ) : null}
    </div>
  )

  const badges = (
    <>
      <Badge variant="outline">
        {t('playersCount', { count: ace.project.squad.length })}
      </Badge>
      <Badge variant="outline">
        {t('eventsCount', { count: ace.project.events.length })}
      </Badge>
      {ace.project.result === 'draw' ? (
        <Badge variant="secondary">{t('resultDraw')}</Badge>
      ) : winner ? (
        <Badge variant="secondary">
          {t('resultWinner', { team: winner })}
        </Badge>
      ) : (
        <Badge variant="outline">{t('resultOpen')}</Badge>
      )}
    </>
  )

  const dialogs = (
    <>
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={onSaveSettings} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>{t('projectSettings')}</DialogTitle>
              <DialogDescription>{t('projectSettingsHint')}</DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => projectIconRef.current?.click()}
                className="outline-none"
              >
                {editIcon ? (
                  <img
                    src={editIcon}
                    alt=""
                    className="size-14 rounded-xl object-cover"
                  />
                ) : (
                  <ProjectIcon
                    project={{
                      ...ace.project,
                      name: editName,
                      iconDataUrl: null,
                    }}
                    className="size-14"
                  />
                )}
              </button>
              <div className="space-y-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => projectIconRef.current?.click()}
                >
                  <ImagePlus data-icon="inline-start" />
                  {t('projectIconChange')}
                </Button>
                {editIcon ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditIcon(null)}
                  >
                    {t('iconRemove')}
                  </Button>
                ) : null}
              </div>
              <input
                ref={projectIconRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) =>
                  void pickIcon(event.target.files?.[0], setEditIcon)
                }
              />
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">
                {t('projectName')}
              </span>
              <input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                className={fieldClass}
                autoFocus
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">
                  {t('homeTeamIcon')}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => homeIconRef.current?.click()}
                  >
                    <TeamIcon
                      name={ace.project.teams.home.name}
                      iconDataUrl={editHomeIcon}
                    />
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => homeIconRef.current?.click()}
                  >
                    {t('iconPick')}
                  </Button>
                </div>
                <input
                  ref={homeIconRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    void pickIcon(event.target.files?.[0], setEditHomeIcon)
                  }
                />
              </div>
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">
                  {t('awayTeamIcon')}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => awayIconRef.current?.click()}
                  >
                    <TeamIcon
                      name={ace.project.teams.away.name}
                      iconDataUrl={editAwayIcon}
                    />
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => awayIconRef.current?.click()}
                  >
                    {t('iconPick')}
                  </Button>
                </div>
                <input
                  ref={awayIconRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    void pickIcon(event.target.files?.[0], setEditAwayIcon)
                  }
                />
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">
                {t('matchResult')}
              </span>
              <select
                value={editResult ?? ''}
                onChange={(event) => {
                  const value = event.target.value
                  setEditResult(
                    value === '' ? null : (value as Exclude<MatchResult, null>),
                  )
                }}
                className={fieldClass}
              >
                <option value="">{t('resultOpen')}</option>
                <option value="home">
                  {t('resultHome', { team: ace.project.teams.home.name })}
                </option>
                <option value="away">
                  {t('resultAway', { team: ace.project.teams.away.name })}
                </option>
                <option value="draw">{t('resultDraw')}</option>
              </select>
            </label>

            {iconError ? (
              <p className="text-xs text-destructive">{iconError}</p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSettingsOpen(false)}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={!editName.trim()}>
                {t('projectSave')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={onConfirmDelete} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>{t('projectDelete')}</DialogTitle>
              <DialogDescription>
                {t('projectDeleteHint', { name: ace.project.name })}
              </DialogDescription>
            </DialogHeader>
            <label className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">
                {t('projectDeleteConfirmLabel')}
              </span>
              <input
                value={confirmName}
                onChange={(event) => setConfirmName(event.target.value)}
                placeholder={ace.project.name}
                className={fieldClass}
                autoFocus
              />
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeleteOpen(false)}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={confirmName.trim() !== ace.project.name.trim()}
              >
                {t('projectDelete')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )

  if (layout === 'list') {
    return (
      <li className="relative">
        <div className="flex items-stretch">
          <button
            type="button"
            onClick={() => openProject(ace.project.id)}
            className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3 text-left outline-none transition hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50"
          >
            <ProjectIcon project={ace.project} className="size-10" />
            <span className="min-w-0 flex-1 space-y-0.5">
              <span className="block truncate text-sm font-semibold">
                {ace.project.name}
              </span>
              {matchup && matchup !== ace.project.name ? (
                <span className="block truncate text-xs text-muted-foreground">
                  {matchup}
                </span>
              ) : null}
            </span>
            <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
              {badges}
            </span>
          </button>
          <div className="flex items-center pr-2">{menu}</div>
        </div>
        {dialogs}
      </li>
    )
  }

  return (
    <li className="relative">
      <div
        className={cn(
          'flex h-full min-h-[11rem] w-full flex-col rounded-2xl border border-border bg-background p-5 transition hover:bg-muted/40 hover:ring-1 hover:ring-foreground/10',
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => openProject(ace.project.id)}
            className="outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ProjectIcon project={ace.project} />
          </button>
          {menu}
        </div>
        <button
          type="button"
          onClick={() => openProject(ace.project.id)}
          className="flex flex-1 flex-col text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="line-clamp-2 text-base font-semibold tracking-tight">
            {ace.project.name}
          </span>
          {matchup && matchup !== ace.project.name ? (
            <span className="mt-1 line-clamp-1 text-sm text-muted-foreground">
              {matchup}
            </span>
          ) : null}
          {!resultOpen && winner ? (
            <span className="mt-1 text-xs font-medium text-foreground/80">
              {t('resultWinner', { team: winner })}
            </span>
          ) : null}
          <span className="mt-auto flex flex-wrap gap-1.5 pt-4">{badges}</span>
        </button>
      </div>
      {dialogs}
    </li>
  )
}
