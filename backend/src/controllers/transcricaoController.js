const transcricaoModel = require('../models/transcricaoModel');

module.exports = {
  async uploadTranscricao(req, res) {
    try {
      const { vistoria_id, url_audio, texto, foto_id, comodo_nome } = req.body;
      if (!vistoria_id || !url_audio || !texto) {
        return res.status(400).json({ error: 'vistoria_id, url_audio e texto são obrigatórios.' });
      }
      const transcricao = await transcricaoModel.salvar({ 
        vistoria_id, 
        url_audio, 
        texto, 
        foto_id, 
        comodo_nome 
      });
      res.status(201).json({ message: 'Transcrição enviada', transcricao });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async listarTranscricoesPorVistoria(req, res) {
    try {
      const vistoriaId = req.query.vistoria_id || req.params.vistoriaId;
      if (!vistoriaId) {
        return res.status(400).json({ error: 'vistoria_id é obrigatório.' });
      }
      const transcricoes = await transcricaoModel.listarPorVistoria(vistoriaId);
      res.json(transcricoes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async downloadAudio(req, res) {
    // ... lógica para download de áudio
    res.json({});
  },
  async deletarTranscricao(req, res) {
    try {
      await transcricaoModel.deletar(req.params.id);
      res.json({ message: 'Transcrição deletada' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
