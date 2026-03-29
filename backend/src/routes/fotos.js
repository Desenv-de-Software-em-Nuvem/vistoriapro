const express = require('express');
const router = express.Router();
const fotoController = require('../controllers/fotoController');
const upload = require('../middlewares/multerFoto');
const { autenticar, autorizar } = require('../middlewares/auth');

// Cadastro de foto (admin ou vistoriador)
// Upload de foto com suporte a multipart/form-data (campo 'foto')
router.post('/',
  autenticar,
  autorizar('admin', 'vistoriador'),
  upload.single('foto'),
  fotoController.uploadFoto
);
// Listar fotos (todas ou por vistoria)
router.get('/', autenticar, autorizar('admin', 'vistoriador'), fotoController.listarFotos);
// Download de foto
router.get('/:id/download', autenticar, autorizar('admin', 'vistoriador'), fotoController.downloadFoto);
// Deletar foto (admin ou vistoriador)
router.delete('/:id', autenticar, autorizar('admin', 'vistoriador'), fotoController.deletarFoto);

module.exports = router;
