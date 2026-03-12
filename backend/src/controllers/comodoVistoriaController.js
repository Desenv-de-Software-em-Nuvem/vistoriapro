import { ComodoVistoriaRepository } from '../repositories/comodoVistoriaRepository.js';

const comodoVistoriaController = {
  async listarComodos(req, res) {
    try {
      const comodos = await ComodoVistoriaRepository.findAll();
      res.json(comodos);
    } catch (err) {
      console.error('Erro ao listar cômodos:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async buscarComodoPorId(req, res) {
    try {
      const { id } = req.params;
      const comodo = await ComodoVistoriaRepository.findById(id);

      if (!comodo) {
        return res.status(404).json({ error: 'Cômodo não encontrado' });
      }

      res.json(comodo);
    } catch (err) {
      console.error('Erro ao buscar cômodo:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async criarComodo(req, res) {
    try {
      const comodo = await ComodoVistoriaRepository.create(req.body);
      res.status(201).json(comodo);
    } catch (err) {
      console.error('Erro ao criar cômodo:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async atualizarComodo(req, res) {
    try {
      const { id } = req.params;
      const comodo = await ComodoVistoriaRepository.update(id, req.body);

      if (!comodo) {
        return res.status(404).json({ error: 'Cômodo não encontrado' });
      }

      res.json(comodo);
    } catch (err) {
      console.error('Erro ao atualizar cômodo:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async deletarComodo(req, res) {
    try {
      const { id } = req.params;
      await ComodoVistoriaRepository.delete(id);
      res.status(204).send();
    } catch (err) {
      console.error('Erro ao deletar cômodo:', err);
      res.status(500).json({ error: err.message });
    }
  },
};

export default comodoVistoriaController;
