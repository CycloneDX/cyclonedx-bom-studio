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
