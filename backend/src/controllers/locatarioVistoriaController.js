const locatarioVistoriaModel = require('../models/locatarioVistoriaModel');
const vistoriaModel = require('../models/vistoriaModel');

module.exports = {
  async criarLocatario(req, res) {
    try {
      const { vistoria_id } = req.body;
      if (!vistoria_id) {
        return res.status(400).json({ error: 'vistoria_id é obrigatório.' });
      }

      const vistoria = await vistoriaModel.buscarPorId(vistoria_id, req.usuario.empresa_id);
      if (!vistoria) {
        return res.status(404).json({ error: 'Vistoria não encontrada' });
      }

      const locatario = await locatarioVistoriaModel.criar(req.body);
      res.status(201).json(locatario);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async listarPorVistoria(req, res) {
    try {
      const { vistoria_id } = req.params;
      const locatarios = await locatarioVistoriaModel.listarPorVistoria(vistoria_id, req.usuario.empresa_id);
      res.json(locatarios);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async atualizarLocatario(req, res) {
    try {
      const { id } = req.params;
      const camposValidos = ['nome', 'nacionalidade', 'profissao', 'cpf', 'rg', 'rg_orgao', 'rg_uf', 'endereco'];
      const dados = {};
      for (const key of camposValidos) {
        if (req.body[key] !== undefined) {
          dados[key] = req.body[key];
        }
      }

      const locatario = await locatarioVistoriaModel.atualizar(id, req.usuario.empresa_id, dados);
      if (!locatario) return res.status(404).json({ error: 'Locatário não encontrado' });
      res.json(locatario);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async deletarLocatario(req, res) {
    try {
      const { id } = req.params;
      const deletado = await locatarioVistoriaModel.deletar(id, req.usuario.empresa_id);
      if (!deletado) return res.status(404).json({ error: 'Locatário não encontrado' });
      res.json({ message: 'Locatário removido' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const locatario = await locatarioVistoriaModel.buscarPorId(id, req.usuario.empresa_id);
      if (!locatario) return res.status(404).json({ error: 'Locatário não encontrado' });
      res.json(locatario);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
