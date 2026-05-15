import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { setupChunkLoadRecovery } from './utils/chunkLoadRecovery'

setupChunkLoadRecovery()

// Em desenvolvimento, remove qualquer service worker/caches antigos para evitar ruído do Workbox.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister())
    })

    if ('caches' in window) {
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)))
    }
  })
}

if (import.meta.env.PROD) {
  const updateSW = registerSW({
    immediate: true,
    onRegisteredSW(_swUrl: string, registration: ServiceWorkerRegistration | undefined) {
      if (!registration) return
      const checkForUpdates = () => registration.update().catch(() => undefined)
      checkForUpdates()
      window.setInterval(checkForUpdates, 60 * 60 * 1000)
    },
    onNeedRefresh() {
      if (document.visibilityState === 'visible') {
        updateSW(true)
      }
    },
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
