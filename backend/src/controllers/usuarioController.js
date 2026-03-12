import { UsuarioRepository } from '../repositories/usuarioRepository.js';

const usuarioController = {
  async listarUsuarios(req, res) {
    try {
      const usuarios = await UsuarioRepository.findAll();
      res.json(usuarios);
    } catch (err) {
      console.error('Erro ao listar usuarios:', err);
      res.status(500).json({ error: err.message });
    }
  },
};

export default usuarioController;