const fotoModel = require('../models/fotoModel');

module.exports = {
  async uploadFoto(req, res) {
    try {
      const { uploadToSupabase } = require('../services/storageService');
      if (req.file) {
      } else {
        console.warn('Nenhum arquivo recebido no campo foto');
      }
      const { vistoria_id, descricao, comodo_nome, comodo_id } = req.body;
      if (!vistoria_id || !req.file) {
        console.error('Faltando campos obrigatórios: vistoria_id ou foto');
        return res.status(400).json({ error: 'vistoria_id e foto (arquivo) são obrigatórios.' });
      }

      // Upload para Supabase Storage
      let urlPublica;
      try {
        urlPublica = await uploadToSupabase(req.file.buffer, req.file.originalname, 'fotos');
      } catch (uploadErr) {
        console.error('Erro ao fazer upload para o Supabase:', uploadErr);
        return res.status(500).json({ error: 'Erro ao fazer upload da foto para o Supabase', details: uploadErr.message });
      }

      const foto = await fotoModel.salvar({ 
        vistoria_id, 
        caminho_arquivo: urlPublica, // agora salva a URL pública
        descricao, 
        comodo_nome, 
        comodo_id 
      });
      res.status(201).json({ message: 'Foto enviada', foto });
    } catch (err) {
      console.error('--- [FOTO] Erro ao salvar foto ---');
      console.error(err);
      res.status(500).json({ error: err.message, stack: err.stack });
    }
  },
  async listarFotos(req, res) {
    try {
      let fotos;
      const vistoriaId = req.query.vistoria_id || req.params.vistoriaId;
      if (vistoriaId) {
        fotos = await fotoModel.listarPorVistoria(vistoriaId);
      } else {
        // Listar todas as fotos se não passar vistoria_id
        const result = await fotoModel.listarTodas();
        fotos = result;
      }
      res.json(fotos);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async downloadFoto(req, res) {
    // ... lógica para download de foto
    res.json({});
  },
  async deletarFoto(req, res) {
    try {
      await fotoModel.deletar(req.params.id);
      res.json({ message: 'Foto deletada' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
