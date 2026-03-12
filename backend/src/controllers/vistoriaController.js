import { VistoriaRepository } from '../repositories/vistoriaRepository.js';

const vistoriaController = {
  async listarVistorias(req, res) {
    try {
      const vistorias = await VistoriaRepository.findAll();
      res.json(vistorias);
    } catch (err) {
      console.error('Erro ao listar vistorias:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async buscarVistoriaPorId(req, res) {
    try {
      const { id } = req.params;
      const vistoria = await VistoriaRepository.findById(id);

      if (!vistoria) {
        return res.status(404).json({ error: 'Vistoria não encontrada' });
      }

      res.json(vistoria);
    } catch (err) {
      console.error('Erro ao buscar vistoria:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async criarVistoria(req, res) {
    try {
      const vistoria = await VistoriaRepository.create(req.body);
      res.status(201).json(vistoria);
    } catch (err) {
      console.error('Erro ao criar vistoria:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async atualizarVistoria(req, res) {
    try {
      const { id } = req.params;
      const vistoria = await VistoriaRepository.update(id, req.body);

      if (!vistoria) {
        return res.status(404).json({ error: 'Vistoria não encontrada' });
      }

      res.json(vistoria);
    } catch (err) {
      console.error('Erro ao atualizar vistoria:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async deletarVistoria(req, res) {
    try {
      const { id } = req.params;
      await VistoriaRepository.delete(id);
      res.status(204).send();
    } catch (err) {
      console.error('Erro ao deletar vistoria:', err);
      res.status(500).json({ error: err.message });
    }
  },
};

export default vistoriaController;
