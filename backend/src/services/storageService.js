const supabase = require('../config/supabase');

/**
 * Faz upload de um arquivo buffer para o Supabase Storage e retorna a URL pública
 * @param {Buffer} buffer - Buffer do arquivo
 * @param {string} fileName - Nome do arquivo (ex: foto.jpg)
 * @param {string} folder - Pasta/bucket (ex: 'fotos')
 * @returns {Promise<string>} URL pública
 */
async function uploadToSupabase(buffer, fileName, folder = 'fotos') {
  const filePath = `${Date.now()}_${fileName}`;
  const { data, error } = await supabase.storage.from(folder).upload(filePath, buffer, {
    contentType: 'image/jpeg',
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
