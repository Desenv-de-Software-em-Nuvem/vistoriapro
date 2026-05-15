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

const filesToCopy = ['_redirects', '_headers'];

for (const fileName of filesToCopy) {
  const source = path.join(__dirname, '..', 'public', fileName);
  const dest = path.join(__dirname, '..', 'dist', fileName);

  try {
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, dest);
      console.info(`✓ public/${fileName} copiado para dist/`);
    } else {
      console.info(`ℹ public/${fileName} não encontrado`);
    }
  } catch (err) {
    console.warn(`⚠ Erro ao copiar ${fileName} (continuando):`, err.message);
  }
}
