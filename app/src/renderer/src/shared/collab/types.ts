/**
 * Collaboration types - keep small on purpose.
 */

export type CollabPeer = {
  id: string
  displayName: string
}

export type CollabSessionInfo = {
  /** Short code people type or put in a Friend Link */
  roomCode: string
  /** Shared secret - encrypts the peer channel (not sent as project data) */
  passphrase: string
  /**
   * Signaling WebSocket URLs (handshake only - no match/video content).
   * Empty = built-in defaults.
   */
  signalingUrls: string[]
  /** Who started the session on this machine */
  role: 'host' | 'guest'
}

export type CollabConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'

export type CollabMessage =
  | { type: 'hello'; peer: CollabPeer }
  | { type: 'ping' }
  | { type: 'project-hint'; projectId: string; projectName: string }

/** Snapshot of project data that syncs over P2P (no video bytes). */
export type CollabProjectSnapshot = {
  projectId: string
  project: unknown
  tools: unknown
  media: unknown
}

/** Visible ping used in the connection test panel. */
export type CollabTestPing = {
  id: string
  from: string
  text: string
  n: number
  at: string
}

/** Public ephemeral signaling - only WebRTC handshake, no Ace Tracker content. */
export const DEFAULT_SIGNALING_URLS = [
  'wss://signaling.yjs.dev',
] as const

/**
 * Free public STUN + TURN (Open Relay / Metered community).
 * No Ace Tracker account, no paid plan - best-effort, not a SLA.
 * Project JSON still goes P2P; TURN only relays encrypted WebRTC bytes if needed.
 */
export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:openrelay.metered.ca:80' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
]
