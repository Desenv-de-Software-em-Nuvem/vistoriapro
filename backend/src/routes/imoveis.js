const express = require('express');
const router = express.Router();
const imovelController = require('../controllers/imovelController');
const { autenticar, autorizar } = require('../middlewares/auth');

// Todas as rotas de imóveis precisam de autenticação
router.use(autenticar);

// Buscar imóveis por endereço (query parameter)
router.get('/buscar', imovelController.buscarImovelPorEndereco);

// Listar todos os imóveis da empresa
router.get('/', imovelController.listarImoveis);

// Criar novo imóvel
router.post('/', imovelController.criarImovel);

// Buscar imóvel por ID
router.get('/:id', imovelController.buscarImovelPorId);

// Atualizar imóvel
router.put('/:id', imovelController.atualizarImovel);

// Deletar imóvel (apenas admin)
router.delete('/:id', autorizar('admin'), imovelController.deletarImovel);

module.exports = router;
