import { useEffect, useState, type SubmitEvent } from 'react'
import {
  Check,
  ChevronDown,
  FolderKanban,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWorkspace } from '@/shared'
import { useLocales } from '@/locales'
import { projectsMessages } from '@/locales/pages/projects'
import { cn } from '@/lib/utils'

export function WorkspaceSwitcher({
  menuAlign = 'end',
  compact = false,
}: {
  menuAlign?: 'start' | 'end'
  /** Tighter trigger for the global nav. */
  compact?: boolean
}) {
  const {
    workspaces,
    activeWorkspace,
    openWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
  } = useWorkspace()
  const t = useLocales(projectsMessages)
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [settingsWorkspaceId, setSettingsWorkspaceId] = useState<string | null>(
    null,
  )
  const [name, setName] = useState('')
  const [editName, setEditName] = useState('')

  const settingsWorkspace =
    workspaces.find((workspace) => workspace.id === settingsWorkspaceId) ?? null
  const settingsOpen = settingsWorkspaceId !== null

  useEffect(() => {
    if (!settingsWorkspace) return
    setEditName(settingsWorkspace.name)
  }, [settingsWorkspace])

  function onCreate(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    createWorkspace(name)
    setName('')
    setCreating(false)
    setOpen(false)
  }

  function onSaveSettings(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!settingsWorkspace || !editName.trim()) return
    updateWorkspace(settingsWorkspace.id, { name: editName })
    setSettingsWorkspaceId(null)
  }

  function onDelete() {
    if (!settingsWorkspace) return
    if (!window.confirm(t('workspaceDeleteConfirm'))) return
    deleteWorkspace(settingsWorkspace.id)
    setSettingsWorkspaceId(null)
  }

  function openSettingsDialog(workspaceId: string) {
    setOpen(false)
    setCreating(false)
    setSettingsWorkspaceId(workspaceId)
  }

  const label = activeWorkspace?.name ?? t('pickWorkspace')

  return (
    <>
      <DropdownMenu
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) {
            setCreating(false)
            setName('')
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t('switchWorkspace')}
            className={
              compact
                ? 'flex h-9 max-w-[min(14rem,42vw)] items-center gap-1.5 rounded-full px-2.5 text-left outline-none transition hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50'
                : 'flex max-w-[min(18rem,70vw)] items-center gap-2 rounded-lg px-3 py-2 text-left outline-none transition hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50'
            }
          >
            {compact ? (
              <FolderKanban className="size-3.5 shrink-0 text-muted-foreground" />
            ) : null}
            <span
              className={
                compact
                  ? 'truncate text-sm font-medium tracking-tight'
                  : 'truncate text-sm font-semibold tracking-tight'
              }
            >
              {label}
            </span>
            <ChevronDown
              className={`size-3.5 shrink-0 text-muted-foreground transition ${open ? 'rotate-180' : ''}`}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={menuAlign}
          className="w-[min(20rem,calc(100vw-2rem))] p-2"
        >
          {workspaces.length > 0 ? (
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {workspaces.map((workspace) => {
                const active = workspace.id === activeWorkspace?.id
                return (
                  <DropdownMenuItem
                    key={workspace.id}
                    onSelect={() => {
                      openWorkspace(workspace.id)
                      setCreating(false)
                    }}
                    className={cn(
                      'group flex items-center gap-1 rounded-lg py-0 pr-1 pl-0',
                      active
                        ? 'bg-primary text-primary-foreground focus:bg-primary focus:text-primary-foreground'
                        : undefined,
                    )}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-sm">
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {workspace.name}
                      </span>
                      {active ? (
                        <Check
                          className="size-3.5 shrink-0"
                          strokeWidth={2.5}
                        />
                      ) : null}
                    </span>
                    <button
                      type="button"
                      aria-label={t('workspaceSettings')}
                      title={t('workspaceSettings')}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={(event) => {
                        event.stopPropagation()
                        openSettingsDialog(workspace.id)
                      }}
                      className={cn(
                        'shrink-0 rounded-md p-1.5 outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50',
                        active
                          ? 'text-primary-foreground/70 opacity-0 hover:bg-primary-foreground/15 hover:text-primary-foreground group-hover:opacity-100 focus-visible:opacity-100'
                          : 'text-muted-foreground opacity-0 hover:bg-muted hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100',
                      )}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  </DropdownMenuItem>
                )
              })}
            </div>
          ) : (
            <p className="px-3 py-2.5 text-xs text-muted-foreground">
              {t('workspacesEmpty')}
            </p>
          )}

          <DropdownMenuSeparator />
          {creating ? (
            <form
              onSubmit={onCreate}
              onClick={(event) => event.stopPropagation()}
              className="space-y-2.5 px-1.5 py-1.5"
            >
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('workspaceNamePlaceholder')}
                autoFocus
                className="h-10"
                onKeyDown={(event) => event.stopPropagation()}
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={!name.trim()}>
                  {t('workspaceCreate')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCreating(false)
                    setName('')
                  }}
                >
                  {t('cancel')}
                </Button>
              </div>
            </form>
          ) : (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                setCreating(true)
              }}
              className="gap-2.5 px-3 py-2.5 font-medium"
            >
              <Plus className="size-3.5 shrink-0" />
              {t('createWorkspace')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={settingsOpen}
        onOpenChange={(next) => {
          if (!next) setSettingsWorkspaceId(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={onSaveSettings} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>{t('workspaceSettings')}</DialogTitle>
              <DialogDescription>
                {t('workspaceSettingsHint')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label
                htmlFor="workspace-edit-name"
                className="text-xs font-normal text-muted-foreground"
              >
                {t('workspaceName')}
              </Label>
              <Input
                id="workspace-edit-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                autoFocus
                className="h-10"
              />
            </div>

            <div className="flex justify-start">
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={onDelete}
              >
                <Trash2 data-icon="inline-start" />
                {t('workspaceDelete')}
              </Button>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSettingsWorkspaceId(null)}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={!editName.trim()}>
                {t('workspaceSave')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
