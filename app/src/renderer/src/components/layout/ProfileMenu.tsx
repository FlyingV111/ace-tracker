import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import {
  ImagePlus,
  Monitor,
  Moon,
  Settings2,
  Shield,
  Sun,
  Trash2,
  UserRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  fileToAvatarDataUrl,
  hidriveConnectorFor,
  listCloudProviders,
  useWorkspace,
} from '@/shared'
import { HiDriveSettingsPanel } from '@/components/settings/HiDriveSettingsPanel'
import { useLocales } from '@/locales'
import { projectsMessages } from '@/locales/pages/projects'

export function ProfileMenu({
  menuAlign = 'end',
  compact = false,
}: {
  menuAlign?: 'start' | 'end'
  compact?: boolean
}) {
  const { settings, updateProfile, setTheme, deleteAllData, locale } =
    useWorkspace()
  const t = useLocales(projectsMessages)
  const providers = listCloudProviders()
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [displayName, setDisplayName] = useState(settings.displayName)
  const [avatarDataUrl, setAvatarDataUrl] = useState(settings.avatarDataUrl)
  const [isPlayer, setIsPlayer] = useState(settings.isPlayer)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const avatarRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!profileOpen) return
    setDisplayName(settings.displayName)
    setAvatarDataUrl(settings.avatarDataUrl)
    setIsPlayer(settings.isPlayer)
    setAvatarError(null)
  }, [
    profileOpen,
    settings.displayName,
    settings.avatarDataUrl,
    settings.isPlayer,
  ])

  async function onAvatarFile(file: File | undefined) {
    if (!file) return
    setAvatarError(null)
    try {
      setAvatarDataUrl(await fileToAvatarDataUrl(file))
    } catch {
      setAvatarError(t('profileAvatarError'))
    }
  }

  function onSave(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!displayName.trim()) return
    updateProfile({
      displayName,
      avatarDataUrl,
      isPlayer,
    })
    setProfileOpen(false)
  }

  function onDeleteAll() {
    if (!window.confirm(t('deleteAllConfirm'))) return
    deleteAllData()
    setSettingsOpen(false)
  }

  function openProfileDialog() {
    setOpen(false)
    setProfileOpen(true)
  }

  function openSettingsDialog() {
    setOpen(false)
    setSettingsOpen(true)
  }

  const label = settings.displayName.trim() || t('brand')
  const theme = settings.theme

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={label}
            title={label}
            className={
              compact
                ? 'flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-foreground/10 outline-none transition hover:ring-foreground/25 focus-visible:ring-3 focus-visible:ring-ring/50'
                : 'flex max-w-[12rem] items-center gap-2.5 rounded-lg py-1.5 pl-2.5 pr-1.5 text-left outline-none transition hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50'
            }
          >
            {compact ? null : (
              <span className="min-w-0 truncate text-sm font-medium">
                {label}
              </span>
            )}
            {compact ? (
              settings.avatarDataUrl ? (
                <img
                  src={settings.avatarDataUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <UserRound className="size-4 text-muted-foreground" />
              )
            ) : (
              <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-foreground/10">
                {settings.avatarDataUrl ? (
                  <img
                    src={settings.avatarDataUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <UserRound className="size-4 text-muted-foreground" />
                )}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={menuAlign}
          className="w-[min(18rem,calc(100vw-2rem))] p-2"
        >
          <DropdownMenuLabel className="px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-foreground">
              {label}
            </p>
            <p className="mt-0.5 text-[11px] font-normal text-muted-foreground">
              {t('profileMenuHint')}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={openProfileDialog}
            className="gap-2.5 px-3 py-2.5"
          >
            <UserRound className="size-3.5 shrink-0 text-muted-foreground" />
            {t('profileEditMenu')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={openSettingsDialog}
            className="gap-2.5 px-3 py-2.5"
          >
            <Settings2 className="size-3.5 shrink-0 text-muted-foreground" />
            {t('settingsMenu')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 pt-1">
            <div
              role="group"
              aria-label={t('themeGroup')}
              className="grid grid-cols-3 rounded-lg bg-muted/60 p-1"
            >
              <button
                type="button"
                aria-pressed={theme === 'light'}
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-1 rounded-md px-2 py-2.5 text-xs font-medium outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50 ${
                  theme === 'light'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sun className="size-3.5" />
                {t('themeLightShort')}
              </button>
              <button
                type="button"
                aria-pressed={theme === 'system'}
                onClick={() => setTheme('system')}
                className={`flex items-center justify-center gap-1 rounded-md px-2 py-2.5 text-xs font-medium outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50 ${
                  theme === 'system'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Monitor className="size-3.5" />
                {t('themeSystemShort')}
              </button>
              <button
                type="button"
                aria-pressed={theme === 'dark'}
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-1 rounded-md px-2 py-2.5 text-xs font-medium outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50 ${
                  theme === 'dark'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Moon className="size-3.5" />
                {t('themeDarkShort')}
              </button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={onSave} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>{t('profileEditTitle')}</DialogTitle>
              <DialogDescription>{t('profileEditHint')}</DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => avatarRef.current?.click()}
                className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-foreground/10 outline-none transition hover:ring-foreground/25 focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label={t('profileAvatarPick')}
              >
                {avatarDataUrl ? (
                  <img
                    src={avatarDataUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <ImagePlus className="size-5 text-muted-foreground" />
                )}
              </button>
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => avatarRef.current?.click()}
                  >
                    {avatarDataUrl
                      ? t('profileAvatarChange')
                      : t('profileAvatarPick')}
                  </Button>
                  {avatarDataUrl ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setAvatarDataUrl(null)}
                    >
                      {t('profileAvatarRemove')}
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
              <p className="text-xs text-destructive">{avatarError}</p>
            ) : null}

            <div className="space-y-1.5">
              <Label
                htmlFor="profile-display-name"
                className="text-xs font-normal text-muted-foreground"
              >
                {t('profileName')}
              </Label>
              <Input
                id="profile-display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                autoFocus
                className="h-10"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border px-3.5 py-3">
              <Checkbox
                checked={isPlayer}
                onCheckedChange={(checked) => setIsPlayer(checked === true)}
                className="mt-0.5"
              />
              <span className="text-sm">{t('profileIsPlayer')}</span>
            </label>

            <div className="flex gap-2 rounded-lg bg-muted/40 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
              <Shield className="mt-0.5 size-3.5 shrink-0" />
              <p>{t('profilePrivacy')}</p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setProfileOpen(false)}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={!displayName.trim()}>
                {t('profileSave')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('settingsTitle')}</DialogTitle>
            <DialogDescription>{t('settingsHint')}</DialogDescription>
          </DialogHeader>

          <HiDriveSettingsPanel />

          <div className="space-y-2">
            <p className="text-sm font-semibold">{t('mediaProvidersTitle')}</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {t('mediaProvidersHint')}
            </p>
            <ul className="space-y-2">
              {providers.map((provider) => {
                const live =
                  provider.id === 'hidrive'
                    ? hidriveConnectorFor(settings.hidrive)
                    : provider
                const ready =
                  live.status === 'available' || live.status === 'connected'
                const needsSetup = live.status === 'needs-setup'
                return (
                  <li
                    key={provider.id}
                    className="rounded-lg border border-border px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        {live.label[locale]}
                      </p>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {ready
                          ? t('mediaProviderConnected')
                          : needsSetup
                            ? t('mediaProviderNeedsSetup')
                            : live.status === 'available'
                              ? t('mediaProviderReady')
                              : t('mediaProviderSoon')}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {live.description[locale]}
                    </p>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm font-semibold text-destructive">
              {t('deleteAllTitle')}
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {t('deleteAllHint')}
            </p>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={onDeleteAll}
            >
              <Trash2 data-icon="inline-start" />
              {t('deleteAllAction')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
