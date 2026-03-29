const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');
const { autenticar, autorizar } = require('../middlewares/auth');

// Gerar relatório PDF (admin ou vistoriador)
router.post('/gerar', autenticar, autorizar('admin', 'vistoriador'), relatorioController.gerarRelatorio);
// Listar relatórios de uma vistoria
router.get('/vistoria/:vistoriaId', autenticar, autorizar('admin', 'vistoriador'), relatorioController.listarRelatoriosPorVistoria);
// Download de relatório
router.get('/:id/download', autenticar, autorizar('admin', 'vistoriador'), relatorioController.downloadRelatorio);
// Deletar relatório (admin)
router.delete('/:id', autenticar, autorizar('admin'), relatorioController.deletarRelatorio);
// Listar todos os relatórios (admin ou vistoriador)
router.get('/', autenticar, autorizar('admin', 'vistoriador'), relatorioController.listarRelatorios);

module.exports = router;
