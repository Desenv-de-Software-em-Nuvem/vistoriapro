import empresaModel from '../models/empresaModel.js';

const empresaController = {
  async listarEmpresas(req, res) {
    try {
      const empresas = await empresaModel.listarTodas();
      res.json(empresas);
    } catch (err) {
      console.error('Erro ao listar empresas:', err);
      res.status(500).json({ error: err.message });
    }
  },
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


};

export default empresaController;