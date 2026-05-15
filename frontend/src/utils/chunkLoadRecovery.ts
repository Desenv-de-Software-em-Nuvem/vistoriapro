const CHUNK_RELOAD_KEY = 'vistoriapro-chunk-reload'

function shouldRecoverFromMessage(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('failed to fetch dynamically imported module') ||
    normalized.includes('importing a module script failed') ||
    normalized.includes('error loading dynamically imported module') ||
    normalized.includes('failed to load module script') ||
    normalized.includes('mime type') && normalized.includes('text/html')
  )
}

function reloadOnceForStaleAssets(): void {
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return
  sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
  window.location.reload()
}

export function setupChunkLoadRecovery(): void {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason as { message?: string } | string | undefined
    const message = typeof reason === 'string' ? reason : reason?.message ?? ''
    if (!shouldRecoverFromMessage(message)) return
    event.preventDefault()
    reloadOnceForStaleAssets()
  })

  window.addEventListener(
    'error',
    (event) => {
      const target = event.target
      if (!(target instanceof HTMLScriptElement)) return
      if (!target.src.includes('/assets/')) return

      const message = event.message || ''
      if (!shouldRecoverFromMessage(message)) return
      reloadOnceForStaleAssets()
    },
    true,
  )

  window.addEventListener('load', () => {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY)
  })
}
