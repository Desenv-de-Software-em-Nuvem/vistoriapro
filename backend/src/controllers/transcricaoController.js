import { TranscricaoRepository } from '../repositories/transcricaoRepository.js';

const transcricaoController = {
  async listarTranscricoes(req, res) {
    try {
      const transcricoes = await TranscricaoRepository.findAll();
      res.json(transcricoes);
    } catch (err) {
      console.error('Erro ao listar transcrições:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async buscarTranscricaoPorId(req, res) {
    try {
      const { id } = req.params;
      const transcricao = await TranscricaoRepository.findById(id);

      if (!transcricao) {
        return res.status(404).json({ error: 'Transcrição não encontrada' });
      }

      res.json(transcricao);
    } catch (err) {
      console.error('Erro ao buscar transcrição:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async criarTranscricao(req, res) {
    try {
      const transcricao = await TranscricaoRepository.create(req.body);
      res.status(201).json(transcricao);
    } catch (err) {
      console.error('Erro ao criar transcrição:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async atualizarTranscricao(req, res) {
    try {
      const { id } = req.params;
      const transcricao = await TranscricaoRepository.update(id, req.body);

      if (!transcricao) {
        return res.status(404).json({ error: 'Transcrição não encontrada' });
      }

      res.json(transcricao);
    } catch (err) {
      console.error('Erro ao atualizar transcrição:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async deletarTranscricao(req, res) {
    try {
      const { id } = req.params;
      await TranscricaoRepository.delete(id);
      res.status(204).send();
    } catch (err) {
      console.error('Erro ao deletar transcrição:', err);
      res.status(500).json({ error: err.message });
    }
  },
};

export default transcricaoController;
