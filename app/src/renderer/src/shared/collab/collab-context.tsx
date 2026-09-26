import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  createEmptyMediaManifest,
  createEmptyToolDocuments,
  isMediaManifest,
  useWorkspace,
} from '@/shared'
import type { ProjectToolDocuments } from '@/shared'
import { CollabSession } from './session'
import type {
  CollabConnectionState,
  CollabProjectSnapshot,
  CollabTestPing,
} from './types'

type CollabContextValue = {
  session: CollabSession | null
  connectionState: CollabConnectionState
  peerCount: number
  error: string | null
  /** Last pings for the visible connection test (newest last). */
  testLog: CollabTestPing[]
  createAndConnect: () => Promise<CollabSession>
  joinAndConnect: (
    roomCode: string,
    passphrase: string,
  ) => Promise<CollabSession>
  leave: () => Promise<void>
  sendTestPing: (text?: string) => void
}

const CollabContext = createContext<CollabContextValue | null>(null)

function isProjectTools(value: unknown): value is ProjectToolDocuments {
  if (!value || typeof value !== 'object') return false
  const tools = value as ProjectToolDocuments
  return Boolean(
    tools['player-tracker'] &&
      tools['live-tracking'] &&
      tools['video-analysis'],
  )
}

/**
 * Owns the live P2P session and mirrors project JSON between peers.
 * Videos are never synced - only references in `media`.
 */
export function CollabProvider({ children }: { children: ReactNode }) {
  const { activeProject, settings, applyCollabSnapshot } = useWorkspace()
  const [session, setSession] = useState<CollabSession | null>(null)
  const [connectionState, setConnectionState] =
    useState<CollabConnectionState>('idle')
  const [peerCount, setPeerCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [testLog, setTestLog] = useState<CollabTestPing[]>([])
  const [testSeq, setTestSeq] = useState(0)
  const applyingRemote = useRef(false)
  const sessionRef = useRef<CollabSession | null>(null)
  const activeProjectRef = useRef(activeProject)

  useEffect(() => {
    activeProjectRef.current = activeProject
  }, [activeProject])

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  const leave = useCallback(async () => {
    const current = sessionRef.current
    if (current) await current.disconnect()
    sessionRef.current = null
    setSession(null)
    setConnectionState('idle')
    setPeerCount(0)
    setTestLog([])
    setTestSeq(0)
  }, [])

  const applyRemote = useCallback(
    (snapshot: CollabProjectSnapshot) => {
      const open = activeProjectRef.current
      if (!open) return
      if (!isProjectTools(snapshot.tools)) return
      if (!snapshot.project || typeof snapshot.project !== 'object') return

      const media = isMediaManifest(snapshot.media)
        ? snapshot.media
        : createEmptyMediaManifest()
      const project = snapshot.project as typeof open.project

      applyingRemote.current = true
      try {
        applyCollabSnapshot({
          projectId: open.project.id,
          project: { ...project, id: open.project.id },
          tools: snapshot.tools,
          media,
        })
      } finally {
        window.setTimeout(() => {
          applyingRemote.current = false
        }, 50)
      }
    },
    [applyCollabSnapshot],
  )

  const wireSession = useCallback(
    async (next: CollabSession) => {
      setError(null)
      setTestLog([])
      setTestSeq(0)
      next.onState((state) => {
        setConnectionState(state)
        setPeerCount(next.peerCount)
      })
      next.onRemoteSnapshot(applyRemote)
      next.onTestPing((ping) => {
        setTestLog((prev) => [...prev.slice(-19), ping])
      })

      await next.connect(settings.displayName || 'Ace Tracker')

      const open = activeProjectRef.current
      if (next.info.role === 'host' && open) {
        next.publishSnapshot({
          projectId: open.project.id,
          project: open.project,
          tools: open.tools,
          media: open.media ?? createEmptyMediaManifest(),
        })
      }

      setSession(next)
      sessionRef.current = next
      setPeerCount(next.peerCount)
    },
    [applyRemote, settings.displayName],
  )

  const sendTestPing = useCallback(
    (text?: string) => {
      const current = sessionRef.current
      if (!current) return
      const n = testSeq + 1
      setTestSeq(n)
      const ping = current.publishTestPing({
        from: settings.displayName || 'Ace Tracker',
        text: text?.trim() || `Test #${n}`,
        n,
      })
      if (ping) {
        setTestLog((prev) => [...prev.slice(-19), ping])
      }
    },
    [settings.displayName, testSeq],
  )

  const createAndConnect = useCallback(async () => {
    try {
      await leave()
      if (!activeProjectRef.current) {
        throw new Error('Kein Spiel geöffnet.')
      }
      const next = CollabSession.host()
      await wireSession(next)
      return next
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Session konnte nicht starten.'
      setError(message)
      setConnectionState('error')
      throw err
    }
  }, [leave, wireSession])

  const joinAndConnect = useCallback(
    async (roomCode: string, passphrase: string) => {
      try {
        await leave()
        if (!activeProjectRef.current) {
          throw new Error('Kein Spiel geöffnet.')
        }
        const next = CollabSession.join(roomCode, passphrase)
        await wireSession(next)
        return next
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Beitritt fehlgeschlagen.'
        setError(message)
        setConnectionState('error')
        throw err
      }
    },
    [leave, wireSession],
  )

  // Push local edits to peers
  useEffect(() => {
    if (!session || !activeProject) return
    if (connectionState !== 'connected' && connectionState !== 'connecting') {
      return
    }
    if (applyingRemote.current) return
    session.publishSnapshot({
      projectId: activeProject.project.id,
      project: activeProject.project,
      tools: activeProject.tools ?? createEmptyToolDocuments(),
      media: activeProject.media ?? createEmptyMediaManifest(),
    })
  }, [session, activeProject, connectionState])

  useEffect(() => {
    if (!activeProject && session) {
      void leave()
    }
  }, [activeProject, session, leave])

  const value = useMemo<CollabContextValue>(
    () => ({
      session,
      connectionState,
      peerCount,
      error,
      testLog,
      createAndConnect,
      joinAndConnect,
      leave,
      sendTestPing,
    }),
    [
      session,
      connectionState,
      peerCount,
      error,
      testLog,
      createAndConnect,
      joinAndConnect,
      leave,
      sendTestPing,
    ],
  )

  return (
    <CollabContext.Provider value={value}>{children}</CollabContext.Provider>
  )
}

export function useCollab(): CollabContextValue {
  const ctx = useContext(CollabContext)
  if (!ctx) {
    throw new Error('useCollab must be used within CollabProvider')
  }
  return ctx
}
