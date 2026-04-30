/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Must be a module file for vue-i18n augmentation to work properly
export {}

declare module 'vue-i18n' {
  export interface DefineLocaleMessage {
    [key: string]: any
  }
}

// Vite `define` substitutions. __APP_VERSION__ is the value of `version`
// from package.json, injected at build time by vite.config.ts. Both the
// UI (TopBar / AboutDialog) and the BOM Studio tool component the
// bomStore writes into newly created BOMs read this constant so the
// version on screen and the version in the JSON cannot drift.
declare global {
  const __APP_VERSION__: string
}
