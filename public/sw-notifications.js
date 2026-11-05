// Custom notification handlers imported by Workbox Service Worker
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
    event.waitUntil(
      clients.openWindow('/?done=' + event.notification.tag)
    )
  } else if (event.action === 'snooze') {
    event.waitUntil(
      clients.openWindow('/?snooze=' + event.notification.tag)
    )
  } else {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})
