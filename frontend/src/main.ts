import { createApp } from 'vue'
// Removed style.css import to avoid conflicts
import './index.css'
import App from './App.vue'
import router from './router'

createApp(App)
  .use(router)
  .mount('#app')
 