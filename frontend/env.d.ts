/// <reference types="vite/client" />
/// <reference types="vue/macros-global" />

declare module '*.vue' {
  import type { ComponentOptions } from 'vue'
  const component: ComponentOptions
  export default component
}

declare module 'vue' {
  import { DefineComponent } from '@vue/runtime-core'
  global {
    interface ComponentCustomProperties {
      // Add any global properties here if needed
    }
  }
} 