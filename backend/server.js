require('dotenv').config();

// Mesmo caminho usado em scripts/ensure-puppeteer-browser.cjs (Chrome baixado no build no Render)
const path = require('path');
const fs = require('fs');
const puppeteerChromeCache = path.join(__dirname, '.puppeteer-chrome');
if (!process.env.PUPPETEER_CACHE_DIR && fs.existsSync(puppeteerChromeCache)) {
  process.env.PUPPETEER_CACHE_DIR = puppeteerChromeCache;
}

const app = require('./index');
const pool = require('./src/config/database');

const PORT = process.env.PORT || 3000;

// Migration segura: adiciona unique constraint em comodos_vistoria se ainda nao existir
pool.query(`
  DO $$ BEGIN
    ALTER TABLE comodos_vistoria
      ADD CONSTRAINT comodos_vistoria_vistoria_id_nome_unique UNIQUE (vistoria_id, nome);
  EXCEPTION WHEN duplicate_table THEN NULL;
  END $$;
`).catch(err => console.warn('[migration] comodos_vistoria unique constraint:', err.message));

// Adicionando logs para capturar requisições
app.use((req, res, next) => {
  console.log(`Requisição recebida: ${req.method} ${req.url}`);
  next();
});

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
  console.error('Erro não capturado:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promise rejeitada não tratada:', reason);
  process.exit(1);
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=== SERVIDOR INICIADO ===`);
  console.log(`Porta: ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('==========================');
});

// Graceful shutdown (fecha Chrome compartilhado do Puppeteer, se houver)
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando servidor...');
  server.close(async () => {
    try {
      const { closeSharedPdfBrowser } = require('./src/controllers/relatorioController');
      if (typeof closeSharedPdfBrowser === 'function') {
        await closeSharedPdfBrowser();
      }
    } catch (e) {
      console.warn('Ao encerrar Chrome Puppeteer:', e.message);
    }
    console.log('Servidor encerrado.');
    process.exit(0);
  });
});
