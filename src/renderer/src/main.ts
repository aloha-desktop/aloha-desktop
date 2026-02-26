import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { router } from './lib/router'
import { electron } from './lib/electron'
import { pinia } from './lib/pinia'

createApp(App).use(router).use(electron).use(pinia).mount('#app')
