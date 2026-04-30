import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

// vite-plugin-node-polyfills is intentionally NOT used. @cyclonedx/sign
// 0.5+ ships first-class crypto backends for both node:crypto and the
// Web Crypto API and selects between them via its `#crypto-backend`
// import condition. Vite does not assert the `node` condition, so the
// resolver lands on the Web Crypto backend automatically and nothing in
// the bundle requires node:crypto / Buffer / process. Keeping the bundle
// free of Node polyfills preserves the "static SPA, no Node shims"
// posture and shaves the bundle.

export default defineConfig({
  build: {
    modulePreload: { polyfill: false },
  },
  plugins: [
    vue(),
    {
      name: 'remove-crossorigin',
      enforce: 'post',
      transformIndexHtml(html) {
        return html.replace(/ crossorigin/g, '')
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  base: process.env.BASE_URL || '/',
  css: {
    preprocessorOptions: {
      scss: {},
    },
  },
})
