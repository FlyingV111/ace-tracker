/**
 * Media = pointers to big video files (not the files themselves).
 *
 * How to extend later:
 * 1. Add a field on MediaAsset / MediaSource in types.ts if you need it
 * 2. Keep helpers.ts boring (create / add / remove)
 * 3. Teach a cloud connector (shared/cloud/connectors/) how to download
 *
 * See also: ../cloud/README.md and ../collab/README.md
 */

export type {
  MediaAsset,
  MediaManifest,
  MediaRole,
  MediaSource,
} from './types'
export {
  addMediaItem,
  createEmptyMediaManifest,
  createMediaAsset,
  describeSource,
  formatBytes,
  isMediaManifest,
  mediaFromLocalFile,
  mediaFromUrl,
  removeMediaItem,
} from './helpers'
