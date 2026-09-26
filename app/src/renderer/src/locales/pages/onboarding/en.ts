export const en = {
  brand: 'Ace Tracker',
  navSetup: 'Setup',
  sidebarIntro:
    'First your app settings, then workspace - afterwards squad and matches.',
  phaseApp: 'App',
  phaseSetup: 'Start',
  stepOf: 'STEP {current} OF {total}',
  continue: 'Continue',
  finish: 'Get started',
  back: 'Back',

  stepLanguageTitle: 'Language',
  stepLanguageDesc: 'App setting - interface language.',
  stepLanguageHeading: 'Pick your language',
  stepLanguageBody:
    'This is an app setting and stays in the application - independent of matches.',
  languageHint: 'Choose the language for the interface.',
  langDe: 'Deutsch',
  langEn: 'English',

  stepThemeTitle: 'Appearance',
  stepThemeDesc: 'App setting - light, dark, or system.',
  stepThemeHeading: 'Choose your appearance',
  stepThemeBody:
    'This applies to the whole app and can be changed anytime from the profile menu.',
  themeHint: 'You can change this setting anytime.',
  themeLight: 'Light',
  themeDark: 'Dark',
  themeSystem: 'System',

  stepNameTitle: 'Profile',
  stepNameDesc: 'App setting - name and photo, local only.',
  stepNameHeading: 'Create your profile',
  stepNameBody:
    'Your profile stays in the app. It is not stored in workspace or match files and never goes to a server.',
  nameLabel: 'Your name',
  namePlaceholder: 'e.g. Paul',
  nameHint: 'How we greet you and show you in the app.',
  nameRequired: 'Please enter a name.',
  avatarLabel: 'Profile photo',
  avatarHint: 'Optional. Stored only in the app.',
  avatarPick: 'Choose photo',
  avatarChange: 'Change photo',
  avatarRemove: 'Remove',
  avatarError: 'Could not load that image. Try a smaller photo.',
  isPlayerLabel: 'I am a player myself',
  isPlayerHint:
    'We can then use your profile later for personal analysis - still only locally in the app.',
  profilePrivacy:
    'App data stays on this device. No cloud, no account, no uploads to servers.',

  stepWorkspaceTitle: 'Workspace',
  stepWorkspaceDesc: 'Your club - with squad and matches.',
  stepWorkspaceHeading: 'Create your first workspace',
  stepWorkspaceBody:
    'A workspace is your club or team. Inside it you maintain the squad and create matches to analyse.',
  workspaceLabel: 'Club name',
  workspacePlaceholder: 'e.g. FC Example',
  workspaceHint: 'You can add more workspaces later from the menu at the top.',
  workspaceRequired: 'Please enter a club name.',

  stepReadyTitle: 'Ready',
  stepReadyDesc: 'Next: Squad → Matches → Analysis.',
  stepReadyHeading: 'Here’s what comes next',
  stepReadyBody:
    'After setup you land in the squad. Then create matches and analyse them - reference squad players in every analysis.',
  readyStep1: '1. Build the squad',
  readyStep1Body: 'Maintain players, numbers and positions once, centrally.',
  readyStep2: '2. Create matches',
  readyStep2Body: 'Each match is an analysis unit with teams and result.',
  readyStep3: '3. Analyse',
  readyStep3Body:
    'In Video Analysis & more you reference squad players - long-term player analysis builds up.',
  pickFolder: 'Choose folder for match files',
  changeFolder: 'Choose another folder',
  folderPicked: 'Selected: {name}',
  folderHint:
    'Optional. Ace Tracker stores match files (.aceproj) here. App and workspace data stay in the app.',
  folderFallback:
    'Folder picking is available in the desktop app. Until then we’ll store matches locally in the app.',
} as const
