const express = require('express');
const router = express.Router();
const locatarioVistoriaController = require('../controllers/locatarioVistoriaController');

// Criar locatário para uma vistoria
router.post('/', locatarioVistoriaController.criarLocatario);

// Listar locatários de uma vistoria
router.get('/vistoria/:vistoria_id', locatarioVistoriaController.listarPorVistoria);

// Atualizar locatário
router.put('/:id', locatarioVistoriaController.atualizarLocatario);

// Deletar locatário
router.delete('/:id', locatarioVistoriaController.deletarLocatario);

// Buscar locatário por id
router.get('/:id', locatarioVistoriaController.buscarPorId);

module.exports = router;
