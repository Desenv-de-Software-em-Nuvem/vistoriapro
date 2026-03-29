/**
 * Post-build script - cross-platform
 * Copia arquivo _redirects para dist (se existir)
 * Funciona em Windows, macOS e Linux
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const source = path.join(__dirname, '..', 'public', '_redirects');
const dest = path.join(__dirname, '..', 'dist', '_redirects');

try {
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, dest);
    console.log('✓ public/_redirects copiado para dist/');
  } else {
    console.log('ℹ public/_redirects não encontrado (esperado em produção)');
  }
} catch (err) {
  console.warn('⚠ Erro ao copiar _redirects (continuando):', err.message);
  // Não falha o build, apenas warn
}
