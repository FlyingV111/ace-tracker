export const de = {
  brand: 'Ace Tracker',
  navSetup: 'Einrichtung',
  sidebarIntro:
    'Zuerst deine App-Einstellungen, dann Workspace und erstes Projekt.',
  phaseApp: 'App',
  phaseSetup: 'Start',
  stepOf: 'SCHRITT {current} VON {total}',
  continue: 'Weiter',
  finish: 'Abschließen',
  back: 'Zurück',

  stepLanguageTitle: 'Sprache',
  stepLanguageDesc: 'App-Einstellung – Sprache der Oberfläche.',
  stepLanguageHeading: 'Wähle deine Sprache',
  stepLanguageBody:
    'Das gehört zu den App-Einstellungen und bleibt in der Anwendung – unabhängig von Projekten.',
  languageHint: 'Wähle die Sprache für die Oberfläche.',
  langDe: 'Deutsch',
  langEn: 'English',

  stepThemeTitle: 'Darstellung',
  stepThemeDesc: 'App-Einstellung – Hell, Dunkel oder System.',
  stepThemeHeading: 'Wähle die Darstellung',
  stepThemeBody:
    'Die Darstellung gilt für die gesamte App und lässt sich später jederzeit im Profilmenü ändern.',
  themeHint: 'Du kannst die Einstellung jederzeit ändern.',
  themeLight: 'Hell',
  themeDark: 'Dunkel',
  themeSystem: 'System',

  stepNameTitle: 'Profil',
  stepNameDesc: 'App-Einstellung – Name und Foto, nur lokal.',
  stepNameHeading: 'Erstelle dein Profil',
  stepNameBody:
    'Dein Profil bleibt in der App. Es geht nicht in Workspace- oder Projektdateien und nicht auf einen Server.',
  nameLabel: 'Dein Name',
  namePlaceholder: 'z.B. Max',
  nameHint: 'So begrüßen wir dich und zeigen dich in der App.',
  nameRequired: 'Bitte einen Namen eingeben.',
  avatarLabel: 'Profilbild',
  avatarHint: 'Optional. Wird nur in der App gespeichert.',
  avatarPick: 'Bild wählen',
  avatarChange: 'Bild ändern',
  avatarRemove: 'Entfernen',
  avatarError: 'Bild konnte nicht geladen werden. Bitte ein kleineres Foto versuchen.',
  isPlayerLabel: 'Ich bin selbst Spieler',
  isPlayerHint:
    'Dann können wir dein Profil später für persönliche Analysen nutzen – weiterhin nur lokal in der App.',
  profilePrivacy:
    'App-Daten bleiben auf diesem Gerät. Keine Cloud, kein Account, kein Upload an Server.',

  stepWorkspaceTitle: 'Workspace',
  stepWorkspaceDesc: 'Dein erster Verein oder deine Organisation.',
  stepWorkspaceHeading: 'Erstelle deinen ersten Workspace',
  stepWorkspaceBody:
    'Ein Workspace bündelt die Projekte eines Vereins. Workspace-Daten speichert die App lokal (App-Daten) – nicht im Projektordner.',
  workspaceLabel: 'Name des Vereins',
  workspacePlaceholder: 'z.B. FC Musterstadt',
  workspaceHint: 'Du kannst später weitere Workspaces über das Menü oben anlegen.',
  workspaceRequired: 'Bitte einen Vereinsnamen eingeben.',

  stepProjectTitle: 'Erstes Projekt',
  stepProjectDesc: 'Spiel anlegen und Ordner für Projektdateien wählen.',
  stepProjectHeading: 'Lege dein erstes Projekt an',
  stepProjectBody:
    'Hier bestimmst du, wohin Ace Tracker deine Projektdateien speichert. App- und Workspace-Daten bleiben in der App; Projektdateien landen in diesem Ordner.',
  homeTeam: 'Heimmannschaft',
  awayTeam: 'Gastmannschaft',
  homeTeamPlaceholder: 'z.B. FC Heim',
  awayTeamPlaceholder: 'z.B. 1. FC Nürnberg',
  projectNameOptional: 'Titel (optional)',
  projectNamePlaceholder: 'Wird automatisch aus den Teams erzeugt',
  projectTitleIncludeDate: 'Datum automatisch im Titel',
  projectTitleDateFormat: 'Datumsformat',
  projectTitlePreview: 'Vorschau',
  projectTeamsRequired: 'Bitte beide Mannschaften angeben.',
  pickFolder: 'Projektordner wählen',
  changeFolder: 'Anderen Ordner wählen',
  folderPicked: 'Gewählt: {name}',
  folderHint:
    'Dieser Ordner gilt für deine Projektdateien – also für dieses und weitere Projekte. Format und Struktur übernimmt Ace Tracker.',
  folderRequired: 'Bitte einen Ordner für Projektdateien wählen.',
  folderFallback:
    'Ordnerwahl steht in der Desktop-App zur Verfügung. Bis dahin speichern wir Projekte lokal in der App.',
} as const
