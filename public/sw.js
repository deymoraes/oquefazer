// Service Worker for OQueFazer PWA
// Handles notifications and background sync

self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()

    const options = {
      body: data.body || 'Você tem uma tarefa pendente',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: data.tag || 'default',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      actions: [
        { action: 'done', title: 'Marcar como feita' },
        { action: 'snooze', title: 'Soneca 10min' }
      ]
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'OQueFazer - Lembrete', options)
    )
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'done') {
    // Handle mark as done
    event.waitUntil(
      clients.openWindow('/?done=' + event.notification.tag)
    )
  } else if (event.action === 'snooze') {
    // Handle snooze - reschedule for 10 minutes
    event.waitUntil(
      clients.openWindow('/?snooze=' + event.notification.tag)
    )
  } else {
    // Open app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})
