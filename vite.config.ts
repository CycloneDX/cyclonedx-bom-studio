import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

// CSP header for production builds (served by static file servers or reverse proxies)
const cspPolicy = [
  "default-src 'self'",
  "script-src 'self' https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://cloudflareinsights.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

export default defineConfig({
  build: {
    // Disable crossorigin attribute on script/link tags to avoid CORS
    // issues when served from static hosts without CORS headers
    modulePreload: { polyfill: false },
  },
  plugins: [
    vue(),
    // Strip crossorigin attributes that conflict with CSP 'self' on static hosts
    {
      name: 'remove-crossorigin',
      transformIndexHtml(html) {
        return html.replace(/ crossorigin/g, '')
      },
    },
    // Inject CSP meta tag only in production builds
    {
      name: 'inject-csp',
      transformIndexHtml(html, ctx) {
        if (ctx.bundle) {
          // Production build — inject CSP meta tag
          return html.replace(
            '<meta charset="UTF-8" />',
            `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${cspPolicy}" />`
          )
        }
        return html
      }
    }
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
