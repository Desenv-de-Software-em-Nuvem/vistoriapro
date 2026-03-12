import { LocatarioVistoriaRepository } from '../repositories/locatarioVistoriaRepository.js';

const locatarioVistoriaController = {
  async listarLocatarios(req, res) {
    try {
      const locatarios = await LocatarioVistoriaRepository.findAll();
      res.json(locatarios);
    } catch (err) {
      console.error('Erro ao listar locatários:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async buscarLocatarioPorId(req, res) {
    try {
      const { id } = req.params;
      const locatario = await LocatarioVistoriaRepository.findById(id);

      if (!locatario) {
        return res.status(404).json({ error: 'Locatário não encontrado' });
      }

      res.json(locatario);
    } catch (err) {
      console.error('Erro ao buscar locatário:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async criarLocatario(req, res) {
    try {
      const payload = { ...req.body };

      if (payload.vistoria_id) {
        payload.vistoria = { id: payload.vistoria_id };
        delete payload.vistoria_id;
      }

      const locatario = await LocatarioVistoriaRepository.create(payload);
      res.status(201).json(locatario);
    } catch (err) {
      console.error('Erro ao criar locatário:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async atualizarLocatario(req, res) {
    try {
      const { id } = req.params;
      const payload = { ...req.body };

      if (payload.vistoria_id) {
        payload.vistoria = { id: payload.vistoria_id };
        delete payload.vistoria_id;
      }

      const locatario = await LocatarioVistoriaRepository.update(id, payload);

      if (!locatario) {
        return res.status(404).json({ error: 'Locatário não encontrado' });
      }

      res.json(locatario);
    } catch (err) {
      console.error('Erro ao atualizar locatário:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async deletarLocatario(req, res) {
    try {
      const { id } = req.params;
      await LocatarioVistoriaRepository.delete(id);
      res.status(204).send();
    } catch (err) {
      console.error('Erro ao deletar locatário:', err);
      res.status(500).json({ error: err.message });
    }
  },
};

export default locatarioVistoriaController;
