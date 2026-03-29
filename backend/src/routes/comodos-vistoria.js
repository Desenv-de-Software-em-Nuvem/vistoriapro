const express = require('express');
const router = express.Router();
const comodoVistoriaController = require('../controllers/comodoVistoriaController');
const { autenticar, autorizar } = require('../middlewares/auth');

// Criar cômodo de vistoria
router.post('/', autenticar, autorizar('admin', 'vistoriador'), comodoVistoriaController.criarComodo);
// Listar cômodos por vistoria
router.get('/vistoria/:vistoria_id', autenticar, autorizar('admin', 'vistoriador'), comodoVistoriaController.listarPorVistoria);
// Buscar cômodo por id
router.get('/:id', autenticar, autorizar('admin', 'vistoriador'), comodoVistoriaController.buscarPorId);
// Deletar cômodo
router.delete('/:id', autenticar, autorizar('admin', 'vistoriador'), comodoVistoriaController.deletar);

module.exports = router;
