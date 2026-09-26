import type { CloudConnector, CloudConnectorId } from './types'

const connectors = new Map<CloudConnectorId, CloudConnector>()

export function registerCloudConnector(connector: CloudConnector): void {
  connectors.set(connector.id, connector)
}

export function listCloudConnectors(): CloudConnector[] {
  return [...connectors.values()]
}

export function getCloudConnector(
  id: CloudConnectorId,
): CloudConnector | undefined {
  return connectors.get(id)
}

export function listCloudProviders(): CloudConnector[] {
  return listCloudConnectors().filter(
    (c) =>
      c.id === 'hidrive' ||
      c.brand === 'link' ||
      c.brand === 'webdav' ||
      c.brand === 'onedrive' ||
      c.brand === 'google' ||
      c.brand === 'dropbox' ||
      c.brand === 'other',
  )
}
