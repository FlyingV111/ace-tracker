export type Locale = 'de' | 'en'

export const copy = {
  de: {
    langToggle: 'EN',
    brand: 'Ace Tracker',
    nav: {
      features: 'Features',
      workflow: 'Workflow',
      faq: 'FAQ',
      github: 'GitHub',
      download: 'Download',
    },
    hero: {
      eyebrow: 'Open Source · Local-First · Volleyball',
      headline: 'Scouting in Spielgeschwindigkeit.',
      headlineAccent: 'Keyboard-first. Komplett offline.',
      support:
        'Videos analysieren, Events tracken, Stats auswerten - direkt am Spielfeldrand. Ohne Cloud-Zwang, ohne Abo, mit voller Kontrolle über deine Daten.',
      ctaPrimary: 'Desktop herunterladen',
      ctaSecondary: 'Standalone (.exe)',
      trust: ['Keine Registrierung', 'Daten bleiben lokal', 'MIT-Lizenz'],
      loading: 'Lade aktuelle Version…',
      unavailable: 'Noch kein Release verfügbar',
      versionLabel: 'Version',
      allReleases: 'Alle Releases',
    },
    features: {
      title: 'Eine Workstation. Kein Tab-Chaos.',
      body: 'Alles für Matchday und Analyse - schnell, lokal und klar aufgebaut.',
      items: [
        {
          title: 'Keyboard-first',
          body: 'Tippen, ohne hinzuschauen. Shortcuts für jeden Ballkontakt - gebaut für Tempo am Spielfeldrand.',
        },
        {
          title: 'Local-first & Multi-Cam',
          body: 'Projekte und Videos bleiben auf deinem Rechner. Mehrere Kameras synchron, ohne Upload.',
        },
        {
          title: 'Gemeinsam scouting',
          body: 'Per Friend Link mit Co-Trainern arbeiten. Peer-to-peer, ohne Cloud-Konto und ohne Abo.',
        },
      ],
    },
    workflow: {
      title: 'Vier Phasen. Ein Flow.',
      body: 'Vom Anlegen bis zur Datei - alles in einer App, ohne Medienbruch.',
      phases: [
        {
          id: 'wizard',
          label: 'Match-Wizard',
          title: 'Match anlegen',
          description:
            'Gegner, Kader und Setup in wenigen Schritten. Danach bist du bereit fürs Live-Tracking.',
          points: [
            'Spiel und Teams klar strukturiert',
            'Aufstellungen vorbereiten',
            'Direkt in die Workstation starten',
          ],
        },
        {
          id: 'live',
          label: 'Live Workstation',
          title: 'Live erfassen',
          description:
            'Ballkontakte, Rallys und Marker in Matchgeschwindigkeit - Video und Court im Blick, Hände auf der Tastatur.',
          points: [
            'Keyboard-first Eingabe',
            'Video und Court Seite an Seite',
            'Sofort nutzbare Timeline',
          ],
        },
        {
          id: 'stats',
          label: 'Stats & Analytics',
          title: 'Muster sehen',
          description:
            'Aus den Events werden klare Zahlen und Trends - für die Pause, die Nachbereitung und die nächste Rotation.',
          points: [
            'Schnelle Übersicht nach dem Satz',
            'Clips und Marker fürs Review',
            'Fokus auf Entscheidungen, nicht auf Tabellenchaos',
          ],
        },
        {
          id: 'project',
          label: 'Project File',
          title: 'Eine Datei. Alles drin.',
          description:
            'Dein Projekt als kompakte .aceproj - teilen per USB, Mail oder Drive. Videos bleiben wo sie sind.',
          points: [
            'Kompletter Container für Match-Daten',
            'Teilen ohne Cloud-Konto',
            'Öffnen und weiterarbeiten - fertig',
          ],
        },
      ],
    },
    support: {
      eyebrow: 'Open Source',
      title: 'Von Volleyballern für Volleyballer.',
      body: 'Ace Tracker ist kostenlos, werbefrei und MIT-lizenziert. Wenn dir das Tool hilft, freuen wir uns über einen Stern auf GitHub.',
      bodyWithCoffee:
        'Ace Tracker ist kostenlos, werbefrei und MIT-lizenziert. Wenn dir das Tool hilft, freuen wir uns über einen Stern auf GitHub - oder einen Kaffee.',
      ctaGithub: 'Auf GitHub Stern geben',
      ctaCoffee: 'Buy Me a Coffee',
    },
    faq: {
      title: 'Häufige Fragen',
      items: [
        {
          q: 'Muss ich meine Videos irgendwo hochladen?',
          a: 'Nein. Videos bleiben lokal auf deinem Rechner (oder in deiner eigenen Cloud). Ace Tracker speichert nur Verweise und Projektdaten - nicht die Rohdateien.',
        },
        {
          q: 'Brauche ich ein Benutzerkonto?',
          a: 'Nein. Keine Registrierung, kein Login, kein Abo. Installieren oder starten und direkt arbeiten.',
        },
        {
          q: 'Wie teile ich ein Projekt mit Co-Trainern?',
          a: 'Entweder die .aceproj-Datei schicken - oder live per Friend Link zusammen scouting. Die Session synct Projektdaten peer-to-peer, ohne dass Videos hochgeladen werden.',
        },
      ],
    },
    download: {
      title: 'Download für Windows',
      body: 'Installer richtet Startmenü und Deinstallation ein. Standalone startet ohne Installation.',
      installerTitle: 'Installer',
      installerBody: 'NSIS-Setup mit Desktop-Verknüpfung und Uninstaller.',
      portableTitle: 'Standalone',
      portableBody: 'Portable EXE - entpacken und starten.',
    },
    footer: {
      tagline: 'Keyboard-first. Local-first. Offline.',
      github: 'GitHub',
      license: 'Lizenz (MIT)',
      releases: 'Releases',
      offlineBadge: '100% offline - keine Cloud nötig',
      copyright: 'Ace Tracker · MIT-Lizenz',
    },
  },
  en: {
    langToggle: 'DE',
    brand: 'Ace Tracker',
    nav: {
      features: 'Features',
      workflow: 'Workflow',
      faq: 'FAQ',
      github: 'GitHub',
      download: 'Download',
    },
    hero: {
      eyebrow: 'Open Source · Local-First · Volleyball',
      headline: 'Scouting at match speed.',
      headlineAccent: 'Keyboard-first. Fully offline.',
      support:
        'Analyze video, track events, and read the stats - right by the court. No cloud lock-in, no subscription, full control of your data.',
      ctaPrimary: 'Download for desktop',
      ctaSecondary: 'Standalone (.exe)',
      trust: ['No sign-up', 'Data stays local', 'MIT license'],
      loading: 'Loading latest version…',
      unavailable: 'No release available yet',
      versionLabel: 'Version',
      allReleases: 'All releases',
    },
    features: {
      title: 'One workstation. No tab chaos.',
      body: 'Everything for matchday and review - fast, local, and clear.',
      items: [
        {
          title: 'Keyboard-first',
          body: 'Type without looking. Shortcuts for every contact - built for pace at court side.',
        },
        {
          title: 'Local-first & multi-cam',
          body: 'Projects and video stay on your machine. Sync multiple cameras without uploading.',
        },
        {
          title: 'Scout together',
          body: 'Work with co-coaches via Friend Link. Peer-to-peer, no cloud account, no subscription.',
        },
      ],
    },
    workflow: {
      title: 'Four phases. One flow.',
      body: 'From setup to file - one app, no context switching.',
      phases: [
        {
          id: 'wizard',
          label: 'Match Wizard',
          title: 'Set up the match',
          description:
            'Opponent, roster, and setup in a few steps. Then you are ready for live tracking.',
          points: [
            'Clear structure for teams and match',
            'Prepare lineups',
            'Jump straight into the workstation',
          ],
        },
        {
          id: 'live',
          label: 'Live Workstation',
          title: 'Capture live',
          description:
            'Contacts, rallies, and markers at match speed - video and court in view, hands on the keyboard.',
          points: [
            'Keyboard-first input',
            'Video and court side by side',
            'A timeline you can use immediately',
          ],
        },
        {
          id: 'stats',
          label: 'Stats & Analytics',
          title: 'See the patterns',
          description:
            'Events become clear numbers and trends - for timeouts, review, and the next rotation.',
          points: [
            'Quick overview after a set',
            'Clips and markers for review',
            'Focus on decisions, not spreadsheet noise',
          ],
        },
        {
          id: 'project',
          label: 'Project File',
          title: 'One file. Everything in it.',
          description:
            'Your project as a compact .aceproj - share via USB, mail, or drive. Video stays where it is.',
          points: [
            'Complete container for match data',
            'Share without a cloud account',
            'Open and keep working - done',
          ],
        },
      ],
    },
    support: {
      eyebrow: 'Open Source',
      title: 'Built by volleyball people, for volleyball people.',
      body: 'Ace Tracker is free, ad-free, and MIT-licensed. If it helps you, a GitHub star means a lot.',
      bodyWithCoffee:
        'Ace Tracker is free, ad-free, and MIT-licensed. If it helps you, a GitHub star means a lot - or a coffee.',
      ctaGithub: 'Star on GitHub',
      ctaCoffee: 'Buy Me a Coffee',
    },
    faq: {
      title: 'FAQ',
      items: [
        {
          q: 'Do I have to upload my videos somewhere?',
          a: 'No. Videos stay on your machine (or in your own cloud). Ace Tracker stores references and project data - not the raw files.',
        },
        {
          q: 'Do I need an account?',
          a: 'No. No sign-up, no login, no subscription. Install or launch and start working.',
        },
        {
          q: 'How do I share a project with co-coaches?',
          a: 'Send the .aceproj file - or scout live together via Friend Link. The session syncs project data peer-to-peer without uploading videos.',
        },
      ],
    },
    download: {
      title: 'Download for Windows',
      body: 'Installer sets up Start Menu and uninstall. Standalone runs without installation.',
      installerTitle: 'Installer',
      installerBody: 'NSIS setup with desktop shortcut and uninstaller.',
      portableTitle: 'Standalone',
      portableBody: 'Portable EXE - download and run.',
    },
    footer: {
      tagline: 'Keyboard-first. Local-first. Offline.',
      github: 'GitHub',
      license: 'License (MIT)',
      releases: 'Releases',
      offlineBadge: '100% offline - no cloud required',
      copyright: 'Ace Tracker · MIT license',
    },
  },
} as const

export type Copy = (typeof copy)[Locale]
