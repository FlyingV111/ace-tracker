/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GITHUB_REPO?: string
  readonly VITE_BASE?: string
  readonly VITE_COFFEE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
