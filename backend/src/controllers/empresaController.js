const empresaModel = require('../models/empresaModel');

const CAMPOS_EMPRESA = [
  'nome',
  'cnpj',
  'email',
  'telefone',
  'whatsapp',
  'endereco',
  'site',
  'instagram',
  'responsavel_nome',
  'creci',
  'logo_url'
];

function montarDadosEmpresa(body) {
  return CAMPOS_EMPRESA.reduce((dados, campo) => {
    if (Object.prototype.hasOwnProperty.call(body, campo)) {
      dados[campo] = body[campo];
    }

    return dados;
  }, {});
}

function podeAcessarEmpresa(req, empresaId) {
  return req.usuario?.papel === 'admin' || String(req.usuario?.empresa_id) === String(empresaId);
}

function textoInformado(value) {
  return String(value || '').trim();
}

module.exports = {
  async criarEmpresa(req, res) {
    try {
      const dados = montarDadosEmpresa(req.body);
      const { nome, cnpj, email } = dados;

      if (!textoInformado(nome) || !textoInformado(cnpj) || !textoInformado(email)) {
        return res.status(400).json({ error: 'Dados obrigatorios nao informados.' });
      }

      const empresa = await empresaModel.criar(dados);
      res.status(201).json({ message: 'Empresa criada', empresa });
    } catch (err) {
      console.error('Erro ao criar empresa:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async listarEmpresas(req, res) {
    try {
      const empresas = await empresaModel.listarTodas();
      res.json(empresas);
    } catch (err) {
      console.error('Erro ao listar empresas:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async buscarEmpresaPorId(req, res) {
    try {
      const { id } = req.params;
      if (!podeAcessarEmpresa(req, id)) {
        return res.status(403).json({ error: 'Acesso negado.' });
      }

      const empresa = await empresaModel.buscarPorId(id);
      if (!empresa) return res.status(404).json({ error: 'Empresa nao encontrada.' });

      res.json(empresa);
    } catch (err) {
      console.error('Erro ao buscar empresa:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async atualizarEmpresa(req, res) {
    try {
      const empresa = await empresaModel.atualizar(req.params.id, montarDadosEmpresa(req.body));
      if (!empresa) return res.status(404).json({ error: 'Empresa nao encontrada.' });

      res.json({ message: 'Empresa atualizada', empresa });
    } catch (err) {
      console.error('Erro ao atualizar empresa:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async deletarEmpresa(req, res) {
    try {
      const deletada = await empresaModel.deletar(req.params.id);
      if (!deletada) return res.status(404).json({ error: 'Empresa nao encontrada.' });

      res.json({ message: 'Empresa deletada' });
    } catch (err) {
      console.error('Erro ao deletar empresa:', err);
      res.status(500).json({ error: err.message });
    }
  },
};
