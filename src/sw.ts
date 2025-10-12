/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

// Required for VitePWA injectManifest
precacheAndRoute(self.__WB_MANIFEST)

// A simple service worker for caching (optional but good practice)
const CACHE_NAME = 'latsar-code'
const urlsToCache = [
  '/',
  '/icon-192x192.png',
]

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache)
      })
  )
})

self.addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request)
      })
  )
})

// The Push Notification Handler
// This is the CRUCIAL part for native notifications.
// This event is triggered by a message sent from a server (like Firebase Cloud Messaging)
// When the scheduled time (7 AM or 4 PM) is reached.
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data ? event.data.json() : {}
  console.log('Push received:', data)

  const title = data.title || 'Scheduled Reminder'
  const options = {
    body: data.body || 'It is your scheduled notification time (7 AM or 4 PM).',
    icon: '/icon-192x192.png',
    vibrate: [300, 100, 400],
    tag: 'daily-reminder',  // Ensures only one notification of this type is shown at a time
    requireInteraction: true,
    silent: false,
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Handle notification click (optional)
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  // Example: Open the main page when clicked
  event.waitUntil(
    self.clients.openWindow('/')
  )
})