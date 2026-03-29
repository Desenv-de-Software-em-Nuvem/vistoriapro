const express = require('express');
const router = express.Router();
const vistoriaController = require('../controllers/vistoriaController');
const { autenticar, autorizar } = require('../middlewares/auth');

// Criar vistoria (admin ou vistoriador)
const { bloquearUsuario } = require('../middlewares/bloqueioUsuario');
router.post('/', autenticar, autorizar('admin', 'vistoriador'), bloquearUsuario, vistoriaController.criarVistoria);
// Listar vistorias da empresa (admin ou vistoriador)
router.get('/', autenticar, autorizar('admin', 'vistoriador'), vistoriaController.listarVistorias);
// Rota alternativa para atualizar status (usando GET para contornar possíveis problemas com PUT)
router.get('/atualizar-status/:id', autenticar, autorizar('admin', 'vistoriador'), vistoriaController.atualizarStatusVistoria);

// Buscar vistoria por ID (admin ou vistoriador)
router.get('/:id', autenticar, autorizar('admin', 'vistoriador'), vistoriaController.buscarVistoriaPorId);
// Atualizar vistoria (admin ou vistoriador)
router.put('/:id', autenticar, autorizar('admin', 'vistoriador'), vistoriaController.atualizarVistoria);
// Deletar vistoria (apenas admin)
router.delete('/:id', autenticar, autorizar('admin'), vistoriaController.deletarVistoria);

module.exports = router;
