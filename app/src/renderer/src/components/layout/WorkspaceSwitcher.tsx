import { useEffect, useRef, useState, type FormEvent } from 'react'
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
import { useWorkspace } from '@/shared'
import { useLocales } from '@/locales'
import { projectsMessages } from '@/locales/pages/projects'

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
  const rootRef = useRef<HTMLDivElement>(null)

  const settingsWorkspace =
    workspaces.find((workspace) => workspace.id === settingsWorkspaceId) ?? null
  const settingsOpen = settingsWorkspaceId !== null

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setCreating(false)
        setName('')
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!settingsWorkspace) return
    setEditName(settingsWorkspace.name)
  }, [settingsWorkspace])

  function onCreate(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    createWorkspace(name)
    setName('')
    setCreating(false)
    setOpen(false)
  }

  function onSaveSettings(event: FormEvent) {
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
      <div ref={rootRef} className="relative">
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={t('switchWorkspace')}
          onClick={() => setOpen((value) => !value)}
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

        {open ? (
          <div
            className={`absolute top-full z-50 mt-1.5 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-border bg-background p-2 shadow-lg ${
              menuAlign === 'end' ? 'right-0' : 'left-0'
            }`}
          >
            {workspaces.length > 0 ? (
              <ul role="listbox" className="max-h-56 space-y-1 overflow-y-auto">
                {workspaces.map((workspace) => {
                  const active = workspace.id === activeWorkspace?.id
                  return (
                    <li key={workspace.id}>
                      <div
                        className={`group flex w-full items-center gap-1 rounded-lg pr-1 transition ${
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted/60'
                        }`}
                      >
                        <button
                          type="button"
                          role="option"
                          aria-selected={active}
                          onClick={() => {
                            openWorkspace(workspace.id)
                            setOpen(false)
                            setCreating(false)
                          }}
                          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {workspace.name}
                          </span>
                          {active ? (
                            <Check
                              className="size-3.5 shrink-0"
                              strokeWidth={2.5}
                            />
                          ) : null}
                        </button>
                        <button
                          type="button"
                          aria-label={t('workspaceSettings')}
                          title={t('workspaceSettings')}
                          onClick={(event) => {
                            event.stopPropagation()
                            openSettingsDialog(workspace.id)
                          }}
                          className={`shrink-0 rounded-md p-1.5 outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50 ${
                            active
                              ? 'text-primary-foreground/70 opacity-0 hover:bg-primary-foreground/15 hover:text-primary-foreground group-hover:opacity-100 focus-visible:opacity-100'
                              : 'text-muted-foreground opacity-0 hover:bg-muted hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100'
                          }`}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="px-3 py-2.5 text-xs text-muted-foreground">
                {t('workspacesEmpty')}
              </p>
            )}

            <div className="mt-1.5 border-t border-border pt-2">
              {creating ? (
                <form onSubmit={onCreate} className="space-y-2.5 px-1.5 py-1.5">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={t('workspaceNamePlaceholder')}
                    autoFocus
                    className="h-10 w-full rounded-lg border border-border bg-background px-3.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium outline-none transition hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <Plus className="size-3.5 shrink-0" />
                  {t('createWorkspace')}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>

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

            <label className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">
                {t('workspaceName')}
              </span>
              <input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                autoFocus
                className="h-10 w-full rounded-lg border border-border bg-background px-3.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </label>

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
