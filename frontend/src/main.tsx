import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

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

// Registro do service worker para PWA
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((registrationError) => {
      console.warn('Falha ao registrar o service worker:', registrationError)
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
