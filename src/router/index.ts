import { createRouter, createWebHistory, type Router } from 'vue-router'

import App from '../App.vue'

const routes = [
  { path: '/', component: App },
]

export const router: Router = createRouter({
  history: createWebHistory(),
  routes,
})