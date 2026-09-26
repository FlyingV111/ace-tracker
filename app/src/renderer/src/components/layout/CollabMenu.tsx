import { useEffect, useState, type SubmitEvent } from 'react'
import { Copy, Link2, Users } from 'lucide-react'
import { AppNavIconButton } from '@/components/layout/AppNav'
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseFriendLink, useCollab } from '@/shared'
import { useLocales } from '@/locales'
import { projectMessages } from '@/locales/pages/project'
import { cn } from '@/lib/utils'

export function CollabMenu() {
  const t = useLocales(projectMessages)
  const {
    session,
    connectionState,
    peerCount,
    error,
    testLog,
    createAndConnect,
    joinAndConnect,
    leave,
    sendTestPing,
  } = useCollab()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mode, setMode] = useState<'idle' | 'host' | 'join'>('idle')
  const [joinCode, setJoinCode] = useState('')
  const [joinPass, setJoinPass] = useState('')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [testText, setTestText] = useState('')
  const [copied, setCopied] = useState<'room' | 'pass' | 'link' | null>(null)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(null), 1500)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function openCreateSession() {
    setMenuOpen(false)
    setMode('host')
    setJoinError(null)
    setDialogOpen(true)
    setBusy(true)
    try {
      await createAndConnect()
    } catch (err) {
      setJoinError(
        err instanceof Error ? err.message : t('collabConnectFailed'),
      )
    } finally {
      setBusy(false)
    }
  }

  function openJoinSession() {
    setMenuOpen(false)
    setMode('join')
    setJoinCode('')
    setJoinPass('')
    setJoinError(null)
    setDialogOpen(true)
  }

  async function onJoin(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setJoinError(null)
    const trimmed = joinCode.trim()
    if (!trimmed || !joinPass.trim()) {
      setJoinError(t('collabJoinMissing'))
      return
    }
    const fromLink = parseFriendLink(trimmed)
    const roomCode = fromLink?.roomCode ?? trimmed
    setBusy(true)
    try {
      await joinAndConnect(roomCode, joinPass)
      setMode('host')
    } catch (err) {
      setJoinError(
        err instanceof Error ? err.message : t('collabConnectFailed'),
      )
    } finally {
      setBusy(false)
    }
  }

  async function onDialogChange(open: boolean) {
    setDialogOpen(open)
    if (!open) {
      setMode('idle')
      setJoinError(null)
    }
  }

  async function onLeave() {
    await leave()
    setDialogOpen(false)
    setMode('idle')
  }

  async function copyText(
    value: string,
    kind: 'room' | 'pass' | 'link',
  ): Promise<void> {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
    } catch {
      // Clipboard can fail in some Electron contexts - ignore quietly.
    }
  }

  const active =
    connectionState === 'connected' || connectionState === 'connecting'
  const statusLabel =
    connectionState === 'connected'
      ? t('collabStatusConnected', { count: peerCount })
      : connectionState === 'connecting'
        ? t('collabStatusConnecting')
        : connectionState === 'error'
          ? t('collabStatusError')
          : t('collabHint')

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <AppNavIconButton
            active={active || menuOpen}
            aria-label={t('collabMenu')}
            title={t('collabMenu')}
          >
            <Users className="size-4" />
          </AppNavIconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[min(18rem,calc(100vw-2rem))] p-2"
        >
          <DropdownMenuLabel className="px-3 py-2.5">
            <p className="text-sm font-semibold text-foreground">
              {t('collabTitle')}
            </p>
            <p className="mt-0.5 text-[11px] font-normal leading-relaxed text-muted-foreground">
              {statusLabel}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => void openCreateSession()}
            className="gap-2.5 px-3 py-2.5 font-medium"
          >
            <Users className="size-3.5 shrink-0 text-muted-foreground" />
            {t('collabCreateSession')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={openJoinSession}
            className="gap-2.5 px-3 py-2.5"
          >
            <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
            {t('collabJoinSession')}
          </DropdownMenuItem>
          {session ? (
            <DropdownMenuItem
              onSelect={() => {
                setDialogOpen(true)
                setMode('host')
              }}
              className="gap-2.5 px-3 py-2.5"
            >
              {t('collabShowCodes')}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={(open) => void onDialogChange(open)}>
        <DialogContent className="sm:max-w-md">
          {mode === 'join' && !session ? (
            <form onSubmit={(event) => void onJoin(event)} className="grid gap-4">
              <DialogHeader>
                <DialogTitle>{t('collabJoinSession')}</DialogTitle>
                <DialogDescription>{t('collabJoinHint')}</DialogDescription>
              </DialogHeader>

              <div className="space-y-1.5">
                <Label
                  htmlFor="collab-room"
                  className="text-xs font-normal text-muted-foreground"
                >
                  {t('collabRoom')}
                </Label>
                <Input
                  id="collab-room"
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value)}
                  placeholder={t('collabRoomPlaceholder')}
                  autoFocus
                  className="h-10 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="collab-pass"
                  className="text-xs font-normal text-muted-foreground"
                >
                  {t('collabPass')}
                </Label>
                <Input
                  id="collab-pass"
                  value={joinPass}
                  onChange={(event) => setJoinPass(event.target.value)}
                  placeholder={t('collabPassPlaceholder')}
                  className="h-10 font-mono"
                />
              </div>

              {joinError || error ? (
                <p className="text-xs text-destructive">
                  {joinError || error}
                </p>
              ) : null}

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void onDialogChange(false)}
                >
                  {t('collabClear')}
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? t('collabStatusConnecting') : t('collabJoinConfirm')}
                </Button>
              </DialogFooter>
            </form>
          ) : session ? (
            <div className="grid gap-4">
              <DialogHeader>
                <DialogTitle>
                  {session.info.role === 'host'
                    ? t('collabCreateSession')
                    : t('collabJoinSession')}
                </DialogTitle>
                <DialogDescription>
                  {busy
                    ? t('collabStatusConnecting')
                    : t('collabReadyHint')}
                </DialogDescription>
              </DialogHeader>

              <p className="text-[11px] text-muted-foreground">{statusLabel}</p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {t('collabPrivacyNote')}
              </p>

              <dl className="space-y-3">
                <CopyRow
                  label={t('collabRoom')}
                  value={session.info.roomCode}
                  copied={copied === 'room'}
                  copyLabel={t('collabCopied')}
                  onCopy={() => void copyText(session.info.roomCode, 'room')}
                />
                <CopyRow
                  label={t('collabPass')}
                  value={session.info.passphrase}
                  copied={copied === 'pass'}
                  copyLabel={t('collabCopied')}
                  onCopy={() =>
                    void copyText(session.info.passphrase, 'pass')
                  }
                />
                <CopyRow
                  label={t('collabLink')}
                  value={session.friendLink}
                  copied={copied === 'link'}
                  copyLabel={t('collabCopied')}
                  monoSmall
                  onCopy={() => void copyText(session.friendLink, 'link')}
                />
              </dl>

              <div className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-sm font-semibold">{t('collabTestTitle')}</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {t('collabTestHint')}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={testText}
                    onChange={(event) => setTestText(event.target.value)}
                    placeholder={t('collabTestPlaceholder')}
                    className="h-9 min-w-0 flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy || connectionState === 'error'}
                    onClick={() => {
                      sendTestPing(testText)
                      setTestText('')
                    }}
                  >
                    {t('collabTestSend')}
                  </Button>
                </div>
                {testLog.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">
                    {t('collabTestEmpty')}
                  </p>
                ) : (
                  <ul className="max-h-36 space-y-1.5 overflow-y-auto">
                    {[...testLog].reverse().map((ping) => (
                      <li
                        key={ping.id}
                        className="rounded-md bg-muted/50 px-2.5 py-1.5 text-[11px]"
                      >
                        <span className="font-medium">{ping.from}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          · #{ping.n} ·{' '}
                          {new Date(ping.at).toLocaleTimeString()}
                        </span>
                        <p className="mt-0.5 text-sm text-foreground">
                          {ping.text}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {joinError || error ? (
                <p className="text-xs text-destructive">
                  {joinError || error}
                </p>
              ) : null}

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => void onLeave()}>
                  {t('collabLeave')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void onDialogChange(false)}
                >
                  {t('collabClear')}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <p className="text-sm text-muted-foreground">
                {busy ? t('collabStatusConnecting') : t('collabHint')}
              </p>
              {joinError || error ? (
                <p className="text-xs text-destructive">
                  {joinError || error}
                </p>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function CopyRow({
  label,
  value,
  copied,
  copyLabel,
  monoSmall,
  onCopy,
}: {
  label: string
  value: string
  copied: boolean
  copyLabel: string
  monoSmall?: boolean
  onCopy: () => void
}) {
  return (
    <div className="rounded-lg border border-border px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <dt className="text-[11px] text-muted-foreground">{label}</dt>
          <dd
            className={cn(
              'mt-0.5 break-all font-mono font-medium',
              monoSmall ? 'text-xs' : 'text-sm',
            )}
          >
            {value}
          </dd>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="shrink-0"
          onClick={onCopy}
          aria-label={copyLabel}
        >
          <Copy className="size-3.5" />
          {copied ? (
            <span className="text-[11px]">{copyLabel}</span>
          ) : null}
        </Button>
      </div>
    </div>
  )
}
