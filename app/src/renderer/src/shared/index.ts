export type {
  Locale,
  ToolId,
  AppView,
  Workspace,
  WorkspaceSettings,
  Player,
  Team,
  MatchResult,
  LineupSlot,
  ScoreEntry,
  TaggingEvent,
  ProjectDocument,
  CameraTrack,
  SyncAnchor,
  SyncDocument,
  AceProject,
  PlayerTrackerDocument,
  LiveTrackingDocument,
  VideoAnalysisDocument,
  ProjectToolDocuments,
} from './types'
export type {
  UserSettings,
  ThemeMode,
  ResolvedTheme,
} from './settings'
export { fileToAvatarDataUrl } from './settings'
export {
  resolveTheme,
  applyDocumentTheme,
  syncElectronThemePreference,
  isThemeMode,
} from './theme'
export {
  PROJECT_DATE_FORMATS,
  isProjectDateFormat,
  formatProjectDate,
  buildBaseProjectTitle,
  buildProjectTitle,
  previewProjectTitle,
  type ProjectDateFormat,
} from './project-title'
export type {
  CloudConnector,
  CloudConnectorId,
  CloudConnectorStatus,
  HiDriveConfig,
} from './cloud'
export {
  registerCloudConnector,
  listCloudConnectors,
  listCloudProviders,
  getCloudConnector,
  HIDRIVE_CONNECTOR_ID,
  HIDRIVE_WEBDAV_URL,
  DEFAULT_HIDRIVE_CONFIG,
  defaultRootPathForUser,
  normalizeHiDriveShareUrl,
  pathFromHiDriveBrowserUrl,
  parseHiDriveConfig,
  hidriveConnectorFor,
} from './cloud'
// HiDrive network helpers: import from '@/shared/cloud/hidrive-api' (keeps Vite happy)
export type {
  MediaAsset,
  MediaManifest,
  MediaRole,
  MediaSource,
} from './media'
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
} from './media'
export type {
  CollabConnectionState,
  CollabMessage,
  CollabPeer,
  CollabProjectSnapshot,
  CollabSessionInfo,
  CollabTestPing,
} from './collab'
export {
  CollabSession,
  CollabProvider,
  useCollab,
  buildFriendLink,
  createPassphrase,
  createRoomCode,
  parseFriendLink,
  DEFAULT_SIGNALING_URLS,
  DEFAULT_ICE_SERVERS,
} from './collab'
export { createTranslator } from './i18n'
export { createId } from './id'
export { WorkspaceProvider, useWorkspace } from './workspace-context'
export { useToolStore } from './use-tool-store'
export {
  createEmptyProject,
  packAceproj,
  unpackAceproj,
  downloadAceproj,
  toAceprojFileName,
  isToolId,
  createEmptyToolDocuments,
} from './aceproj'
export {
  teamInitial,
  projectLetterMark,
  projectMatchupLabel,
  resultLabelKey,
  winnerTeamName,
  getAceMatchup,
} from './project-display'
