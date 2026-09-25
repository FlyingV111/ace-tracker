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
} from './aceproj'
import type {
  AceProject,
  AppView,
  Locale,
  MatchResult,
  MediaManifest,
  ProjectToolDocuments,
  ToolId,
  Workspace,
  WorkspaceSettings,
} from './types'
import {
  DEFAULT_USER_SETTINGS,
  loadUserSettings,
  saveUserSettings,
  clearUserSettingsStorage,
  type UserSettings,
  type ThemeMode,
  type HiDriveConfig,
} from './settings'
import { clearAllPersistedData } from './persistence'
import {
  applyDocumentTheme,
  resolveTheme,
  syncElectronThemePreference,
  type ResolvedTheme,
} from './theme'
import {
  createWorkspace,
  loadWorkspaces,
  saveWorkspaces,
  clearWorkspacesStorage,
} from './workspaces'

export type SetupBootstrap = {
  workspaceName: string
  homeTeam: string
  awayTeam: string
  projectName?: string
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
  createWorkspace: (name: string) => void
  openWorkspace: (id: string) => void
  updateWorkspace: (
    id: string,
    patch: { name?: string; settings?: Partial<WorkspaceSettings> },
  ) => void
  deleteWorkspace: (id: string) => void
  deleteAllData: () => void
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
  }) => void
  updateProject: (
    id: string,
    patch: {
      name?: string
      iconDataUrl?: string | null
      result?: MatchResult
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
  /** Replace the media manifest for a project (videos are references only). */
  setProjectMedia: (projectId: string, media: MediaManifest) => void
  /**
   * Apply a collab P2P snapshot (project meta + tools + media refs).
   * Used when a peer sends updates — never includes video bytes.
   */
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

function loadInitialData(locale: Locale): {
  workspaces: Workspace[]
  projects: AceProject[]
} {
  let workspaces = loadWorkspaces()
  let projects = loadProjects()
  const orphans = projects.filter((p) => !p.workspaceId)
  if (orphans.length === 0) return { workspaces, projects }

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

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() =>
    loadUserSettings(),
  )
  const [view, setView] = useState<AppView>('projects')
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
      const ace = createEmptyProject({
        workspaceId: workspace.id,
        homeTeam: bootstrap.homeTeam,
        awayTeam: bootstrap.awayTeam,
        name: bootstrap.projectName,
      })
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
      setProjects((prev) => [ace, ...prev])
      setActiveWorkspaceId(workspace.id)
      setActiveProjectId(ace.project.id)
      setView('project')
    },
    [],
  )

  const navigate = useCallback((next: AppView) => {
    setView(next)
  }, [])

  const handleCreateWorkspace = useCallback((name: string) => {
    const workspace = createWorkspace(name)
    setWorkspaces((prev) => [workspace, ...prev])
    setActiveWorkspaceId(workspace.id)
    setActiveProjectId(null)
    setSettings((prev) => ({ ...prev, lastWorkspaceId: workspace.id }))
    setView('projects')
  }, [])

  const openWorkspace = useCallback((id: string) => {
    setActiveWorkspaceId(id)
    setActiveProjectId(null)
    setSettings((prev) => ({ ...prev, lastWorkspaceId: id }))
    setView('projects')
  }, [])

  const updateWorkspace = useCallback(
    (
      id: string,
      patch: { name?: string; settings?: Partial<WorkspaceSettings> },
    ) => {
      setWorkspaces((prev) =>
        prev.map((workspace) => {
          if (workspace.id !== id) return workspace
          return {
            ...workspace,
            name: patch.name?.trim() || workspace.name,
            settings: patch.settings
              ? { ...workspace.settings, ...patch.settings }
              : workspace.settings,
            updatedAt: new Date().toISOString(),
          }
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
    setView('projects')
  }, [])

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
    setView('projects')
  }, [])

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
    }) => {
      if (!activeWorkspaceId) return
      const ace = createEmptyProject({
        ...input,
        workspaceId: activeWorkspaceId,
      })
      setProjects((prev) => [ace, ...prev])
      setActiveProjectId(ace.project.id)
      setView('project')
    },
    [activeWorkspaceId],
  )

  const updateProject = useCallback(
    (
      id: string,
      patch: {
        name?: string
        iconDataUrl?: string | null
        result?: MatchResult
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
      setView('projects')
    },
    [],
  )

  const openProject = useCallback(
    (id: string) => {
      setActiveProjectId(id)
      const ace = projects.find((project) => project.project.id === id)
      if (ace?.lastToolId && isToolId(ace.lastToolId)) {
        setView(ace.lastToolId)
        return
      }
      setView('project')
    },
    [projects],
  )

  const closeProject = useCallback(() => {
    setActiveProjectId(null)
    setView('projects')
  }, [])

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
          const tools = ace.tools ?? createEmptyToolDocuments({
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
      setProjects((prev) => {
        const without = prev.filter((p) => p.project.id !== scoped.project.id)
        return [scoped, ...without]
      })
      setActiveProjectId(scoped.project.id)
      setView('project')
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
      saveSetupProgress,
      updateProfile,
      updateHiDrive,
      updateProjectTitlePrefs,
      completeSetup,
      navigate,
      createWorkspace: handleCreateWorkspace,
      openWorkspace,
      updateWorkspace,
      deleteWorkspace,
      deleteAllData,
      createProject: handleCreateProject,
      updateProject,
      deleteProject,
      openProject,
      closeProject,
      enterTool,
      updateToolData,
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
      setLocale,
      setTheme,
      setProjectsViewMode,
      saveSetupProgress,
      updateProfile,
      updateHiDrive,
      updateProjectTitlePrefs,
      completeSetup,
      navigate,
      handleCreateWorkspace,
      openWorkspace,
      updateWorkspace,
      deleteWorkspace,
      deleteAllData,
      handleCreateProject,
      updateProject,
      deleteProject,
      openProject,
      closeProject,
      enterTool,
      updateToolData,
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
