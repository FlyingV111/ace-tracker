export const en = {
  brand: 'Ace Tracker',
  navSetup: 'Setup',
  sidebarIntro:
    'First your app settings, then workspace and first project.',
  phaseApp: 'App',
  phaseSetup: 'Start',
  stepOf: 'STEP {current} OF {total}',
  continue: 'Continue',
  finish: 'Finish',
  back: 'Back',

  stepLanguageTitle: 'Language',
  stepLanguageDesc: 'App setting – interface language.',
  stepLanguageHeading: 'Pick your language',
  stepLanguageBody:
    'This is an app setting and stays in the application – independent of projects.',
  languageHint: 'Choose the language for the interface.',
  langDe: 'Deutsch',
  langEn: 'English',

  stepThemeTitle: 'Appearance',
  stepThemeDesc: 'App setting – light, dark, or system.',
  stepThemeHeading: 'Choose your appearance',
  stepThemeBody:
    'This applies to the whole app and can be changed anytime from the profile menu.',
  themeHint: 'You can change this setting anytime.',
  themeLight: 'Light',
  themeDark: 'Dark',
  themeSystem: 'System',

  stepNameTitle: 'Profile',
  stepNameDesc: 'App setting – name and photo, local only.',
  stepNameHeading: 'Create your profile',
  stepNameBody:
    'Your profile stays in the app. It is not stored in workspace or project files and never goes to a server.',
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
    'We can then use your profile later for personal analysis – still only locally in the app.',
  profilePrivacy:
    'App data stays on this device. No cloud, no account, no uploads to servers.',

  stepWorkspaceTitle: 'Workspace',
  stepWorkspaceDesc: 'Your first club or organisation.',
  stepWorkspaceHeading: 'Create your first workspace',
  stepWorkspaceBody:
    'A workspace groups the projects of one club. Workspace data is stored locally in the app – not in the project folder.',
  workspaceLabel: 'Club name',
  workspacePlaceholder: 'e.g. FC Example',
  workspaceHint: 'You can add more workspaces later from the menu at the top.',
  workspaceRequired: 'Please enter a club name.',

  stepProjectTitle: 'First project',
  stepProjectDesc: 'Create a match and choose the project folder.',
  stepProjectHeading: 'Create your first project',
  stepProjectBody:
    'Here you choose where Ace Tracker stores project files. App and workspace data stay in the app; project files go into this folder.',
  homeTeam: 'Home team',
  awayTeam: 'Away team',
  homeTeamPlaceholder: 'e.g. Home FC',
  awayTeamPlaceholder: 'e.g. 1. FC Nuremberg',
  projectNameOptional: 'Title (optional)',
  projectNamePlaceholder: 'Generated from the teams if empty',
  projectTitleIncludeDate: 'Add date to title automatically',
  projectTitleDateFormat: 'Date format',
  projectTitlePreview: 'Preview',
  projectTeamsRequired: 'Please enter both teams.',
  pickFolder: 'Choose project folder',
  changeFolder: 'Choose another folder',
  folderPicked: 'Selected: {name}',
  folderHint:
    'This folder is for your project files – this project and future ones. Ace Tracker handles format and structure.',
  folderRequired: 'Please choose a folder for project files.',
  folderFallback:
    'Folder picking is available in the desktop app. Until then we’ll store projects locally in the app.',
} as const
