import { createMemoryHistory, createRouter } from 'vue-router'

import Setup from '@renderer/views/Setup.vue'
import Home from '@renderer/views/Home.vue'
import Chats from '@renderer/views/Chats.vue'
import ChatList from '@renderer/views/ChatList.vue'
import ChatThread from '@renderer/views/ChatThread.vue'
import Settings from '@renderer/views/Settings.vue'
import Plugins from '@renderer/views/Plugins.vue'
import ConfigureAI from '@renderer/views/ConfigureAI.vue'
import InstallAI from '@renderer/views/InstallAI.vue'
import AIModelSettings from '@renderer/views/settings/AIModelSettings.vue'
import AIEngineSettings from '@renderer/views/settings/AIEngineSettings.vue'
import AIModelPullSettings from '@renderer/views/settings/AIModelPullSettings.vue'
import About from '@renderer/views/settings/About.vue'

const routes = [
  { path: '/', redirect: '/setup' },
  {
    path: '/home',
    component: Home,
  },
  {
    path: '/chats',
    component: Chats,
    children: [
      {
        path: '',
        components: { left: ChatList, right: ChatThread },
      },
      {
        path: 'thread/:uuid',
        name: 'chat-thread',
        components: { left: ChatList, right: ChatThread },
      },
    ],
  },
  {
    path: '/settings',
    component: Settings,
    children: [
      { path: '', redirect: '/settings/ai-model' },
      { path: 'ai-model', component: AIModelSettings },
      { path: 'ai-engine', component: AIEngineSettings },
      { path: 'ai-model-pull', component: AIModelPullSettings },
      { path: 'about', component: About },
    ],
  },
  { path: '/plugins', component: Plugins },
  { path: '/setup', component: Setup },
  { path: '/configure-ai', component: ConfigureAI },
  { path: '/install-ai', component: InstallAI },
]

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
})
