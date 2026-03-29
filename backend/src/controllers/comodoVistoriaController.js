const comodoVistoriaModel = require('../models/comodoVistoriaModel');

module.exports = {
  async criarComodo(req, res) {
    try {
      const { vistoria_id, nome, descricao } = req.body;
      if (!vistoria_id || !nome) {
        return res.status(400).json({ error: 'vistoria_id e nome são obrigatórios' });
      }
      const comodo = await comodoVistoriaModel.criar({ vistoria_id, nome, descricao });
      res.status(201).json(comodo);
    } catch (err) {
      console.error('Erro ao criar cômodo:', err);
      res.status(500).json({ error: 'Erro ao criar cômodo' });
    }
  },

  async listarPorVistoria(req, res) {
    try {
      const { vistoria_id } = req.params;
      const comodos = await comodoVistoriaModel.listarPorVistoria(vistoria_id);
      res.json(comodos);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao listar cômodos' });
    }
  },

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const comodo = await comodoVistoriaModel.buscarPorId(id);
      if (!comodo) return res.status(404).json({ error: 'Cômodo não encontrado' });
      res.json(comodo);
    } catch (err) {
      res.status(500).json({ error: 'Erro ao buscar cômodo' });
    }
  },

  async deletar(req, res) {
    try {
      const { id } = req.params;
      await comodoVistoriaModel.deletar(id);
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: 'Erro ao deletar cômodo' });
    }
  },
};
