import { EmpresaRepository } from '../repositories/empresaRepository.js';

const empresaController = {
  async listarEmpresas(req, res) {
    try {
      const empresas = await EmpresaRepository.findAll();
      res.json(empresas);
    } catch (err) {
      console.error('Erro ao listar empresas:', err);
      res.status(500).json({ error: err.message });
    }
  },
  async criarEmpresa(req, res) {
    try {
      const empresa = await EmpresaRepository.create(req.body);
      res.status(201).json(empresa);
    } catch (err) {
      console.error('Erro ao criar empresa:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async buscarEmpresaPorId(req, res) {
    try {
      const { id } = req.params;
      const empresa = await EmpresaRepository.findById(id);

      if (!empresa) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      res.json(empresa);
    } catch (err) {
      console.error('Erro ao buscar empresa:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async atualizarEmpresa(req, res) {
    try {
      const { id } = req.params;
      const empresa = await EmpresaRepository.update(id, req.body);

      if (!empresa) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      res.json(empresa);
    } catch (err) {
      console.error('Erro ao atualizar empresa:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async deletarEmpresa(req, res) {
    try {
      const { id } = req.params;
      await EmpresaRepository.delete(id);
      res.status(204).send();
    } catch (err) {
      console.error('Erro ao deletar empresa:', err);
      res.status(500).json({ error: err.message });
    }
  },
};

export default empresaController;