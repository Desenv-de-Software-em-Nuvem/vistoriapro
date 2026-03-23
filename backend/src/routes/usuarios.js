import express from 'express';
import usuarioController from '../controllers/usuarioController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
const router = express.Router();
// Documentação de rotas está no arquivo swagger.json

router.get('/:id', authenticateToken, async (req, res, next) => {
  const { id } = req.params;
  // Permite se for o próprio usuário ou admin
  if (req.user.id !== parseInt(id) && req.user.papel !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  // Chama o controller diretamente
  return usuarioController.obterUsuario(req, res);
});

router.post('/', authenticateToken, requireRole('admin'), usuarioController.criarUsuario);

router.put('/:id', authenticateToken, async (req, res, next) => {
  const { id } = req.params;
  if (req.user.id !== parseInt(id) && req.user.papel !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  // Chama o controller diretamente
  return usuarioController.atualizarUsuario(req, res);
});

router.delete('/:id', authenticateToken, requireRole('admin'), usuarioController.deletarUsuario);

router.post('/auth/login', usuarioController.autenticar);

router.get('/auth/perfil', authenticateToken, usuarioController.obterPerfil);

export default router;