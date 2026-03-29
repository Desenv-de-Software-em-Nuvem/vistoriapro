const vistoriaModel = require('../models/vistoriaModel');

module.exports = {
  // Método alternativo para atualizar apenas o status da vistoria
  async atualizarStatusVistoria(req, res) {
    try {
      console.log('[atualizarStatusVistoria] id:', req.params.id);
      console.log('[atualizarStatusVistoria] status solicitado:', req.query.status);
      
      if (!req.query.status) {
        return res.status(400).json({ error: 'Status não informado na query' });
      }
      
      // Verifica se o status solicitado é válido
      const statusValidos = ['em_andamento', 'finalizada', 'cancelada'];
      if (!statusValidos.includes(req.query.status)) {
        return res.status(400).json({ 
          error: `Status inválido. Valores permitidos: ${statusValidos.join(', ')}`,
          statusSolicitado: req.query.status
        });
      }
      
      // Busca a vistoria antes de atualizar para verificar
      const vistoriaAtual = await vistoriaModel.buscarPorId(req.params.id);
      if (!vistoriaAtual) {
        return res.status(404).json({ error: 'Vistoria não encontrada' });
      }
      
      console.log('[atualizarStatusVistoria] status atual:', vistoriaAtual.status);
      
      // Atualiza apenas o status
      const vistoria = await vistoriaModel.atualizar(req.params.id, { status: req.query.status });
      console.log('[atualizarStatusVistoria] resultado do update:', vistoria);
      
      res.json({ 
        message: `Status da vistoria atualizado de ${vistoriaAtual.status} para ${req.query.status}`, 
        vistoria 
      });
    } catch (err) {
      console.error('Erro ao atualizar status da vistoria:', err);
      res.status(500).json({ 
        error: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
      });
    }
  },
  async criarVistoria(req, res) {
    try {
      const { descricao, data, imovel_id } = req.body;
      const empresa_id = req.usuario.empresa_id;
      const usuario_id = req.usuario.id;
      
      if (!descricao || !data || !imovel_id) {
        return res.status(400).json({ error: 'Dados obrigatórios: descricao, data, imovel_id' });
      }
      
      const vistoria = await vistoriaModel.criar({ 
        empresa_id, 
        usuario_id, 
        descricao, 
        data, 
        imovel_id,
        status: req.body.status || 'em_andamento'
      });
      
      res.status(201).json({ message: 'Vistoria criada', vistoria });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async listarVistorias(req, res) {
    try {
      const empresa_id = req.usuario.empresa_id;
      const { imovel_id } = req.query;
      
      let vistorias;
      if (imovel_id) {
        // Filtrar por imóvel específico
        vistorias = await vistoriaModel.listarPorImovel(imovel_id, empresa_id);
      } else {
        // Listar todas da empresa
        vistorias = await vistoriaModel.listarTodas(empresa_id);
      }
      
      res.json({ vistorias });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async buscarVistoriaPorId(req, res) {
    try {
      const vistoria = await vistoriaModel.buscarPorId(req.params.id);
      if (!vistoria) return res.status(404).json({ error: 'Vistoria não encontrada' });
      res.json(vistoria);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async atualizarVistoria(req, res) {
    try {
      console.log('[atualizarVistoria] id:', req.params.id);
      console.log('[atualizarVistoria] dados recebidos:', req.body);

      // Filtrar apenas campos válidos da tabela vistorias
      const camposValidos = [
        'descricao', 'data', 'status', 'observacoes_gerais', 'imovel_id',
        'numero_contrato', 'objeto', 'data_vistoria'
      ];
      const dados = {};
      for (const key of camposValidos) {
        if (req.body[key] !== undefined) {
          dados[key] = req.body[key];
        }
      }

      const vistoria = await vistoriaModel.atualizar(req.params.id, dados);
      console.log('[atualizarVistoria] resultado do update:', vistoria);
      res.json({ message: 'Vistoria atualizada', vistoria });
    } catch (err) {
      console.error('Erro ao atualizar vistoria:', err);
      res.status(500).json({ error: err.message });
    }
  },
  async deletarVistoria(req, res) {
    try {
      await vistoriaModel.deletar(req.params.id);
      res.json({ message: 'Vistoria deletada' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
