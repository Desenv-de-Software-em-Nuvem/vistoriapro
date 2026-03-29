const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresaController');
const { autenticar, autorizar } = require('../middlewares/auth');

// Criar empresa (apenas admin global ou superadmin, se existir)
router.post('/', autenticar, autorizar('admin'), empresaController.criarEmpresa);
// Listar empresas (apenas admin)
router.get('/', autenticar, autorizar('admin'), empresaController.listarEmpresas);
// Buscar empresa por ID (admin ou usuário da empresa)
router.get('/:id', autenticar, empresaController.buscarEmpresaPorId);
// Atualizar empresa (apenas admin)
router.put('/:id', autenticar, autorizar('admin'), empresaController.atualizarEmpresa);
// Deletar empresa (apenas admin)
router.delete('/:id', autenticar, autorizar('admin'), empresaController.deletarEmpresa);

module.exports = router;
