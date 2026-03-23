import { UsuarioRepository } from '../repositories/usuarioRepository.js';
import { generateToken } from '../middlewares/auth.js';

const usuarioController = {
  async obterUsuario(req, res) {
    try {
      const { id } = req.params;
      const usuario = await UsuarioRepository.findById(parseInt(id));

      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const { senha_hash: _, ...usuarioSemSenha } = usuario;
      res.json(usuarioSemSenha);
    } catch (err) {
      console.error('Erro ao obter usuario:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async listarUsuarios(req, res) {
    try {
      const usuarios = await UsuarioRepository.findAll();
      res.json(usuarios);
    } catch (err) {
      console.error('Erro ao listar usuarios:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async obterPerfil(req, res) {
    try {
      // req.user é definido pelo middleware de autenticação
      const usuario = await UsuarioRepository.findById(req.user.id);
      
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      // Remove a senha do response
      const { senha_hash: _, ...usuarioSemSenha } = usuario;
      
      res.json({
        message: 'Perfil obtido com sucesso',
        usuario: usuarioSemSenha
      });
    } catch (err) {
      console.error('Erro ao obter perfil:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async criarUsuario(req, res) {
    try {
      const { nome, email, senha_hash, papel, empresa_id } = req.body;

      if (!nome || !email || !senha_hash) {
        return res.status(400).json({ 
          error: 'Nome, email e senha são obrigatórios' 
        });
      }

      const novoUsuario = await UsuarioRepository.create({
        nome,
        email,
        senha_hash,
        papel: papel || 'vistoriador',
        empresa_id,
      });

      // Remove a senha do response
      const { senha_hash: _, ...usuarioSemSenha } = novoUsuario;
      
      res.status(201).json(usuarioSemSenha);
    } catch (err) {
      console.error('Erro ao criar usuario:', err);
      
      if (err.message.includes('duplicate key')) {
        return res.status(409).json({ error: 'Email já cadastrado' });
      }
      
      res.status(500).json({ error: err.message });
    }
  },

  async atualizarUsuario(req, res) {
    try {
      const { id } = req.params;
      const { nome, email, senha_hash, papel } = req.body;

      const usuario = await UsuarioRepository.findById(id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const dadosAtualizados = {};
      if (nome) dadosAtualizados.nome = nome;
      if (email) dadosAtualizados.email = email;
      if (senha_hash) dadosAtualizados.senha_hash = senha_hash;
      if (papel) dadosAtualizados.papel = papel;

      const usuarioAtualizado = await UsuarioRepository.update(id, dadosAtualizados);
      
      // Remove a senha do response
      const { senha_hash: _, ...usuarioSemSenha } = usuarioAtualizado;
      
      res.json(usuarioSemSenha);
    } catch (err) {
      console.error('Erro ao atualizar usuario:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async deletarUsuario(req, res) {
    try {
      const { id } = req.params;
      
      const usuario = await UsuarioRepository.findById(id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      await UsuarioRepository.delete(id);
      res.status(204).send();
    } catch (err) {
      console.error('Erro ao deletar usuario:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async autenticar(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email e senha são obrigatórios' 
        });
      }

      const usuario = await UsuarioRepository.validateCredentials(email, password);
      
      if (!usuario) {
        return res.status(401).json({ error: 'Email ou senha inválidos' });
      }

      // Gera token JWT
      const token = generateToken(usuario);
      
      // if (process.env.NODE_ENV === 'development') {
      // // Remove a senha do response
      // const { senha_hash: _, ...usuarioSemSenha } = usuario;
      // }
      
      res.json({
        message: 'Autenticação bem-sucedida',
        token: token,
        // usuario: usuarioSemSenha || null,
        expiresIn: '24h'
      });
    } catch (err) {
      console.error('Erro ao autenticar usuario:', err);
      res.status(500).json({ error: err.message });
    }
  },
};

export default usuarioController;