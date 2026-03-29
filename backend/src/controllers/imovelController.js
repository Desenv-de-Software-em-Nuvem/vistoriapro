const imovelModel = require('../models/imovelModel');

module.exports = {
  async criarImovel(req, res) {
    try {
      const { nome, endereco_completo, unidade, cidade, uf, cep, tipo, observacoes } = req.body;
      const empresa_id = req.usuario.empresa_id;

      // Validação básica
      if (!nome || !endereco_completo || !cidade || !uf || !tipo) {
        return res.status(400).json({ 
          error: 'Campos obrigatórios: nome, endereco_completo, cidade, uf, tipo' 
        });
      }

      const imovel = await imovelModel.criar({
        empresa_id,
        nome,
        endereco_completo,
        unidade,
        cidade,
        uf,
        cep,
        tipo,
        observacoes
      });

      res.status(201).json({ 
        message: 'Imóvel criado com sucesso', 
        imovel 
      });
    } catch (err) {
      console.error('Erro ao criar imóvel:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async listarImoveis(req, res) {
    try {
      const empresa_id = req.usuario.empresa_id;
      const imoveis = await imovelModel.listarTodos(empresa_id);
      
      res.json({ 
        imoveis,
        total: imoveis.length 
      });
    } catch (err) {
      console.error('Erro ao listar imóveis:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async buscarImovelPorId(req, res) {
    try {
      const { id } = req.params;
      const empresa_id = req.usuario.empresa_id;

      const imovel = await imovelModel.buscarPorId(id, empresa_id);
      
      if (!imovel) {
        return res.status(404).json({ error: 'Imóvel não encontrado' });
      }

      res.json({ imovel });
    } catch (err) {
      console.error('Erro ao buscar imóvel:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async atualizarImovel(req, res) {
    try {
      const { id } = req.params;
      const empresa_id = req.usuario.empresa_id;
      const dadosRecebidos = req.body;

      // Filtrar apenas campos válidos da tabela imoveis
      const camposValidos = [
        'nome', 'endereco_completo', 'unidade', 'cidade', 'uf', 'cep', 'tipo', 'observacoes',
        'proprietario_nome', 'proprietario_cpf', 'proprietario_rg', 'proprietario_endereco',
        'administradora_nome', 'administradora_cnpj', 'imovel_matricula', 'imovel_cartorio'
      ];
      const dados = {};
      for (const key of camposValidos) {
        if (dadosRecebidos[key] !== undefined) {
          dados[key] = dadosRecebidos[key];
        }
      }

      const imovel = await imovelModel.atualizar(id, empresa_id, dados);
      
      if (!imovel) {
        return res.status(404).json({ error: 'Imóvel não encontrado' });
      }

      res.json({ 
        message: 'Imóvel atualizado com sucesso', 
        imovel 
      });
    } catch (err) {
      console.error('Erro ao atualizar imóvel:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async deletarImovel(req, res) {
    try {
      const { id } = req.params;
      const empresa_id = req.usuario.empresa_id;

      const sucesso = await imovelModel.deletar(id, empresa_id);
      
      if (!sucesso) {
        return res.status(404).json({ error: 'Imóvel não encontrado' });
      }

      res.json({ message: 'Imóvel deletado com sucesso' });
    } catch (err) {
      console.error('Erro ao deletar imóvel:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async buscarImovelPorEndereco(req, res) {
    try {
      const { endereco } = req.query;
      const empresa_id = req.usuario.empresa_id;

      if (!endereco) {
        return res.status(400).json({ error: 'Parâmetro endereco é obrigatório' });
      }

      const imoveis = await imovelModel.buscarPorEndereco(endereco, empresa_id);
      
      res.json({ 
        imoveis,
        total: imoveis.length 
      });
    } catch (err) {
      console.error('Erro ao buscar imóvel por endereço:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};
