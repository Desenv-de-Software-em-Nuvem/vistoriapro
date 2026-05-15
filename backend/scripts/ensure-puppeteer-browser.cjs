'use strict';

/**
 * PDF no Puppeteer precisa de um Chrome/Chromium.
 *
 * - Railway / Docker: Chromium na imagem + PUPPETEER_EXECUTABLE_PATH (e no builder usamos INSTALL=0).
 * - Render Web Service (Node nativo): sem Chrome no SO — baixamos o Chrome do Puppeteer no build.
 *
 * Desliga explicitamente: PUPPETEER_BROWSER_INSTALL=0
 * Força download:       PUPPETEER_BROWSER_INSTALL=1
 */

const fs = require('fs');
const { execSync } = require('child_process');

function hasEnvPath(p) {
  return typeof p === 'string' && p.trim().length > 0;
}

function hasSystemChromium() {
  const paths = [
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
  ];
  return paths.some((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });
}

if (process.env.PUPPETEER_BROWSER_INSTALL === '0') {
  process.exit(0);
}

if (hasEnvPath(process.env.PUPPETEER_EXECUTABLE_PATH)) {
  process.exit(0);
}

if (hasSystemChromium()) {
  process.exit(0);
}

const forceInstall = process.env.PUPPETEER_BROWSER_INSTALL === '1';
// Render injeta URL pública do serviço (build + runtime). Node nativo sem Docker.
const onRenderWebService = Boolean(
  process.env.RENDER_EXTERNAL_URL || process.env.RENDER_SERVICE_NAME,
);

if (!forceInstall && !onRenderWebService) {
  process.exit(0);
}

try {
  console.info('[ensure-puppeteer-browser] Instalando Chrome para Puppeteer (PDF)...');
  execSync('npx puppeteer browsers install chrome', {
    stdio: 'inherit',
    env: process.env,
  });
  console.info('[ensure-puppeteer-browser] Chrome instalado.');
} catch (err) {
  console.error('[ensure-puppeteer-browser] Falha:', err?.message || err);
  process.exit(1);
}
