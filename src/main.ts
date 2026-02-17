import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from '@/router'
import i18n from '@/i18n'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import 'v-network-graph/lib/style.css'
import '@/assets/styles/index.scss'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(ElementPlus)
app.mount('#app')
