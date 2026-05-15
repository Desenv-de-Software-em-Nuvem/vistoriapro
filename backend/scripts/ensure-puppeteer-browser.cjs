'use strict';

/**
 * PDF no Puppeteer precisa de um Chrome/Chromium.
 *
 * - Railway / Docker: Chromium no apk + PUPPETEER_EXECUTABLE_PATH; builder usa INSTALL=0.
 * - Render (Node nativo): instala Chrome aqui; cache fica em backend/.puppeteer-chrome para
 *   ir no deploy (cache em /opt/render/.cache no build não sobrevive ao runtime da forma esperada).
 *
 * Desliga: PUPPETEER_BROWSER_INSTALL=0
 * Força:  PUPPETEER_BROWSER_INSTALL=1
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKEND_ROOT = path.join(__dirname, '..');
const PROJECT_CHROME_CACHE = path.join(BACKEND_ROOT, '.puppeteer-chrome');

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

function isRenderLikeHost() {
  try {
    if (fs.existsSync('/opt/render')) return true;
  } catch {
    /* ignore */
  }
  return Boolean(
    process.env.RENDER_EXTERNAL_URL ||
      process.env.RENDER_SERVICE_NAME ||
      process.env.RENDER,
  );
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
const onRenderOrSimilar = forceInstall || isRenderLikeHost();

if (!onRenderOrSimilar) {
  process.exit(0);
}

try {
  fs.mkdirSync(PROJECT_CHROME_CACHE, { recursive: true });
  process.env.PUPPETEER_CACHE_DIR = PROJECT_CHROME_CACHE;

  console.info(
    '[ensure-puppeteer-browser] Instalando Chrome para Puppeteer em',
    PROJECT_CHROME_CACHE,
  );
  execSync('npx puppeteer browsers install chrome', {
    stdio: 'inherit',
    cwd: BACKEND_ROOT,
    env: { ...process.env, PUPPETEER_CACHE_DIR: PROJECT_CHROME_CACHE },
  });
  console.info('[ensure-puppeteer-browser] Chrome instalado.');
} catch (err) {
  console.error('[ensure-puppeteer-browser] Falha:', err?.message || err);
  process.exit(1);
}
