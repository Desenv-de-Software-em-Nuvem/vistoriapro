const empresaComodoConfigModel = require('../models/empresaComodoConfigModel');

const PAPEIS_PERMITIDOS = new Set(['admin', 'vistoriador']);

function podeEditarComodos(req) {
  return PAPEIS_PERMITIDOS.has(req.usuario?.papel);
}

function texto(value) {
  return String(value || '').trim();
}

module.exports = {
  async listar(req, res) {
    try {
      if (!podeEditarComodos(req)) {
        return res.status(403).json({ error: 'Acesso negado.' });
      }

      const tipo_imovel = texto(req.query.tipo_imovel);
      if (!tipo_imovel) {
        return res.status(400).json({ error: 'tipo_imovel é obrigatório.' });
      }

      const configs = await empresaComodoConfigModel.listarPorEmpresaETipo(
        req.usuario.empresa_id,
        tipo_imovel
      );
      res.json(configs);
    } catch (err) {
      console.error('Erro ao listar config de cômodos:', err);
      res.status(500).json({ error: 'Erro ao listar configuração de cômodos.' });
    }
  },

  async salvar(req, res) {
    try {
      if (!podeEditarComodos(req)) {
        return res.status(403).json({ error: 'Acesso negado.' });
      }

      const tipo_imovel = texto(req.body.tipo_imovel);
      const comodo_key = texto(req.body.comodo_key);
      const nome_exibicao = texto(req.body.nome_exibicao);

      if (!tipo_imovel || !comodo_key || !nome_exibicao) {
        return res.status(400).json({ error: 'tipo_imovel, comodo_key e nome_exibicao são obrigatórios.' });
      }
      if (nome_exibicao.length > 100) {
        return res.status(400).json({ error: 'nome_exibicao deve ter no máximo 100 caracteres.' });
      }

      const config = await empresaComodoConfigModel.upsert({
        empresa_id: req.usuario.empresa_id,
        tipo_imovel,
        comodo_key,
        nome_exibicao,
      });
      res.json(config);
    } catch (err) {
      console.error('Erro ao salvar config de cômodo:', err);
      res.status(500).json({ error: 'Erro ao salvar configuração de cômodo.' });
    }
  },

  async restaurarPadrao(req, res) {
    try {
      if (!podeEditarComodos(req)) {
        return res.status(403).json({ error: 'Acesso negado.' });
      }

      const tipo_imovel = texto(req.query.tipo_imovel || req.body?.tipo_imovel);
      const comodo_key = texto(req.query.comodo_key || req.body?.comodo_key);

      if (!tipo_imovel || !comodo_key) {
        return res.status(400).json({ error: 'tipo_imovel e comodo_key são obrigatórios.' });
      }

      const removido = await empresaComodoConfigModel.remover({
        empresa_id: req.usuario.empresa_id,
        tipo_imovel,
        comodo_key,
      });

      if (!removido) {
        return res.status(404).json({ error: 'Configuração não encontrada.' });
      }
      res.status(204).end();
    } catch (err) {
      console.error('Erro ao restaurar cômodo padrão:', err);
      res.status(500).json({ error: 'Erro ao restaurar nome padrão.' });
    }
  },
};
