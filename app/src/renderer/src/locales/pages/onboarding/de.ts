export const de = {
  brand: 'Ace Tracker',
  navSetup: 'Einrichtung',
  sidebarIntro:
    'Zuerst deine App-Einstellungen, dann Workspace - danach Kader und Spiele.',
  phaseApp: 'App',
  phaseSetup: 'Start',
  stepOf: 'SCHRITT {current} VON {total}',
  continue: 'Weiter',
  finish: 'Loslegen',
  back: 'Zurück',

  stepLanguageTitle: 'Sprache',
  stepLanguageDesc: 'App-Einstellung - Sprache der Oberfläche.',
  stepLanguageHeading: 'Wähle deine Sprache',
  stepLanguageBody:
    'Das gehört zu den App-Einstellungen und bleibt in der Anwendung - unabhängig von Spielen.',
  languageHint: 'Wähle die Sprache für die Oberfläche.',
  langDe: 'Deutsch',
  langEn: 'English',

  stepThemeTitle: 'Darstellung',
  stepThemeDesc: 'App-Einstellung - Hell, Dunkel oder System.',
  stepThemeHeading: 'Wähle die Darstellung',
  stepThemeBody:
    'Die Darstellung gilt für die gesamte App und lässt sich später jederzeit im Profilmenü ändern.',
  themeHint: 'Du kannst die Einstellung jederzeit ändern.',
  themeLight: 'Hell',
  themeDark: 'Dunkel',
  themeSystem: 'System',

  stepNameTitle: 'Profil',
  stepNameDesc: 'App-Einstellung - Name und Foto, nur lokal.',
  stepNameHeading: 'Erstelle dein Profil',
  stepNameBody:
    'Dein Profil bleibt in der App. Es geht nicht in Workspace- oder Spieldateien und nicht auf einen Server.',
  nameLabel: 'Dein Name',
  namePlaceholder: 'z.B. Max',
  nameHint: 'So begrüßen wir dich und zeigen dich in der App.',
  nameRequired: 'Bitte einen Namen eingeben.',
  avatarLabel: 'Profilbild',
  avatarHint: 'Optional. Wird nur in der App gespeichert.',
  avatarPick: 'Bild wählen',
  avatarChange: 'Bild ändern',
  avatarRemove: 'Entfernen',
  avatarError:
    'Bild konnte nicht geladen werden. Bitte ein kleineres Foto versuchen.',
  isPlayerLabel: 'Ich bin selbst Spieler',
  isPlayerHint:
    'Dann können wir dein Profil später für persönliche Analysen nutzen - weiterhin nur lokal in der App.',
  profilePrivacy:
    'App-Daten bleiben auf diesem Gerät. Keine Cloud, kein Account, kein Upload an Server.',

  stepWorkspaceTitle: 'Workspace',
  stepWorkspaceDesc: 'Dein Verein - mit Kader und Spielen.',
  stepWorkspaceHeading: 'Erstelle deinen ersten Workspace',
  stepWorkspaceBody:
    'Ein Workspace ist dein Verein oder Team. Darin pflegst du den Kader und legst Spiele an, die du analysierst.',
  workspaceLabel: 'Name des Vereins',
  workspacePlaceholder: 'z.B. FC Musterstadt',
  workspaceHint:
    'Du kannst später weitere Workspaces über das Menü oben anlegen.',
  workspaceRequired: 'Bitte einen Vereinsnamen eingeben.',

  stepReadyTitle: 'Bereit',
  stepReadyDesc: 'Als Nächstes: Kader → Spiele → Analyse.',
  stepReadyHeading: 'So geht’s weiter',
  stepReadyBody:
    'Nach dem Setup startest du im Kader. Dann legst du Spiele an und analysierst sie - Spieler aus dem Kader kannst du in jeder Analyse referenzieren.',
  readyStep1: '1. Kader anlegen',
  readyStep1Body: 'Spieler, Nummern und Positionen einmal zentral pflegen.',
  readyStep2: '2. Spiele erstellen',
  readyStep2Body: 'Jedes Spiel ist eine Analyse-Einheit mit Teams und Ergebnis.',
  readyStep3: '3. Analysieren',
  readyStep3Body:
    'In Video Analysis & Co. referenzierst du Kader-Spieler - so entsteht langfristige Spieleranalyse.',
  pickFolder: 'Ordner für Spieldateien wählen',
  changeFolder: 'Anderen Ordner wählen',
  folderPicked: 'Gewählt: {name}',
  folderHint:
    'Optional. Hier speichert Ace Tracker Spieldateien (.aceproj). App- und Workspace-Daten bleiben in der App.',
  folderFallback:
    'Ordnerwahl steht in der Desktop-App zur Verfügung. Bis dahin speichern wir Spiele lokal in der App.',
} as const
