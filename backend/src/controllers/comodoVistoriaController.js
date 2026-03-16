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
      const payload = { ...req.body };

      if (payload.vistoria_id) {
        payload.vistoria = { id: payload.vistoria_id };
        delete payload.vistoria_id;
      }

      const comodo = await ComodoVistoriaRepository.create(payload);
      res.status(201).json(comodo);
    } catch (err) {
      console.error('Erro ao criar cômodo:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async atualizarComodo(req, res) {
    try {
      const { id } = req.params;
      const payload = { ...req.body };

      if (payload.vistoria_id) {
        payload.vistoria = { id: payload.vistoria_id };
        delete payload.vistoria_id;
      }

      const comodo = await ComodoVistoriaRepository.update(id, payload);

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
