import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import {
  buildFriendLink,
  createPassphrase,
  createRoomCode,
} from './invite'
import {
  DEFAULT_ICE_SERVERS,
  DEFAULT_SIGNALING_URLS,
  type CollabConnectionState,
  type CollabMessage,
  type CollabPeer,
  type CollabProjectSnapshot,
  type CollabSessionInfo,
  type CollabTestPing,
} from './types'

type Listener = (state: CollabConnectionState) => void
type MessageListener = (message: CollabMessage, from?: CollabPeer) => void
type SnapshotListener = (snapshot: CollabProjectSnapshot) => void
type TestPingListener = (ping: CollabTestPing) => void

/**
 * Room id for signaling: derived from code + passphrase so both secrets are needed.
 * Signaling never sees your project JSON - only this opaque id + WebRTC handshake.
 */
export async function collabRoomId(
  roomCode: string,
  passphrase: string,
): Promise<string> {
  const raw = new TextEncoder().encode(
    `ace-tracker:${roomCode.trim().toUpperCase()}:${passphrase}`,
  )
  const digest = await crypto.subtle.digest('SHA-256', raw)
  const hex = [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `ace-${hex.slice(0, 32)}`
}

/**
 * Peer-to-peer session: WebRTC via y-webrtc + Yjs.
 * Match data stays on the peers - signaling is handshake only.
 */
export class CollabSession {
  readonly info: CollabSessionInfo
  private state: CollabConnectionState = 'idle'
  private readonly stateListeners = new Set<Listener>()
  private readonly messageListeners = new Set<MessageListener>()
  private readonly snapshotListeners = new Set<SnapshotListener>()
  private readonly testPingListeners = new Set<TestPingListener>()
  private readonly peers = new Map<string, CollabPeer>()
  private doc: Y.Doc | null = null
  private provider: WebrtcProvider | null = null
  private applyingRemote = false
  private mapObserver: ((event: Y.YMapEvent<unknown>) => void) | null = null
  private lastLocalTestId: string | null = null

  private constructor(info: CollabSessionInfo) {
    this.info = info
  }

  static host(signalingUrls: string[] = []): CollabSession {
    return new CollabSession({
      roomCode: createRoomCode(),
      passphrase: createPassphrase(),
      signalingUrls,
      role: 'host',
    })
  }

  static join(
    roomCode: string,
    passphrase: string,
    signalingUrls: string[] = [],
  ): CollabSession {
    return new CollabSession({
      roomCode: roomCode.trim().toUpperCase(),
      passphrase,
      signalingUrls,
      role: 'guest',
    })
  }

  get friendLink(): string {
    return buildFriendLink(this.info.roomCode)
  }

  get connectionState(): CollabConnectionState {
    return this.state
  }

  get peerCount(): number {
    return this.provider?.awareness?.getStates().size
      ? Math.max(0, this.provider.awareness.getStates().size - 1)
      : this.peers.size
  }

  listPeers(): CollabPeer[] {
    return [...this.peers.values()]
  }

  onState(listener: Listener): () => void {
    this.stateListeners.add(listener)
    return () => this.stateListeners.delete(listener)
  }

  onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener)
    return () => this.messageListeners.delete(listener)
  }

  onRemoteSnapshot(listener: SnapshotListener): () => void {
    this.snapshotListeners.add(listener)
    return () => this.snapshotListeners.delete(listener)
  }

  onTestPing(listener: TestPingListener): () => void {
    this.testPingListeners.add(listener)
    return () => this.testPingListeners.delete(listener)
  }

  /** Open WebRTC room and start syncing the Yjs document. */
  async connect(displayName: string): Promise<void> {
    if (this.provider) return

    this.setState('connecting')
    try {
      const room = await collabRoomId(
        this.info.roomCode,
        this.info.passphrase,
      )
      const signaling =
        this.info.signalingUrls.length > 0
          ? this.info.signalingUrls
          : [...DEFAULT_SIGNALING_URLS]

      const doc = new Y.Doc()
      const provider = new WebrtcProvider(room, doc, {
        password: this.info.passphrase,
        signaling,
        maxConns: 8,
        filterBcConns: true,
        // Free public STUN/TURN - no self-hosted infra, no Ace Tracker bill
        peerOpts: {
          config: {
            iceServers: DEFAULT_ICE_SERVERS,
          },
        },
      })

      provider.awareness.setLocalStateField('user', {
        name: displayName || 'Ace Tracker',
        role: this.info.role,
      })

      const onStatus = ({ connected }: { connected: boolean }) => {
        this.setState(connected ? 'connected' : 'connecting')
      }
      provider.on('status', onStatus)

      // Mark connected once awareness sees anyone (including self after join)
      const checkPeers = () => {
        const size = provider.awareness.getStates().size
        if (size >= 1 && this.state === 'connecting') {
          // Connected to signaling; peer may join shortly
          this.setState('connected')
        }
        this.peers.clear()
        provider.awareness.getStates().forEach((state, clientId) => {
          if (clientId === doc.clientID) return
          const user = state.user as { name?: string } | undefined
          this.peers.set(String(clientId), {
            id: String(clientId),
            displayName: user?.name || 'Peer',
          })
        })
      }
      provider.awareness.on('change', checkPeers)

      const map = doc.getMap<unknown>('ace')
      const observer = () => {
        const ping = readTestPing(map.get('test'))
        if (ping && ping.id !== this.lastLocalTestId) {
          for (const listener of this.testPingListeners) {
            listener(ping)
          }
        }

        if (this.applyingRemote) return
        const snapshot = readSnapshot(map)
        if (!snapshot) return
        this.applyingRemote = true
        try {
          for (const listener of this.snapshotListeners) {
            listener(snapshot)
          }
        } finally {
          this.applyingRemote = false
        }
      }
      map.observe(observer)
      this.mapObserver = observer

      this.doc = doc
      this.provider = provider

      // Give signaling a moment, then report connected (channel ready to sync)
      window.setTimeout(() => {
        if (this.state === 'connecting') this.setState('connected')
        checkPeers()
      }, 800)
    } catch (err) {
      this.setState('error')
      await this.disconnect()
      throw err instanceof Error
        ? err
        : new Error('Konnte Collab-Session nicht starten.')
    }
  }

  /** Push local project state into the shared Yjs map (no video files). */
  publishSnapshot(snapshot: CollabProjectSnapshot): void {
    if (!this.doc || this.applyingRemote) return
    const map = this.doc.getMap('ace')
    this.doc.transact(() => {
      map.set('projectId', snapshot.projectId)
      map.set('project', snapshot.project)
      map.set('tools', snapshot.tools)
      map.set('media', snapshot.media)
      map.set('updatedAt', new Date().toISOString())
    })
  }

  /** Send a visible test ping so you can confirm the other side receives data. */
  publishTestPing(input: {
    from: string
    text: string
    n: number
  }): CollabTestPing | null {
    if (!this.doc) return null
    const ping: CollabTestPing = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      from: input.from,
      text: input.text,
      n: input.n,
      at: new Date().toISOString(),
    }
    this.lastLocalTestId = ping.id
    this.doc.getMap('ace').set('test', ping)
    return ping
  }

  async disconnect(): Promise<void> {
    if (this.doc && this.mapObserver) {
      this.doc.getMap('ace').unobserve(this.mapObserver)
    }
    this.mapObserver = null
    try {
      this.provider?.disconnect()
      this.provider?.destroy()
    } catch {
      // ignore
    }
    this.provider = null
    this.doc?.destroy()
    this.doc = null
    this.peers.clear()
    this.setState('disconnected')
  }

  receiveMessage(message: CollabMessage, from?: CollabPeer): void {
    if (message.type === 'hello') {
      this.peers.set(message.peer.id, message.peer)
    }
    for (const listener of this.messageListeners) {
      listener(message, from)
    }
  }

  private setState(next: CollabConnectionState): void {
    this.state = next
    for (const listener of this.stateListeners) {
      listener(next)
    }
  }
}

function readSnapshot(
  map: Y.Map<unknown>,
): CollabProjectSnapshot | null {
  const projectId = map.get('projectId')
  const project = map.get('project')
  const tools = map.get('tools')
  const media = map.get('media')
  if (typeof projectId !== 'string' || !project || !tools || !media) {
    return null
  }
  return { projectId, project, tools, media }
}

function readTestPing(value: unknown): CollabTestPing | null {
  if (!value || typeof value !== 'object') return null
  const ping = value as CollabTestPing
  if (
    typeof ping.id !== 'string' ||
    typeof ping.from !== 'string' ||
    typeof ping.text !== 'string' ||
    typeof ping.n !== 'number' ||
    typeof ping.at !== 'string'
  ) {
    return null
  }
  return ping
}
