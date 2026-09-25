# Ace Tracker

Monorepo for the **Ace Tracker** desktop app and marketing site.

```
ace-tracker/
  app/        Electron desktop application
  landing/    Static download / marketing site
```

## Stack

- **App**: electron-vite, React, Tailwind CSS v4, shadcn/ui
- **Landing**: Vite + React + Tailwind CSS v4
- **Packaging**: electron-builder (Windows NSIS installer + portable standalone)
- **Releases**: GitHub Releases

## Setup

```bash
npm install
```

## Scripts (from repo root)

| Command | Description |
|---|---|
| `npm run dev` | Electron app (HMR) |
| `npm run dev:web` | App renderer in the browser |
| `npm run dev:landing` | Landing page at http://localhost:5174 |
| `npm run build` | Production Electron build → `app/out/` |
| `npm run build:landing` | Production landing build → `landing/dist/` |
| `npm run package:win` | Windows NSIS installer + portable → `app/release/` |
| `npm run release:win` | Build + publish artifacts to GitHub Releases |
| `npm run lint` | Lint the desktop app |

## Windows packaging

`package:win` produces:

- **Installer** — `Ace Tracker-<version>-Setup.exe` (NSIS: custom install dir, desktop + Start Menu shortcuts, Apps & Features uninstaller, brand icons)
- **Standalone** — `Ace Tracker-<version>-Portable.exe` (no install; delete to remove)

Icons: `app/build/icon.png` and `app/build/icon.ico`.

### Publish to GitHub Releases

1. Set the repository URL in [`app/package.json`](app/package.json) (or override `publish` in [`app/electron-builder.yml`](app/electron-builder.yml)).
2. Create a GitHub token with `repo` scope and export it:

```bash
# PowerShell
$env:GH_TOKEN = "ghp_..."
npm run release:win
```

3. The landing page loads the latest release via the GitHub API and links Installer / Standalone assets (names containing `Setup` / `Portable`).

Configure the landing repo slug:

```bash
# landing/.env
VITE_GITHUB_REPO=your-org/ace-tracker
```

See [`landing/.env.example`](landing/.env.example).

## Landing → GitHub Pages (`ace-tracker.de`)

Push to `main` runs [`.github/workflows/pages.yml`](.github/workflows/pages.yml) and deploys `landing/dist`.

Custom domain: **ace-tracker.de** (`landing/public/CNAME`).

DNS at your registrar (remove the domain from any old project first):

| Type | Name | Value |
|------|------|--------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `FlyingV111.github.io` |

Then in the GitHub repo: **Settings → Pages → Custom domain** → `ace-tracker.de` → enable HTTPS.

Local build:

```bash
npm run build:landing
```

## Add UI components (desktop app)

```bash
cd app
npx shadcn@latest add <component>
```
