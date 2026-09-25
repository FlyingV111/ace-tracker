/**
 * Video / media references stored IN the project.
 * The big file itself is NEVER inside .aceproj — only these pointers.
 */

/** Where the bytes live (user's disk or user's cloud). */
export type MediaSource =
  | {
      type: 'local'
      /** Absolute path when running in Electron; otherwise often just the file name. */
      path: string
    }
  | {
      type: 'url'
      /** Direct or share link (Drive, Strato, …). */
      url: string
    }
  | {
      type: 'cloud'
      /** Must match a registered connector id, e.g. "google-drive". */
      connectorId: string
      /** Provider-specific file id. */
      remoteId: string
      /** Optional public/share URL so a helper can open it without OAuth. */
      shareUrl?: string
    }

export type MediaRole = 'main' | 'camera' | 'other'

/** One video (or other media file) attached to a project. */
export type MediaAsset = {
  id: string
  role: MediaRole
  fileName: string
  /** null until we know the size */
  sizeBytes: number | null
  /**
   * SHA-256 hex of the file contents.
   * null until hashed — used so two people know they have the SAME file.
   */
  contentHash: string | null
  /** One or more ways to find the same file. */
  sources: MediaSource[]
}

/** Root object saved as media.json inside .aceproj */
export type MediaManifest = {
  version: 1
  items: MediaAsset[]
}
