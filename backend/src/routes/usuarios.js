const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { autenticar, autorizar } = require('../middlewares/auth');

// Cadastro de usuário (apenas admin)
router.post('/', autenticar, autorizar('admin'), usuarioController.criarUsuario);
// Listar usuários (apenas admin)
router.get('/', autenticar, autorizar('admin'), usuarioController.listarUsuarios);
// Login
router.post('/login', usuarioController.login);
// Buscar usuário por ID (admin ou próprio usuário)
router.get('/:id', autenticar, usuarioController.buscarUsuarioPorId);
// Atualizar usuário (admin ou próprio usuário)
router.put('/:id', autenticar, usuarioController.atualizarUsuario);
// Deletar usuário (apenas admin)
router.delete('/:id', autenticar, autorizar('admin'), usuarioController.deletarUsuario);

module.exports = router;
