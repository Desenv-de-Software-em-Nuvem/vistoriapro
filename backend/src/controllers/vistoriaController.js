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
      const payload = { ...req.body };

      // Mapeia as chaves de FK para as relações do TypeORM
      if (payload.empresa_id) {
        payload.empresa = { id: payload.empresa_id };
        delete payload.empresa_id;
      }
      if (payload.usuario_id) {
        payload.usuario = { id: payload.usuario_id };
        delete payload.usuario_id;
      }
      if (payload.imovel_id) {
        payload.imovel = { id: payload.imovel_id };
        delete payload.imovel_id;
      }

      const vistoria = await VistoriaRepository.create(payload);
      res.status(201).json(vistoria);
    } catch (err) {
      console.error('Erro ao criar vistoria:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async atualizarVistoria(req, res) {
    try {
      const { id } = req.params;
      const payload = { ...req.body };

      if (payload.empresa_id) {
        payload.empresa = { id: payload.empresa_id };
        delete payload.empresa_id;
      }
      if (payload.usuario_id) {
        payload.usuario = { id: payload.usuario_id };
        delete payload.usuario_id;
      }
      if (payload.imovel_id) {
        payload.imovel = { id: payload.imovel_id };
        delete payload.imovel_id;
      }

      const vistoria = await VistoriaRepository.update(id, payload);

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
