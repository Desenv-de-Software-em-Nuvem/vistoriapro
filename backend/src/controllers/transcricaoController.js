const transcricaoModel = require('../models/transcricaoModel');
const vistoriaModel = require('../models/vistoriaModel');

module.exports = {
  async uploadTranscricao(req, res) {
    try {
      const { vistoria_id, url_audio, texto, foto_id, comodo_nome } = req.body;
      if (!vistoria_id || !url_audio || !texto) {
        return res.status(400).json({ error: 'vistoria_id, url_audio e texto são obrigatórios.' });
      }

      const vistoria = await vistoriaModel.buscarPorId(vistoria_id, req.usuario.empresa_id);
      if (!vistoria) {
        return res.status(404).json({ error: 'Vistoria não encontrada.' });
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
      const transcricoes = await transcricaoModel.listarPorVistoria(vistoriaId, req.usuario.empresa_id);
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
      const deletada = await transcricaoModel.deletar(req.params.id, req.usuario.empresa_id);
      if (!deletada) return res.status(404).json({ error: 'Transcrição não encontrada' });
      res.json({ message: 'Transcrição deletada' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
