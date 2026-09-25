import { registerCloudConnector } from './registry'
import { linkConnector } from './connectors/link'
import { hidriveConnectorBase } from './connectors/hidrive'
import { webdavConnector } from './connectors/webdav'
import { oneDriveConnector } from './connectors/onedrive'
import { googleDriveConnector } from './connectors/googledrive'
import { dropboxConnector } from './connectors/dropbox'

// Order = order in Settings UI. Add new providers here (one line).
registerCloudConnector(hidriveConnectorBase)
registerCloudConnector(linkConnector)
registerCloudConnector(webdavConnector)
registerCloudConnector(googleDriveConnector)
registerCloudConnector(oneDriveConnector)
registerCloudConnector(dropboxConnector)

export type {
  CloudConnector,
  CloudConnectorId,
  CloudConnectorStatus,
} from './types'
export {
  registerCloudConnector,
  listCloudConnectors,
  listCloudProviders,
  getCloudConnector,
} from './registry'
export {
  DEFAULT_HIDRIVE_CONFIG,
  HIDRIVE_CONNECTOR_ID,
  HIDRIVE_WEBDAV_URL,
  defaultRootPathForUser,
  normalizeHiDriveShareUrl,
  parseHiDriveConfig,
  pathFromHiDriveBrowserUrl,
  type HiDriveConfig,
} from './hidrive-config'
export { hidriveConnectorFor } from './connectors/hidrive'
export {
  downloadHiDriveFile,
  listHiDriveFolder,
  mediaFromHiDriveFile,
  probeHiDrive,
  type HiDriveRemoteEntry,
} from './hidrive-api'
