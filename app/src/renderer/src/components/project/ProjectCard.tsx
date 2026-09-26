import { useEffect, useRef, useState, type SubmitEvent } from 'react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TeamIcon } from '@/components/project/ProjectIcon'
import {
  fileToAvatarDataUrl,
  formatMatchScore,
  matchScore,
  projectMatchupLabel,
  useWorkspace,
  winnerTeamName,
  type AceProject,
  type MatchResult,
} from '@/shared'
import { useLocales } from '@/locales'
import { projectsMessages } from '@/locales/pages/projects'
import { cn } from '@/lib/utils'

type ProjectCardProps = {
  ace: AceProject
  layout: 'tiles' | 'list'
}

function parseSetsField(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.floor(n)
}

export function ProjectCard({ ace, layout }: ProjectCardProps) {
  const { openProject, updateProject, deleteProject, activeWorkspace } =
    useWorkspace()
  const t = useLocales(projectsMessages)
  const squadCount =
    activeWorkspace && activeWorkspace.id === ace.workspaceId
      ? activeWorkspace.squad.length
      : ace.project.squad.length
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editName, setEditName] = useState(ace.project.name)
  const [editResult, setEditResult] = useState<MatchResult>(
    ace.project.result ?? null,
  )
  const [editSetsHome, setEditSetsHome] = useState(
    ace.project.setsScore?.home != null
      ? String(ace.project.setsScore.home)
      : '',
  )
  const [editSetsAway, setEditSetsAway] = useState(
    ace.project.setsScore?.away != null
      ? String(ace.project.setsScore.away)
      : '',
  )
  const [editHomeIcon, setEditHomeIcon] = useState<string | null>(
    ace.project.teams.home.iconDataUrl ?? null,
  )
  const [editAwayIcon, setEditAwayIcon] = useState<string | null>(
    ace.project.teams.away.iconDataUrl ?? null,
  )
  const [confirmName, setConfirmName] = useState('')
  const [iconError, setIconError] = useState<string | null>(null)
  const homeIconRef = useRef<HTMLInputElement>(null)
  const awayIconRef = useRef<HTMLInputElement>(null)

  const matchup = projectMatchupLabel(ace.project)
  const winner = winnerTeamName(ace.project)
  const score = matchScore(ace)
  const scoreLabel = formatMatchScore(score)

  useEffect(() => {
    if (!settingsOpen) return
    setEditName(ace.project.name)
    setEditResult(ace.project.result ?? null)
    setEditSetsHome(
      ace.project.setsScore?.home != null
        ? String(ace.project.setsScore.home)
        : '',
    )
    setEditSetsAway(
      ace.project.setsScore?.away != null
        ? String(ace.project.setsScore.away)
        : '',
    )
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

  function onSaveSettings(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editName.trim()) return
    const homeSets = parseSetsField(editSetsHome)
    const awaySets = parseSetsField(editSetsAway)
    const setsScore =
      homeSets === null && awaySets === null
        ? null
        : { home: homeSets ?? 0, away: awaySets ?? 0 }
    updateProject(ace.project.id, {
      name: editName,
      result: editResult,
      setsScore,
      homeIconDataUrl: editHomeIcon,
      awayIconDataUrl: editAwayIcon,
    })
    setSettingsOpen(false)
  }

  function onConfirmDelete(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (confirmName.trim() !== ace.project.name.trim()) return
    deleteProject(ace.project.id)
    setDeleteOpen(false)
  }

  const matchupVisual = (
    <span className="flex items-center gap-2.5">
      <TeamIcon
        name={ace.project.teams.home.name}
        iconDataUrl={ace.project.teams.home.iconDataUrl}
        className={layout === 'list' ? 'size-9' : 'size-11'}
      />
      <span
        className={cn(
          'min-w-[2.75rem] text-center font-semibold tabular-nums tracking-tight',
          layout === 'list' ? 'text-sm' : 'text-base',
        )}
      >
        {scoreLabel}
      </span>
      <TeamIcon
        name={ace.project.teams.away.name}
        iconDataUrl={ace.project.teams.away.iconDataUrl}
        className={layout === 'list' ? 'size-9' : 'size-11'}
      />
    </span>
  )

  const menu = (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('projectMenu')}
          onClick={(event) => event.stopPropagation()}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground outline-none transition hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <MoreVertical className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onSelect={() => setSettingsOpen(true)}
          className="gap-2"
        >
          <Settings2 className="size-3.5 text-muted-foreground" />
          {t('projectSettings')}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => setDeleteOpen(true)}
          className="gap-2"
        >
          <Trash2 className="size-3.5" />
          {t('projectDelete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const badges = (
    <>
      <Badge variant="outline">
        {t('playersCount', { count: squadCount })}
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

            <div className="space-y-1.5">
              <Label
                htmlFor={`project-name-${ace.project.id}`}
                className="text-xs font-normal text-muted-foreground"
              >
                {t('projectName')}
              </Label>
              <Input
                id={`project-name-${ace.project.id}`}
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                className="h-10"
                autoFocus
              />
            </div>

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
                    <ImagePlus data-icon="inline-start" />
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
                    <ImagePlus data-icon="inline-start" />
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

            <div className="space-y-1.5">
              <Label className="text-xs font-normal text-muted-foreground">
                {t('setsScore')}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  inputMode="numeric"
                  value={editSetsHome}
                  onChange={(event) => setEditSetsHome(event.target.value)}
                  placeholder={ace.project.teams.home.name || '0'}
                  className="h-10"
                  aria-label={t('setsScoreHome')}
                />
                <span className="text-sm font-semibold text-muted-foreground">
                  :
                </span>
                <Input
                  inputMode="numeric"
                  value={editSetsAway}
                  onChange={(event) => setEditSetsAway(event.target.value)}
                  placeholder={ace.project.teams.away.name || '0'}
                  className="h-10"
                  aria-label={t('setsScoreAway')}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t('setsScoreHint')}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-normal text-muted-foreground">
                {t('matchResult')}
              </Label>
              <Select
                value={editResult ?? 'open'}
                onValueChange={(value) => {
                  setEditResult(
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
                  <SelectItem value="home">
                    {t('resultHome', { team: ace.project.teams.home.name })}
                  </SelectItem>
                  <SelectItem value="away">
                    {t('resultAway', { team: ace.project.teams.away.name })}
                  </SelectItem>
                  <SelectItem value="draw">{t('resultDraw')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
            <div className="space-y-1.5">
              <Label
                htmlFor={`project-delete-${ace.project.id}`}
                className="text-xs font-normal text-muted-foreground"
              >
                {t('projectDeleteConfirmLabel')}
              </Label>
              <Input
                id={`project-delete-${ace.project.id}`}
                value={confirmName}
                onChange={(event) => setConfirmName(event.target.value)}
                placeholder={ace.project.name}
                className="h-10"
                autoFocus
              />
            </div>
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
            {matchupVisual}
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
            {matchupVisual}
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
          {winner ? (
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
