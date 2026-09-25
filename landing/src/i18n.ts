export type Locale = 'de' | 'en'

export const copy = {
  de: {
    langToggle: 'EN',
    brand: 'Ace Tracker',
    headline: 'Bereit fürs nächste Spiel?',
    support:
      'Desktop-Workspace für Kader, Live-Events und Video-Marker — installieren, offline arbeiten.',
    ctaInstaller: 'Installer herunterladen',
    ctaPortable: 'Standalone',
    ctaReleases: 'Alle Releases',
    loading: 'Lade aktuelle Version…',
    unavailable: 'Noch kein Release verfügbar',
    versionLabel: 'Version',
    sizeLabel: 'Größe',
    offlineNote: 'Nach dem Download läuft Ace Tracker vollständig offline.',
    aboutTitle: 'Ein Workspace. Alles fürs Match.',
    aboutBody:
      'Plane den Kader, tracke Events live und markiere Clips — lokal auf deinem Rechner, ohne Browser-Tab-Chaos.',
    toolsTitle: 'Drei Werkzeuge. Ein Flow.',
    tools: [
      {
        title: 'Player Tracker',
        body: 'Kader verwalten, Spieler tracken und Aufstellungen pflegen.',
      },
      {
        title: 'Live Game Tracking',
        body: 'Events während des Spiels erfassen — klar und ohne Ablenkung.',
      },
      {
        title: 'Video Analysis',
        body: 'Clips und Marker für die Nachbereitung setzen.',
      },
    ],
    downloadTitle: 'Download für Windows',
    downloadBody:
      'Installer richtet Startmenü und Deinstallation ein. Standalone startet ohne Installation.',
    installerTitle: 'Installer',
    installerBody: 'NSIS-Setup mit Desktop-Verknüpfung und Uninstaller.',
    portableTitle: 'Standalone',
    portableBody: 'Portable EXE — entpacken und starten.',
    footerNote: 'Ace Tracker · Desktop für Analyse und Matchday',
  },
  en: {
    langToggle: 'DE',
    brand: 'Ace Tracker',
    headline: 'Ready for the next match?',
    support:
      'Desktop workspace for squad, live events, and video markers — install once, work offline.',
    ctaInstaller: 'Download installer',
    ctaPortable: 'Standalone',
    ctaReleases: 'All releases',
    loading: 'Loading latest version…',
    unavailable: 'No release available yet',
    versionLabel: 'Version',
    sizeLabel: 'Size',
    offlineNote: 'After download, Ace Tracker runs fully offline.',
    aboutTitle: 'One workspace. Built for matchday.',
    aboutBody:
      'Plan the squad, track live events, and mark clips — locally on your machine, without browser-tab chaos.',
    toolsTitle: 'Three tools. One flow.',
    tools: [
      {
        title: 'Player Tracker',
        body: 'Manage the squad, track players, and maintain lineups.',
      },
      {
        title: 'Live Game Tracking',
        body: 'Capture in-game events — clear and distraction-free.',
      },
      {
        title: 'Video Analysis',
        body: 'Set clips and markers for review.',
      },
    ],
    downloadTitle: 'Download for Windows',
    downloadBody:
      'Installer sets up Start Menu and uninstall. Standalone runs without installation.',
    installerTitle: 'Installer',
    installerBody: 'NSIS setup with desktop shortcut and uninstaller.',
    portableTitle: 'Standalone',
    portableBody: 'Portable EXE — download and run.',
    footerNote: 'Ace Tracker · Desktop for analysis and matchday',
  },
} as const

export type Copy = (typeof copy)[Locale]
