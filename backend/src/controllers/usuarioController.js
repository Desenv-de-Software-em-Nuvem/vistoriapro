const usuarioModel = require('../models/usuarioModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'vistoriapro_secret';

// Controller de Usuários
module.exports = {
  async criarUsuario(req, res) {
    try {
      const { empresa_id, nome, email, senha, papel } = req.body;
      if (!empresa_id || !nome || !email || !senha || !papel) {
        return res.status(400).json({ error: 'Dados obrigatórios não informados.' });
      }
      // Apenas admin pode criar usuário (validação extra pode ser feita no middleware)
      const senha_hash = await bcrypt.hash(senha, 10);
      const usuario = await usuarioModel.criar({ empresa_id, nome, email, senha_hash, papel });
      res.status(201).json({ message: 'Usuário criado', usuario });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async listarUsuarios(req, res) {
    try {
      const usuarios = await usuarioModel.listarTodos();
      // Adiciona permitidoVistoria para cada usuário
      const usuariosFormatados = usuarios.map(u => ({
        ...u,
        permitidoVistoria: !u.bloqueado
      }));
      res.json(usuariosFormatados);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async login(req, res) {
    try {
      const { email, senha } = req.body;
      if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha obrigatórios.' });
      }
      const usuario = await usuarioModel.buscarPorEmail(email);
      if (!usuario) {
        return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
      }
      const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
      if (!senhaValida) {
        return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
      }
      const token = jwt.sign({ id: usuario.id, papel: usuario.papel, empresa_id: usuario.empresa_id }, JWT_SECRET, { expiresIn: '8h' });
      res.json({
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          papel: usuario.papel,
          empresa_id: usuario.empresa_id,
          permitidoVistoria: !usuario.bloqueado
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async buscarUsuarioPorId(req, res) {
    try {
      const { id } = req.params;
      const usuario = await usuarioModel.buscarPorId(id);
      if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });
      // Adiciona permitidoVistoria
      res.json({
        ...usuario,
        permitidoVistoria: !usuario.bloqueado
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async atualizarUsuario(req, res) {
    try {
      const { id } = req.params;
      const dados = req.body;
      if (dados.senha) {
        dados.senha_hash = await bcrypt.hash(dados.senha, 10);
        delete dados.senha;
      }
      // Se vier permitidoVistoria, converte para bloqueado
      if (typeof dados.permitidoVistoria !== 'undefined') {
        dados.bloqueado = !dados.permitidoVistoria;
        delete dados.permitidoVistoria;
      }
      const usuario = await usuarioModel.atualizar(id, dados);
      res.json({
        message: 'Usuário atualizado',
        usuario: {
          ...usuario,
          permitidoVistoria: !usuario.bloqueado
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async deletarUsuario(req, res) {
    try {
      const { id } = req.params;
      await usuarioModel.deletar(id);
      res.json({ message: 'Usuário deletado' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
