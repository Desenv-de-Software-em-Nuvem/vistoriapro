import { ImovelRepository } from '../repositories/imovelRepository.js';

const imovelController = {
  async listarImoveis(req, res) {
    try {
      const imoveis = await ImovelRepository.findAll();
      res.json(imoveis);
    } catch (err) {
      console.error('Erro ao listar imoveis:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async buscarImovelPorId(req, res) {
    try {
      const { id, empresa_id } = req.params;

      const imovel = await ImovelRepository.findById(id, { empresaId: empresa_id });
      
      if (!imovel) {
        return res.status(404).json({ error: 'Imóvel não encontrado' });
      }

      res.json({ imovel });
    } catch (err) {
      console.error('Erro ao buscar imóvel:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },
};

export default imovelController;