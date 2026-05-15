const RELOAD_GUARD_KEY = 'vistoriapro-deploy-reload-at';
const RELOAD_GUARD_MS = 15_000;

function isStaleAssetError(message: string): boolean {
  return /Failed to fetch dynamically imported module|Loading chunk [\w-]+ failed|Importing a module script failed|Expected a JavaScript-or-Wasm module script|MIME type of "text\/html"/i.test(
    message,
  );
}

function shouldAttemptReload(): boolean {
  const lastReloadAt = sessionStorage.getItem(RELOAD_GUARD_KEY);
  if (!lastReloadAt) {
    return true;
  }

  return Date.now() - Number(lastReloadAt) > RELOAD_GUARD_MS;
}

async function clearServiceWorkerCaches(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}

async function recoverFromStaleDeploy(): Promise<void> {
  if (!shouldAttemptReload()) {
    return;
  }

  sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  await clearServiceWorkerCaches();
  window.location.reload();
}

function handleDeployError(reason: unknown): void {
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === 'string'
        ? reason
        : '';

  if (!isStaleAssetError(message)) {
    return;
  }

  void recoverFromStaleDeploy();
}

export function setupDeployRecovery(): void {
  window.addEventListener('unhandledrejection', (event) => {
    handleDeployError(event.reason);
  });

  window.addEventListener('error', (event) => {
    handleDeployError(event.message);
  });
}
