# Ace Tracker

Desktop-Workspace für Volleyball-Scouting und Match-Analyse - **local-first**, offline, ohne Cloud-Zwang und ohne Abo.

Website: [ace-tracker.de](https://ace-tracker.de) · Downloads: [GitHub Releases](https://github.com/FlyingV111/ace-tracker/releases)

## Features

- **Player Tracker** - Kader, Aufstellungen und Spielerdaten pflegen
- **Live Game Tracking** - Events am Spielfeldrand erfassen
- **Video Analysis** - Clips und Marker setzen (Videos bleiben lokal bzw. in deiner Cloud)
- **Peer-to-Peer Kollaboration** - Session per Raumcode / Friend Link; Projektdaten syncen per WebRTC, ohne Ace-Tracker-Server
- **Bring your own storage** - HiDrive (Strato) über WebDAV; weitere Anbieter geplant

Match-Inhalte und Videos liegen bei dir. Signaling/STUN/TURN laufen über freie öffentliche Dienste (Handshake only).

## Download

Unter Windows gibt es zwei Bauarten:

| Artefakt | Beschreibung |
|----------|----------------|
| **Setup** | NSIS-Installer mit Startmenü, Desktop-Verknüpfung und Deinstallation |
| **Portable** | Einzelne EXE - starten ohne Installation |

Aktuelle Builds erscheinen auf [ace-tracker.de](https://ace-tracker.de) und in den [Releases](https://github.com/FlyingV111/ace-tracker/releases), sobald ein Release veröffentlicht ist.

## Repository

```
ace-tracker/
  app/        Electron-Desktop-App (React, Tailwind, shadcn/ui)
  landing/    Marketing- & Download-Seite (Vite + React)
```

## Entwicklung

Voraussetzungen: **Node.js 22+**, npm.

```bash
npm install
npm run dev          # Electron-App mit HMR
npm run dev:web      # Renderer im Browser
npm run dev:landing  # Landing unter http://localhost:5174
```

| Befehl | Zweck |
|--------|--------|
| `npm run build` | Electron-Produktionsbuild → `app/out/` |
| `npm run build:landing` | Landing → `landing/dist/` |
| `npm run package:win` | Windows Setup + Portable → `app/release/` |
| `npm run typecheck` | TypeScript prüfen |
| `npm run lint` | Lint der Desktop-App |

### Release (Windows → GitHub)

1. Repo-URL in [`app/package.json`](app/package.json) bzw. Publish-Config in [`app/electron-builder.yml`](app/electron-builder.yml)
2. Token mit `repo`-Scope setzen und publishen:

```powershell
$env:GH_TOKEN = "ghp_..."
npm run release:win
```

Die Landing lädt das neueste Release über die GitHub API (`VITE_GITHUB_REPO`, siehe [`landing/.env.example`](landing/.env.example)).

### Landing / GitHub Pages

Push auf `main` (Pfad `landing/**`) deployed die Seite via [`.github/workflows/pages.yml`](.github/workflows/pages.yml) auf **ace-tracker.de**.

## Mitmachen

Issues und Pull Requests sind willkommen. Für UI-Komponenten in der App:

```bash
cd app
npx shadcn@latest add <component>
```

Weitere Hinweise liegen in den Modul-READMEs unter `app/src/renderer/src/shared/` (`collab/`, `cloud/`, `media/`).

## Lizenz

Open Source - Nutzung und Weiterentwicklung im Sinne eines lokalen, datensparsamen Tools für Teams und Trainer.
