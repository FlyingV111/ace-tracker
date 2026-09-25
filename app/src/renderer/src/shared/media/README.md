# Media (Videos)

Große Videodateien liegen **nicht** in Ace Tracker und nicht in `.aceproj`.
Im Projekt steht nur eine Liste (`media.json`): Dateiname, Größe, Hash, und wo die Datei liegt.

## Quellen (`MediaSource`)

| type | Bedeutung |
|------|-----------|
| `local` | Pfad auf dem Rechner |
| `url` | Share-/Download-Link (Drive, Strato, …) |
| `cloud` | Datei über einen Connector (`connectorId` + `remoteId`) |

## Neue Quelle hinzufügen

1. Neuen `type` in `types.ts` ergänzen (ein Eintrag im Union).
2. Helper in `helpers.ts` (eine kleine Funktion wie `mediaFromUrl`).
3. Optional: Connector unter `../cloud/connectors/` der die Datei laden kann.

Hash (`contentHash`) kommt später: damit zwei Leute prüfen können, ob sie **dieselbe** Datei haben.
