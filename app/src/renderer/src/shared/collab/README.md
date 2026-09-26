# Kollaboration (P2P, kostenlos)

Zwei Leute arbeiten **gleichberechtigt** am offenen Projekt.
Videos bleiben lokal / in der Nutzer-Cloud - die Session synct nur Projektdaten (JSON).

## Kein eigener Server, kein Abo

| Baustein | Dienst | Kosten |
|----------|--------|--------|
| Signaling | `wss://signaling.yjs.dev` | frei |
| STUN/TURN | Google STUN + Open Relay (Metered) | frei (Best-Effort) |
| Projekt-Sync | WebRTC direkt zwischen den Apps | - |

Du musst **nichts hosten und nichts bezahlen**. Match-Inhalt liegt nicht bei Ace Tracker.

Einschränkung: öffentliche Relays sind Community-Dienste (kein SLA). Für Vereins-Alltag reicht das meist; bei Problemen später optional eigener TURN.

## Ablauf

1. Host: Session erstellen → Raumcode + Passwort teilen  
2. Gast: Projekt öffnen → beitreten  
3. Änderungen syncen live  

## Dateien

| Datei | Aufgabe |
|-------|---------|
| `invite.ts` | Raumcode / Friend Link |
| `session.ts` | WebRTC + Yjs |
| `collab-context.tsx` | React + Workspace-Sync |
| `types.ts` | Defaults für Signaling + ICE |
