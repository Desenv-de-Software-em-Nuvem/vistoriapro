import imovelModel from '../models/imovelModel.js';

const imovelController = {
  async listarImoveis(req, res) {
    try {
      const imoveis = await imovelModel.listarTodos();
      res.json(imoveis);
    } catch (err) {
      console.error('Erro ao listar imoveis:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async buscarImovelPorId(req, res) {
    try {
      const { id } = req.params;
      const empresa_id = req.params.empresa_id;

      const imovel = await imovelModel.buscarPorId(id, empresa_id);
      
      if (!imovel) {
        return res.status(404).json({ error: 'Imóvel não encontrado' });
      }

      res.json({ imovel });
    } catch (err) {
      console.error('Erro ao buscar imóvel:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

};

export default imovelController;