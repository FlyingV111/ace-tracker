/**
 * Friend-link helpers — no network yet, just codes you can share.
 */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function randomChunk(length: number): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length]
  }
  return out
}

/** e.g. "ACE-7K2M" — easy to read aloud */
export function createRoomCode(): string {
  return `ACE-${randomChunk(4)}`
}

export function createPassphrase(): string {
  return randomChunk(8)
}

/**
 * ace-tracker://join?room=ACE-7K2M
 * (custom protocol can be wired in Electron later)
 */
export function buildFriendLink(roomCode: string): string {
  const code = roomCode.trim().toUpperCase()
  return `ace-tracker://join?room=${encodeURIComponent(code)}`
}

export function parseFriendLink(link: string): { roomCode: string } | null {
  const trimmed = link.trim()
  try {
    if (trimmed.startsWith('ace-tracker://')) {
      const url = new URL(trimmed)
      const room = url.searchParams.get('room')
      if (room) return { roomCode: room.toUpperCase() }
    }
  } catch {
    // fall through
  }

  const match = trimmed.match(/ACE-[A-Z0-9]{4}/i)
  if (match) return { roomCode: match[0]!.toUpperCase() }
  return null
}
