import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
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

/**
 * Connect STRATO HiDrive with username + password (WebDAV).
 * Optional: paste a share link for helpers.
 */
export function HiDriveSettingsPanel() {
  const { settings, updateHiDrive } = useWorkspace()
  const t = useLocales(projectsMessages)
  const saved = settings.hidrive
  const [username, setUsername] = useState(saved.username || 'flyingv111')
  const [password, setPassword] = useState(saved.password)
  const [rootPath, setRootPath] = useState(
    saved.rootPath ||
      '/users/flyingv111/Volleyball/Herzogenaurach/RAW/Kader',
  )
  const [shareUrl, setShareUrl] = useState(
    saved.shareUrl || 'https://my.hidrive.com/share/s30a2on76h',
  )
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

      <label className="grid gap-1 text-xs">
        <span>{t('hidriveUsername')}</span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="flyingv111"
        />
      </label>

      <label className="grid gap-1 text-xs">
        <span>{t('hidrivePassword')}</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>

      <label className="grid gap-1 text-xs">
        <span>{t('hidriveRootPath')}</span>
        <input
          value={rootPath}
          onChange={(e) => setRootPath(e.target.value)}
          onBlur={onPathBlur}
          className="rounded-md border border-border bg-background px-3 py-2 font-mono text-xs"
          placeholder="/users/flyingv111/Volleyball/…"
        />
      </label>

      <label className="grid gap-1 text-xs">
        <span>{t('hidriveShareUrl')}</span>
        <input
          value={shareUrl}
          onChange={(e) => setShareUrl(e.target.value)}
          onBlur={onShareBlur}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="https://my.hidrive.com/share/…"
        />
      </label>

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
