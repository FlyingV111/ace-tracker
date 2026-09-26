import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  defaultRootPathForUser,
  hidriveConnectorFor,
  normalizeHiDriveShareUrl,
  pathFromHiDriveBrowserUrl,
  type HiDriveConfig,
  useWorkspace,
} from '@/shared'
import { probeHiDrive } from '@/shared/cloud/hidrive-api'
import { useLocales } from '@/locales'
import { projectsMessages } from '@/locales/pages/projects'

export function HiDriveSettingsPanel() {
  const { settings, updateHiDrive } = useWorkspace()
  const t = useLocales(projectsMessages)
  const saved = settings.hidrive
  const [username, setUsername] = useState(saved.username)
  const [password, setPassword] = useState(saved.password)
  const [rootPath, setRootPath] = useState(saved.rootPath)
  const [shareUrl, setShareUrl] = useState(saved.shareUrl)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const statusLabel = useMemo(() => {
    const connector = hidriveConnectorFor(saved)
    return connector.status === 'connected'
      ? t('mediaProviderConnected')
      : t('mediaProviderNeedsSetup')
  }, [saved, t])

  async function onConnect() {
    setBusy(true)
    setError(null)
    setMessage(null)

    let path = rootPath.trim()
    const fromBrowser = pathFromHiDriveBrowserUrl(path)
    if (fromBrowser) path = fromBrowser
    if (!path && username.trim()) {
      path = defaultRootPathForUser(username)
    }

    const next: HiDriveConfig = {
      username: username.trim(),
      password,
      rootPath: path,
      shareUrl: normalizeHiDriveShareUrl(shareUrl),
      connected: false,
    }

    if (!next.username || !next.password) {
      setError(t('hidriveNeedCredentials'))
      setBusy(false)
      return
    }

    try {
      const result = await probeHiDrive(next)
      if (!result.ok) {
        setError(result.error)
        updateHiDrive({ ...next, connected: false })
        return
      }
      updateHiDrive({ ...next, connected: true })
      setRootPath(next.rootPath)
      setShareUrl(next.shareUrl)
      setMessage(t('hidriveConnectedOk'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('hidriveConnectFailed'))
    } finally {
      setBusy(false)
    }
  }

  function onDisconnect() {
    updateHiDrive({
      ...saved,
      password: '',
      connected: false,
    })
    setPassword('')
    setMessage(t('hidriveDisconnected'))
    setError(null)
  }

  function onShareBlur() {
    setShareUrl(normalizeHiDriveShareUrl(shareUrl))
  }

  function onPathBlur() {
    const fromBrowser = pathFromHiDriveBrowserUrl(rootPath)
    if (fromBrowser) setRootPath(fromBrowser)
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{t('hidriveTitle')}</p>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {statusLabel}
        </span>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {t('hidriveHint')}
      </p>

      <div className="grid gap-1">
        <Label htmlFor="hidrive-username" className="text-xs font-normal">
          {t('hidriveUsername')}
        </Label>
        <Input
          id="hidrive-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          className="h-10"
        />
      </div>

      <div className="grid gap-1">
        <Label htmlFor="hidrive-password" className="text-xs font-normal">
          {t('hidrivePassword')}
        </Label>
        <Input
          id="hidrive-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="h-10"
        />
      </div>

      <div className="grid gap-1">
        <Label htmlFor="hidrive-root-path" className="text-xs font-normal">
          {t('hidriveRootPath')}
        </Label>
        <Input
          id="hidrive-root-path"
          value={rootPath}
          onChange={(e) => setRootPath(e.target.value)}
          onBlur={onPathBlur}
          className="h-10 font-mono text-xs"
          placeholder="/users/…"
        />
      </div>

      <div className="grid gap-1">
        <Label htmlFor="hidrive-share-url" className="text-xs font-normal">
          {t('hidriveShareUrl')}
        </Label>
        <Input
          id="hidrive-share-url"
          value={shareUrl}
          onChange={(e) => setShareUrl(e.target.value)}
          onBlur={onShareBlur}
          className="h-10"
          placeholder="https://my.hidrive.com/share/…"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={() => void onConnect()}
        >
          {busy ? t('hidriveConnecting') : t('hidriveConnect')}
        </Button>
        {saved.connected ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={onDisconnect}
          >
            {t('hidriveDisconnect')}
          </Button>
        ) : null}
      </div>

      {message ? (
        <p className="text-[11px] text-muted-foreground">{message}</p>
      ) : null}
      {error ? (
        <p className="text-[11px] text-destructive">{error}</p>
      ) : null}
      {saved.shareUrl ? (
        <p className="truncate text-[10px] text-muted-foreground">
          Share: {saved.shareUrl}
        </p>
      ) : null}
    </div>
  )
}
