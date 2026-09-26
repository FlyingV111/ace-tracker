# Cloud-Connectoren (Bring your own storage)

Ace Tracker speichert **keine** Videos. Nutzer hängen ihren eigenen Speicher an.

## HiDrive (Strato) - fertig nutzbar

1. Einstellungen → HiDrive: Benutzername + Passwort
2. Startordner z.B. `/users/deinname/…` (oder Browser-URL mit `#$/users/…` einfügen)
3. Optional Share: `https://my.hidrive.com/share/…`
4. **Verbinden & testen**
5. Video Analysis → **Aus HiDrive** → Datei anklicken

Technik: WebDAV `https://webdav.hidrive.strato.com` (Main-Prozess, kein CORS-Problem).

## Neuen Anbieter hinzufügen

1. `connectors/_template.ts` kopieren
2. In `index.ts` registrieren
3. Optional: ähnlich wie `hidrive-api.ts` + IPC im Main-Prozess

| id | Status |
|----|--------|
| `hidrive` | **verbunden möglich** (WebDAV) |
| `link` | Share-URL ins Projekt |
| `webdav` | generisch, coming-soon |
| `google-drive` / `onedrive` / `dropbox` | coming-soon |
