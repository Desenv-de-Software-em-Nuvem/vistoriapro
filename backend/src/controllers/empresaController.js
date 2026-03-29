const empresaModel = require('../models/empresaModel');

module.exports = {
  async criarEmpresa(req, res) {
    try {
      const { nome, cnpj, email } = req.body;
      if (!nome || !cnpj || !email) {
        return res.status(400).json({ error: 'Dados obrigatórios não informados.' });
      }
      const empresa = await empresaModel.criar({ nome, cnpj, email });
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
    // ... lógica para buscar empresa por ID
    res.json({});
  },
  async atualizarEmpresa(req, res) {
    // ... lógica para atualizar empresa
    res.json({ message: 'Empresa atualizada' });
  },
  async deletarEmpresa(req, res) {
    // ... lógica para deletar empresa
    res.json({ message: 'Empresa deletada' });
  },
};
