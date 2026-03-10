const empresaModel = require('../models/empresaModel');

module.exports = {
      async listarEmpresas(req, res) {
    try {
      const empresas = await empresaModel.listarTodas();
      res.json(empresas);
    } catch (err) {
      console.error('Erro ao listar empresas:', err);
      res.status(500).json({ error: err.message });
    }
  },

};