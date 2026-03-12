import { ImovelRepository } from '../repositories/imovelRepository.js';

const imovelController = {
  async listarImoveis(req, res) {
    try {
      const { empresa_id } = req.query;

      const imoveis = empresa_id
        ? await ImovelRepository.findByEmpresaId(empresa_id)
        : await ImovelRepository.findAll();

      res.json(imoveis);
    } catch (err) {
      console.error('Erro ao listar imoveis:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async buscarImovelPorId(req, res) {
    try {
      const { id } = req.params;
      const { empresa_id } = req.query;

      const imovel = await ImovelRepository.findById(id, { empresaId: empresa_id });

      if (!imovel) {
        return res.status(404).json({ error: 'Imóvel não encontrado' });
      }

      res.json(imovel);
    } catch (err) {
      console.error('Erro ao buscar imóvel:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async criarImovel(req, res) {
    try {
      const imovel = await ImovelRepository.create(req.body);
      res.status(201).json(imovel);
    } catch (err) {
      console.error('Erro ao criar imóvel:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async atualizarImovel(req, res) {
    try {
      const { id } = req.params;
      const imovel = await ImovelRepository.update(id, req.body);

      if (!imovel) {
        return res.status(404).json({ error: 'Imóvel não encontrado' });
      }

      res.json(imovel);
    } catch (err) {
      console.error('Erro ao atualizar imóvel:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async deletarImovel(req, res) {
    try {
      const { id } = req.params;
      await ImovelRepository.delete(id);
      res.status(204).send();
    } catch (err) {
      console.error('Erro ao deletar imóvel:', err);
      res.status(500).json({ error: err.message });
    }
  },
};

export default imovelController;