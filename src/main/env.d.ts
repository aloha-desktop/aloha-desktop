/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MAIN_VITE_FETCH_MODELS_STATIC: string
  readonly MAIN_VITE_USER_AGENT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
