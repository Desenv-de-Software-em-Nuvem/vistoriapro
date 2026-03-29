const locatarioVistoriaModel = require('../models/locatarioVistoriaModel');

module.exports = {
  async criarLocatario(req, res) {
    try {
      const locatario = await locatarioVistoriaModel.criar(req.body);
      res.status(201).json(locatario);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async listarPorVistoria(req, res) {
    try {
      const { vistoria_id } = req.params;
      const locatarios = await locatarioVistoriaModel.listarPorVistoria(vistoria_id);
      res.json(locatarios);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async atualizarLocatario(req, res) {
    try {
      const { id } = req.params;
      const locatario = await locatarioVistoriaModel.atualizar(id, req.body);
      res.json(locatario);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async deletarLocatario(req, res) {
    try {
      const { id } = req.params;
      await locatarioVistoriaModel.deletar(id);
      res.json({ message: 'Locatário removido' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const locatario = await locatarioVistoriaModel.buscarPorId(id);
      if (!locatario) return res.status(404).json({ error: 'Locatário não encontrado' });
      res.json(locatario);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
