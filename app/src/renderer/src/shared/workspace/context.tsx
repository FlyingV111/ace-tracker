import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createEmptyProject,
  createEmptyToolDocuments,
  downloadAceproj,
  isToolId,
  loadProjects,
  saveProjects,
  clearProjectsStorage,
  toAceprojFileName,
  unpackAceproj,
} from '../fileformat'
import type {
  AceProject,
  AppView,
  Locale,
  MatchResult,
  MediaManifest,
  Player,
  PlayerMetricKind,
  ProjectToolDocuments,
  ToolId,
  Workspace,
  WorkspaceSettings,
} from '../core/types'
import {
  DEFAULT_USER_SETTINGS,
  loadUserSettings,
  saveUserSettings,
  clearUserSettingsStorage,
  type UserSettings,
  type ThemeMode,
  type HiDriveConfig,
} from '../core/settings'
import { clearAllPersistedData } from '../core/persistence'
import {
  applyDocumentTheme,
  resolveTheme,
  syncElectronThemePreference,
  type ResolvedTheme,
} from '../core/theme'
import {
  createPlayer,
  createWorkspace,
  loadWorkspaces,
  mergePlayersIntoSquad,
  saveWorkspaces,
  clearWorkspacesStorage,
} from './store'
import { createMetricSample, metricDayKey, metricSampleKey } from '../player/metrics'

export type SetupBootstrap = {
  workspaceName: string
}

type WorkspaceValue = {
  settings: UserSettings
  locale: Locale
  view: AppView
  workspaces: Workspace[]
  activeWorkspace: Workspace | null
  projects: AceProject[]
  activeProject: AceProject | null
  projectCountByWorkspace: Record<string, number>
  setLocale: (locale: Locale) => void
  setTheme: (theme: ThemeMode) => void
  resolvedTheme: ResolvedTheme
  setProjectsViewMode: (mode: UserSettings['projectsViewMode']) => void
  setSquadViewMode: (mode: UserSettings['squadViewMode']) => void
  saveSetupProgress: (settings: UserSettings) => void
  updateProfile: (profile: {
    displayName: string
    avatarDataUrl: string | null
    isPlayer: boolean
  }) => void
  updateHiDrive: (hidrive: HiDriveConfig) => void
  updateProjectTitlePrefs: (prefs: {
    includeDate?: boolean
    dateFormat?: UserSettings['projectTitleDateFormat']
  }) => void
  completeSetup: (settings: UserSettings, bootstrap: SetupBootstrap) => void
  navigate: (view: AppView) => void
  selectedPlayerId: string | null
  openPlayer: (playerId: string) => void
  createWorkspace: (name: string) => void
  openWorkspace: (id: string) => void
  updateWorkspace: (
    id: string,
    patch: {
      name?: string
      teamLogoDataUrl?: string | null
      settings?: Partial<WorkspaceSettings>
    },
  ) => void
  deleteWorkspace: (id: string) => void
  deleteAllData: () => void
  addSquadPlayer: (input: {
    name: string
    number: number
    position?: string
    heightCm?: number | null
    photoDataUrl?: string | null
  }) => void
  updateSquadPlayer: (
    playerId: string,
    patch: {
      name?: string
      number?: number
      position?: string
      heightCm?: number | null
      photoDataUrl?: string | null
    },
  ) => void
  removeSquadPlayer: (playerId: string) => void
  addPlayerMetric: (
    playerId: string,
    input: {
      kind: PlayerMetricKind
      value: number
      recordedAt?: string
      label?: string
      note?: string
    },
  ) => void
  removePlayerMetric: (playerId: string, metricId: string) => void
  createProject: (input: {
    name?: string
    homeTeam: string
    awayTeam: string
    homeShort?: string
    awayShort?: string
    homeIconDataUrl?: string | null
    awayIconDataUrl?: string | null
    iconDataUrl?: string | null
    result?: MatchResult
    setsScore?: { home: number; away: number } | null
  }) => void
  updateProject: (
    id: string,
    patch: {
      name?: string
      iconDataUrl?: string | null
      result?: MatchResult
      setsScore?: { home: number; away: number } | null
      homeIconDataUrl?: string | null
      awayIconDataUrl?: string | null
      homeTeam?: string
      awayTeam?: string
    },
  ) => void
  deleteProject: (id: string) => void
  openProject: (id: string) => void
  closeProject: () => void
  enterTool: (toolId: ToolId) => void
  updateToolData: <T extends ToolId>(
    toolId: T,
    next:
      | ProjectToolDocuments[T]
      | ((prev: ProjectToolDocuments[T]) => ProjectToolDocuments[T]),
  ) => void
  updatePlayerTracker: (
    next:
      | ProjectToolDocuments['player-tracker']
      | ((
          prev: ProjectToolDocuments['player-tracker'],
        ) => ProjectToolDocuments['player-tracker']),
  ) => void
  setProjectMedia: (projectId: string, media: MediaManifest) => void
  applyCollabSnapshot: (snapshot: {
    projectId: string
    project: AceProject['project']
    tools: ProjectToolDocuments
    media: MediaManifest
  }) => void
  importAceproj: (file: File) => Promise<void>
  exportAceproj: (id?: string) => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null)

function collectProjectSquad(ace: AceProject): Player[] {
  const fromProject = Array.isArray(ace.project.squad) ? ace.project.squad : []
  const fromTool = Array.isArray(ace.tools?.['player-tracker']?.squad)
    ? ace.tools['player-tracker'].squad
    : []
  return mergePlayersIntoSquad(fromProject, fromTool)
}

function loadInitialData(locale: Locale): {
  workspaces: Workspace[]
  projects: AceProject[]
} {
  let workspaces = loadWorkspaces()
  let projects = loadProjects()
  const orphans = projects.filter((p) => !p.workspaceId)
  if (orphans.length > 0) {
    let targetId = workspaces[0]?.id
    if (!targetId) {
      const fallback = createWorkspace(
        locale === 'de' ? 'Mein Verein' : 'My club',
      )
      workspaces = [fallback]
      targetId = fallback.id
    }
    projects = projects.map((p) =>
      p.workspaceId ? p : { ...p, workspaceId: targetId },
    )
  }

  workspaces = workspaces.map((workspace) => {
    if (workspace.squad.length > 0) return workspace
    const fromProjects = projects
      .filter((ace) => ace.workspaceId === workspace.id)
      .flatMap(collectProjectSquad)
    if (fromProjects.length === 0) return workspace
    return {
      ...workspace,
      squad: mergePlayersIntoSquad([], fromProjects, {
        includeTemporary: false,
      }),
      updatedAt: new Date().toISOString(),
    }
  })

  return { workspaces, projects }
}

function resolveInitialWorkspaceId(
  workspaces: Workspace[],
  lastWorkspaceId: string | null,
): string | null {
  if (lastWorkspaceId && workspaces.some((w) => w.id === lastWorkspaceId)) {
    return lastWorkspaceId
  }
  return workspaces[0]?.id ?? null
}

function touchWorkspace(workspace: Workspace): Workspace {
  return { ...workspace, updatedAt: new Date().toISOString() }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() =>
    loadUserSettings(),
  )
  const [view, setView] = useState<AppView>(
    () => loadUserSettings().homeTab,
  )
  const [initial] = useState(() => loadInitialData(loadUserSettings().locale))
  const [workspaces, setWorkspaces] = useState<Workspace[]>(
    () => initial.workspaces,
  )
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    () =>
      resolveInitialWorkspaceId(
        initial.workspaces,
        loadUserSettings().lastWorkspaceId,
      ),
  )
  const [projects, setProjects] = useState<AceProject[]>(() => initial.projects)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(loadUserSettings().theme),
  )

  useEffect(() => {
    saveProjects(projects)
  }, [projects])

  useEffect(() => {
    saveWorkspaces(workspaces)
  }, [workspaces])

  useEffect(() => {
    saveUserSettings(settings)
  }, [settings])

  useEffect(() => {
    const next = resolveTheme(settings.theme)
    setResolvedTheme(next)
    applyDocumentTheme(next)
    syncElectronThemePreference(settings.theme)
  }, [settings.theme])

  useEffect(() => {
    if (settings.theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const next = resolveTheme('system')
      setResolvedTheme(next)
      applyDocumentTheme(next)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [settings.theme])

  useEffect(() => {
    if (!activeWorkspaceId) return
    setSettings((prev) =>
      prev.lastWorkspaceId === activeWorkspaceId
        ? prev
        : { ...prev, lastWorkspaceId: activeWorkspaceId },
    )
  }, [activeWorkspaceId])

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) ?? null

  const workspaceProjects = useMemo(
    () =>
      activeWorkspaceId
        ? projects.filter((p) => p.workspaceId === activeWorkspaceId)
        : [],
    [projects, activeWorkspaceId],
  )

  const projectCountByWorkspace = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const project of projects) {
      if (!project.workspaceId) continue
      counts[project.workspaceId] = (counts[project.workspaceId] ?? 0) + 1
    }
    return counts
  }, [projects])

  const activeProject =
    workspaceProjects.find((ace) => ace.project.id === activeProjectId) ?? null

  const setLocale = useCallback((locale: Locale) => {
    setSettings((prev) => ({ ...prev, locale }))
  }, [])

  const setTheme = useCallback((theme: ThemeMode) => {
    setSettings((prev) => ({ ...prev, theme }))
  }, [])

  const setProjectsViewMode = useCallback(
    (mode: UserSettings['projectsViewMode']) => {
      setSettings((prev) => ({ ...prev, projectsViewMode: mode }))
    },
    [],
  )

  const setSquadViewMode = useCallback(
    (mode: UserSettings['squadViewMode']) => {
      setSettings((prev) => ({ ...prev, squadViewMode: mode }))
    },
    [],
  )

  const saveSetupProgress = useCallback((next: UserSettings) => {
    setSettings({ ...next, setupComplete: false })
  }, [])

  const updateProfile = useCallback(
    (profile: {
      displayName: string
      avatarDataUrl: string | null
      isPlayer: boolean
    }) => {
      setSettings((prev) => ({
        ...prev,
        displayName: profile.displayName.trim(),
        avatarDataUrl: profile.avatarDataUrl,
        isPlayer: profile.isPlayer,
      }))
    },
    [],
  )

  const updateHiDrive = useCallback((hidrive: HiDriveConfig) => {
    setSettings((prev) => ({
      ...prev,
      hidrive,
      cloudConnectorId: hidrive.connected ? 'hidrive' : prev.cloudConnectorId,
    }))
  }, [])

  const updateProjectTitlePrefs = useCallback(
    (prefs: {
      includeDate?: boolean
      dateFormat?: UserSettings['projectTitleDateFormat']
    }) => {
      setSettings((prev) => ({
        ...prev,
        projectTitleIncludeDate:
          prefs.includeDate ?? prev.projectTitleIncludeDate,
        projectTitleDateFormat:
          prefs.dateFormat ?? prev.projectTitleDateFormat,
      }))
    },
    [],
  )

  const completeSetup = useCallback(
    (next: UserSettings, bootstrap: SetupBootstrap) => {
      const workspace = createWorkspace(bootstrap.workspaceName)
      setSettings({
        ...next,
        setupComplete: true,
        setupStep: 0,
        lastWorkspaceId: workspace.id,
        pendingWorkspaceName: '',
        pendingHomeTeam: '',
        pendingAwayTeam: '',
        pendingProjectName: '',
      })
      setWorkspaces((prev) => [workspace, ...prev])
      setActiveWorkspaceId(workspace.id)
      setActiveProjectId(null)
      setView('squad')
    },
    [],
  )

  const navigate = useCallback((next: AppView) => {
    if (next === 'squad' || next === 'games') {
      setActiveProjectId(null)
      setSettings((prev) =>
        prev.homeTab === next ? prev : { ...prev, homeTab: next },
      )
    }
    if (next !== 'player') {
      setSelectedPlayerId(null)
    }
    setView(next)
  }, [])

  const openPlayer = useCallback((playerId: string) => {
    setActiveProjectId(null)
    setSelectedPlayerId(playerId)
    setView('player')
  }, [])

  const handleCreateWorkspace = useCallback((name: string) => {
    const workspace = createWorkspace(name)
    setWorkspaces((prev) => [workspace, ...prev])
    setActiveWorkspaceId(workspace.id)
    setActiveProjectId(null)
    setSettings((prev) => ({
      ...prev,
      lastWorkspaceId: workspace.id,
      homeTab: 'squad',
    }))
    setView('squad')
  }, [])

  const openWorkspace = useCallback(
    (id: string) => {
      setActiveWorkspaceId(id)
      setActiveProjectId(null)
      setSettings((prev) => ({ ...prev, lastWorkspaceId: id }))
      setView(settings.homeTab)
    },
    [settings.homeTab],
  )

  const updateWorkspace = useCallback(
    (
      id: string,
      patch: {
        name?: string
        teamLogoDataUrl?: string | null
        settings?: Partial<WorkspaceSettings>
      },
    ) => {
      setWorkspaces((prev) =>
        prev.map((workspace) => {
          if (workspace.id !== id) return workspace
          return touchWorkspace({
            ...workspace,
            name: patch.name?.trim() || workspace.name,
            teamLogoDataUrl:
              patch.teamLogoDataUrl !== undefined
                ? patch.teamLogoDataUrl
                : workspace.teamLogoDataUrl,
            settings: patch.settings
              ? { ...workspace.settings, ...patch.settings }
              : workspace.settings,
          })
        }),
      )
    },
    [],
  )

  const deleteWorkspace = useCallback((id: string) => {
    setWorkspaces((prev) => {
      const next = prev.filter((workspace) => workspace.id !== id)
      setActiveWorkspaceId((current) => {
        if (current !== id) return current
        const fallback = next[0]?.id ?? null
        setSettings((settingsPrev) => ({
          ...settingsPrev,
          lastWorkspaceId: fallback,
        }))
        return fallback
      })
      return next
    })
    setProjects((prev) => prev.filter((project) => project.workspaceId !== id))
    setActiveProjectId(null)
    setView(settings.homeTab)
  }, [settings.homeTab])

  const deleteAllData = useCallback(() => {
    clearUserSettingsStorage()
    clearWorkspacesStorage()
    clearProjectsStorage()
    void clearAllPersistedData()
    setSettings({ ...DEFAULT_USER_SETTINGS })
    setWorkspaces([])
    setProjects([])
    setActiveWorkspaceId(null)
    setActiveProjectId(null)
    setView(DEFAULT_USER_SETTINGS.homeTab)
  }, [])

  const addSquadPlayer = useCallback(
    (input: {
      name: string
      number: number
      position?: string
      heightCm?: number | null
      photoDataUrl?: string | null
    }) => {
      if (!activeWorkspaceId) return
      const player = createPlayer(input)
      setWorkspaces((prev) =>
        prev.map((workspace) => {
          if (workspace.id !== activeWorkspaceId) return workspace
          return touchWorkspace({
            ...workspace,
            squad: [...workspace.squad, player],
          })
        }),
      )
    },
    [activeWorkspaceId],
  )

  const updateSquadPlayer = useCallback(
    (
      playerId: string,
      patch: {
        name?: string
        number?: number
        position?: string
        heightCm?: number | null
        photoDataUrl?: string | null
      },
    ) => {
      if (!activeWorkspaceId) return
      setWorkspaces((prev) =>
        prev.map((workspace) => {
          if (workspace.id !== activeWorkspaceId) return workspace
          return touchWorkspace({
            ...workspace,
            squad: workspace.squad.map((player) => {
              if (player.id !== playerId) return player
              return {
                ...player,
                name: patch.name?.trim() || player.name,
                number:
                  patch.number !== undefined && Number.isFinite(patch.number)
                    ? Math.max(0, Math.floor(patch.number))
                    : player.number,
                position:
                  patch.position !== undefined
                    ? patch.position.trim()
                    : player.position,
                heightCm:
                  patch.heightCm !== undefined
                    ? patch.heightCm
                    : player.heightCm,
                photoDataUrl:
                  patch.photoDataUrl !== undefined
                    ? patch.photoDataUrl
                    : player.photoDataUrl,
              }
            }),
          })
        }),
      )
    },
    [activeWorkspaceId],
  )

  const removeSquadPlayer = useCallback(
    (playerId: string) => {
      if (!activeWorkspaceId) return
      setWorkspaces((prev) =>
        prev.map((workspace) => {
          if (workspace.id !== activeWorkspaceId) return workspace
          return touchWorkspace({
            ...workspace,
            squad: workspace.squad.filter((player) => player.id !== playerId),
          })
        }),
      )
    },
    [activeWorkspaceId],
  )

  const addPlayerMetric = useCallback(
    (
      playerId: string,
      input: {
        kind: PlayerMetricKind
        value: number
        recordedAt?: string
        label?: string
        note?: string
      },
    ) => {
      if (!activeWorkspaceId) return
      const sample = createMetricSample(input)
      const sampleKey = metricSampleKey(sample)
      const sampleDay = metricDayKey(sample.recordedAt)
      setWorkspaces((prev) =>
        prev.map((workspace) => {
          if (workspace.id !== activeWorkspaceId) return workspace
          return touchWorkspace({
            ...workspace,
            squad: workspace.squad.map((player) => {
              if (player.id !== playerId) return player
              const metrics = [...(player.metrics ?? [])]
              const existingIndex = metrics.findIndex(
                (entry) =>
                  metricSampleKey(entry) === sampleKey &&
                  metricDayKey(entry.recordedAt) === sampleDay,
              )
              if (existingIndex >= 0) {
                metrics[existingIndex] = {
                  ...metrics[existingIndex],
                  id: metrics[existingIndex].id,
                  kind: sample.kind,
                  value: sample.value,
                  recordedAt: sample.recordedAt,
                  ...(sample.label
                    ? { label: sample.label }
                    : metrics[existingIndex].label
                      ? { label: metrics[existingIndex].label }
                      : {}),
                  ...(sample.note
                    ? { note: sample.note }
                    : metrics[existingIndex].note
                      ? { note: metrics[existingIndex].note }
                      : {}),
                }
                return { ...player, metrics }
              }
              metrics.push(sample)
              return { ...player, metrics }
            }),
          })
        }),
      )
    },
    [activeWorkspaceId],
  )

  const removePlayerMetric = useCallback(
    (playerId: string, metricId: string) => {
      if (!activeWorkspaceId) return
      setWorkspaces((prev) =>
        prev.map((workspace) => {
          if (workspace.id !== activeWorkspaceId) return workspace
          return touchWorkspace({
            ...workspace,
            squad: workspace.squad.map((player) => {
              if (player.id !== playerId) return player
              return {
                ...player,
                metrics: (player.metrics ?? []).filter(
                  (sample) => sample.id !== metricId,
                ),
              }
            }),
          })
        }),
      )
    },
    [activeWorkspaceId],
  )

  const handleCreateProject = useCallback(
    (input: {
      name?: string
      homeTeam: string
      awayTeam: string
      homeShort?: string
      awayShort?: string
      homeIconDataUrl?: string | null
      awayIconDataUrl?: string | null
      iconDataUrl?: string | null
      result?: MatchResult
      setsScore?: { home: number; away: number } | null
    }) => {
      if (!activeWorkspaceId) return
      const squad = activeWorkspace?.squad ?? []
      const ace = createEmptyProject({
        ...input,
        workspaceId: activeWorkspaceId,
      })
      const withSquad: AceProject = {
        ...ace,
        project: { ...ace.project, squad: squad.map((p) => ({ ...p })) },
        tools: {
          ...ace.tools,
          'player-tracker': {
            ...ace.tools['player-tracker'],
            squad: squad.map((p) => ({ ...p })),
          },
        },
      }
      setProjects((prev) => [withSquad, ...prev])
      setActiveProjectId(withSquad.project.id)
      setView('game')
    },
    [activeWorkspaceId, activeWorkspace?.squad],
  )

  const updateProject = useCallback(
    (
      id: string,
      patch: {
        name?: string
        iconDataUrl?: string | null
        result?: MatchResult
        setsScore?: { home: number; away: number } | null
        homeIconDataUrl?: string | null
        awayIconDataUrl?: string | null
        homeTeam?: string
        awayTeam?: string
      },
    ) => {
      setProjects((prev) =>
        prev.map((ace) => {
          if (ace.project.id !== id) return ace
          const name = patch.name?.trim() || ace.project.name
          return {
            ...ace,
            fileName: toAceprojFileName(name),
            project: {
              ...ace.project,
              name,
              updatedAt: new Date().toISOString(),
              iconDataUrl:
                patch.iconDataUrl !== undefined
                  ? patch.iconDataUrl
                  : ace.project.iconDataUrl,
              result:
                patch.result !== undefined ? patch.result : ace.project.result,
              setsScore:
                patch.setsScore !== undefined
                  ? patch.setsScore
                  : ace.project.setsScore,
              teams: {
                home: {
                  ...ace.project.teams.home,
                  name:
                    patch.homeTeam?.trim() || ace.project.teams.home.name,
                  iconDataUrl:
                    patch.homeIconDataUrl !== undefined
                      ? patch.homeIconDataUrl
                      : ace.project.teams.home.iconDataUrl,
                },
                away: {
                  ...ace.project.teams.away,
                  name:
                    patch.awayTeam?.trim() || ace.project.teams.away.name,
                  iconDataUrl:
                    patch.awayIconDataUrl !== undefined
                      ? patch.awayIconDataUrl
                      : ace.project.teams.away.iconDataUrl,
                },
              },
            },
          }
        }),
      )
    },
    [],
  )

  const deleteProject = useCallback(
    (id: string) => {
      setProjects((prev) => prev.filter((ace) => ace.project.id !== id))
      setActiveProjectId((current) => (current === id ? null : current))
      setView(settings.homeTab)
    },
    [settings.homeTab],
  )

  const openProject = useCallback(
    (id: string) => {
      const squad = activeWorkspace?.squad ?? []
      if (squad.length > 0) {
        setProjects((prev) =>
          prev.map((ace) => {
            if (ace.project.id !== id) return ace
            const merged = mergePlayersIntoSquad(ace.project.squad, squad)
            return {
              ...ace,
              project: { ...ace.project, squad: merged },
              tools: {
                ...ace.tools,
                'player-tracker': {
                  ...ace.tools['player-tracker'],
                  squad: merged,
                },
              },
            }
          }),
        )
      }
      setActiveProjectId(id)
      const ace = projects.find((project) => project.project.id === id)
      if (ace?.lastToolId && isToolId(ace.lastToolId)) {
        setView(ace.lastToolId)
        return
      }
      setView('game')
    },
    [projects, activeWorkspace?.squad],
  )

  const closeProject = useCallback(() => {
    setActiveProjectId(null)
    setView(settings.homeTab)
  }, [settings.homeTab])

  const enterTool = useCallback(
    (toolId: ToolId) => {
      if (!activeProjectId) return
      setProjects((prev) =>
        prev.map((ace) => {
          if (ace.project.id !== activeProjectId) return ace
          return {
            ...ace,
            lastToolId: toolId,
            project: {
              ...ace.project,
              updatedAt: new Date().toISOString(),
            },
          }
        }),
      )
      setView(toolId)
    },
    [activeProjectId],
  )

  const updateToolData = useCallback(
    <T extends ToolId>(
      toolId: T,
      next:
        | ProjectToolDocuments[T]
        | ((prev: ProjectToolDocuments[T]) => ProjectToolDocuments[T]),
    ) => {
      if (!activeProjectId) return
      setProjects((prev) =>
        prev.map((ace) => {
          if (ace.project.id !== activeProjectId) return ace
          const tools =
            ace.tools ??
            createEmptyToolDocuments({
              videoAnalysis: ace.sync,
            })
          const current = tools[toolId]
          const resolved =
            typeof next === 'function'
              ? (
                  next as (
                    prev: ProjectToolDocuments[T],
                  ) => ProjectToolDocuments[T]
                )(current)
              : next
          const nextTools = { ...tools, [toolId]: resolved }
          return {
            ...ace,
            tools: nextTools,
            sync: nextTools['video-analysis'],
            project: {
              ...ace.project,
              updatedAt: new Date().toISOString(),
            },
          }
        }),
      )
    },
    [activeProjectId],
  )

  const updatePlayerTracker = useCallback(
    (
      next:
        | ProjectToolDocuments['player-tracker']
        | ((
            prev: ProjectToolDocuments['player-tracker'],
          ) => ProjectToolDocuments['player-tracker']),
    ) => {
      if (!activeProjectId) return
      setProjects((prev) =>
        prev.map((ace) => {
          if (ace.project.id !== activeProjectId) return ace
          const tools =
            ace.tools ??
            createEmptyToolDocuments({
              videoAnalysis: ace.sync,
            })
          const current = tools['player-tracker']
          const resolved =
            typeof next === 'function' ? next(current) : next
          return {
            ...ace,
            tools: { ...tools, 'player-tracker': resolved },
            sync: tools['video-analysis'],
            project: {
              ...ace.project,
              squad: resolved.squad.map((player) => ({
                ...player,
                metrics: player.metrics.map((sample) => ({ ...sample })),
              })),
              lineups: {
                home: resolved.lineups.home.map((slot) => ({ ...slot })),
                away: resolved.lineups.away.map((slot) => ({ ...slot })),
              },
              updatedAt: new Date().toISOString(),
            },
          }
        }),
      )
    },
    [activeProjectId],
  )

  const setProjectMedia = useCallback(
    (projectId: string, media: MediaManifest) => {
      setProjects((prev) =>
        prev.map((ace) => {
          if (ace.project.id !== projectId) return ace
          return {
            ...ace,
            media,
            project: {
              ...ace.project,
              updatedAt: new Date().toISOString(),
            },
          }
        }),
      )
    },
    [],
  )

  const applyCollabSnapshot = useCallback(
    (snapshot: {
      projectId: string
      project: AceProject['project']
      tools: ProjectToolDocuments
      media: MediaManifest
    }) => {
      setProjects((prev) =>
        prev.map((ace) => {
          if (ace.project.id !== snapshot.projectId) return ace
          return {
            ...ace,
            project: {
              ...snapshot.project,
              id: ace.project.id,
              updatedAt: new Date().toISOString(),
            },
            tools: snapshot.tools,
            sync: snapshot.tools['video-analysis'],
            media: snapshot.media,
            fileName: toAceprojFileName(snapshot.project.name),
          }
        }),
      )
    },
    [],
  )

  const importAceproj = useCallback(
    async (file: File) => {
      if (!activeWorkspaceId) return
      const ace = await unpackAceproj(file)
      const scoped = { ...ace, workspaceId: activeWorkspaceId }
      const importedSquad = collectProjectSquad(scoped)
      if (importedSquad.length > 0) {
        setWorkspaces((prev) =>
          prev.map((workspace) => {
            if (workspace.id !== activeWorkspaceId) return workspace
            return touchWorkspace({
              ...workspace,
              squad: mergePlayersIntoSquad(workspace.squad, importedSquad, {
                includeTemporary: false,
              }),
            })
          }),
        )
      }
      setProjects((prev) => {
        const without = prev.filter((p) => p.project.id !== scoped.project.id)
        return [scoped, ...without]
      })
      setActiveProjectId(scoped.project.id)
      setView('game')
    },
    [activeWorkspaceId],
  )

  const exportAceproj = useCallback(
    async (id?: string) => {
      const targetId = id ?? activeProjectId
      const ace = projects.find((p) => p.project.id === targetId)
      if (!ace) return
      await downloadAceproj(ace)
    },
    [activeProjectId, projects],
  )

  const value = useMemo<WorkspaceValue>(
    () => ({
      settings,
      locale: settings.locale,
      resolvedTheme,
      view,
      workspaces,
      activeWorkspace,
      projects: workspaceProjects,
      activeProject,
      projectCountByWorkspace,
      setLocale,
      setTheme,
      setProjectsViewMode,
      setSquadViewMode,
      saveSetupProgress,
      updateProfile,
      updateHiDrive,
      updateProjectTitlePrefs,
      completeSetup,
      navigate,
      selectedPlayerId,
      openPlayer,
      createWorkspace: handleCreateWorkspace,
      openWorkspace,
      updateWorkspace,
      deleteWorkspace,
      deleteAllData,
      addSquadPlayer,
      updateSquadPlayer,
      removeSquadPlayer,
      addPlayerMetric,
      removePlayerMetric,
      createProject: handleCreateProject,
      updateProject,
      deleteProject,
      openProject,
      closeProject,
      enterTool,
      updateToolData,
      updatePlayerTracker,
      setProjectMedia,
      applyCollabSnapshot,
      importAceproj,
      exportAceproj,
    }),
    [
      settings,
      view,
      resolvedTheme,
      workspaces,
      activeWorkspace,
      workspaceProjects,
      activeProject,
      projectCountByWorkspace,
      selectedPlayerId,
      setLocale,
      setTheme,
      setProjectsViewMode,
      setSquadViewMode,
      saveSetupProgress,
      updateProfile,
      updateHiDrive,
      updateProjectTitlePrefs,
      completeSetup,
      navigate,
      openPlayer,
      handleCreateWorkspace,
      openWorkspace,
      updateWorkspace,
      deleteWorkspace,
      deleteAllData,
      addSquadPlayer,
      updateSquadPlayer,
      removeSquadPlayer,
      addPlayerMetric,
      removePlayerMetric,
      handleCreateProject,
      updateProject,
      deleteProject,
      openProject,
      closeProject,
      enterTool,
      updateToolData,
      updatePlayerTracker,
      setProjectMedia,
      applyCollabSnapshot,
      importAceproj,
      exportAceproj,
    ],
  )

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace(): WorkspaceValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }
  return ctx
}
