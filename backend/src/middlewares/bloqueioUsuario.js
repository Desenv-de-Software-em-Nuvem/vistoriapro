const usuarioModel = require('../models/usuarioModel');

// Middleware para bloquear usuário
async function bloquearUsuario(req, res, next) {
  try {
    const usuarioId = req.usuario.id;
    const usuario = await usuarioModel.buscarPorIdCompleto(usuarioId);
    if (!usuario) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }
    if (usuario.bloqueado) {
      return res.status(403).json({ error: 'Usuário bloqueado. Não é permitido criar vistorias.' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao verificar bloqueio de usuário.' });
  }
}

module.exports = { bloquearUsuario };
