const fs = require('fs');
const path = require('path');
let sharp = null;

try {
  sharp = require('sharp');
} catch (error) {
  console.warn('[storage] sharp indisponível, salvando imagem sem otimização.', error.message);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_API_KEY;
const supabase = supabaseUrl && supabaseKey ? require('../config/supabase') : null;

const UPLOAD_MAX_WIDTH = 1600;
const UPLOAD_MAX_HEIGHT = 1600;
const UPLOAD_JPEG_QUALITY = 74;

async function optimizeImageBuffer(buffer) {
  if (!sharp) {
    return buffer;
  }

  return sharp(buffer)
    .rotate()
    .resize({
      width: UPLOAD_MAX_WIDTH,
      height: UPLOAD_MAX_HEIGHT,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({
      quality: UPLOAD_JPEG_QUALITY,
      mozjpeg: true,
    })
    .toBuffer();
}

/**
 * Faz upload de um arquivo buffer para o Supabase Storage e retorna a URL pública
 * @param {Buffer} buffer - Buffer do arquivo
 * @param {string} fileName - Nome do arquivo (ex: foto.jpg)
 * @param {string} folder - Pasta/bucket (ex: 'fotos')
 * @returns {Promise<string>} URL pública
 */
function normalizeStoredFileName(fileName, optimized) {
  const baseName = path.parse(fileName).name;
  if (optimized) {
    return `${baseName}.jpg`;
  }

  return fileName;
}

async function uploadToSupabase(buffer, fileName, folder = 'fotos', mimeType = 'image/jpeg') {
  const optimizedBuffer = await optimizeImageBuffer(buffer);
  const optimized = optimizedBuffer !== buffer;
  const storedFileName = normalizeStoredFileName(fileName, optimized);
  const storedMimeType = optimized ? 'image/jpeg' : mimeType || 'image/jpeg';

  if (!supabase) {
    const uploadsDir = path.join(__dirname, '../../uploads', folder);
    fs.mkdirSync(uploadsDir, { recursive: true });
    const safeName = `${Date.now()}_${storedFileName}`;
    const localPath = path.join(uploadsDir, safeName);
    fs.writeFileSync(localPath, optimizedBuffer);
    return `/uploads/${folder}/${safeName}`;
  }

  const filePath = `${Date.now()}_${storedFileName}`;
  const { data, error } = await supabase.storage.from(folder).upload(filePath, optimizedBuffer, {
    contentType: storedMimeType,
    upsert: false
  });
  if (error) {
    throw new Error('Erro ao fazer upload para o Supabase: ' + error.message);
  }
  // Gera URL pública
  const { data: publicUrlData } = supabase.storage.from(folder).getPublicUrl(filePath);
  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error('Não foi possível obter a URL pública da imagem.');
  }
  return publicUrlData.publicUrl;
}

module.exports = {
  uploadToSupabase
};
