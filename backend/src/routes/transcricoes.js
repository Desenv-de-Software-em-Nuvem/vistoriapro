const express = require('express');
const router = express.Router();
const transcricaoController = require('../controllers/transcricaoController');
const { autenticar, autorizar } = require('../middlewares/auth');

// Upload de transcrição (admin ou vistoriador)
router.post('/upload', autenticar, autorizar('admin', 'vistoriador'), transcricaoController.uploadTranscricao);
// Listar transcrições de uma vistoria
router.get('/vistoria/:vistoriaId', autenticar, autorizar('admin', 'vistoriador'), transcricaoController.listarTranscricoesPorVistoria);
// Download de áudio
router.get('/:id/download', autenticar, autorizar('admin', 'vistoriador'), transcricaoController.downloadAudio);
// Deletar transcrição (admin ou vistoriador)
router.delete('/:id', autenticar, autorizar('admin', 'vistoriador'), transcricaoController.deletarTranscricao);

module.exports = router;
