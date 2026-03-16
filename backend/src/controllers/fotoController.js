import { FotoRepository } from '../repositories/fotoRepository.js';

const fotoController = {
  async listarFotos(req, res) {
    try {
      const fotos = await FotoRepository.findAll();
      res.json(fotos);
    } catch (err) {
      console.error('Erro ao listar fotos:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async buscarFotoPorId(req, res) {
    try {
      const { id } = req.params;
      const foto = await FotoRepository.findById(id);

      if (!foto) {
        return res.status(404).json({ error: 'Foto não encontrada' });
      }

      res.json(foto);
    } catch (err) {
      console.error('Erro ao buscar foto:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async criarFoto(req, res) {
    try {
      const foto = await FotoRepository.create(req.body);
      res.status(201).json(foto);
    } catch (err) {
      console.error('Erro ao criar foto:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async atualizarFoto(req, res) {
    try {
      const { id } = req.params;
      const foto = await FotoRepository.update(id, req.body);

      if (!foto) {
        return res.status(404).json({ error: 'Foto não encontrada' });
      }

      res.json(foto);
    } catch (err) {
      console.error('Erro ao atualizar foto:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async deletarFoto(req, res) {
    try {
      const { id } = req.params;
      await FotoRepository.delete(id);
      res.status(204).send();
    } catch (err) {
      console.error('Erro ao deletar foto:', err);
      res.status(500).json({ error: err.message });
    }
  },
};

export default fotoController;
