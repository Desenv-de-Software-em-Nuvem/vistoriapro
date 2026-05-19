const express = require('express');
const router = express.Router();
const empresaComodoConfigController = require('../controllers/empresaComodoConfigController');
const { autenticar } = require('../middlewares/auth');

router.get('/', autenticar, empresaComodoConfigController.listar);
router.put('/', autenticar, empresaComodoConfigController.salvar);
router.delete('/', autenticar, empresaComodoConfigController.restaurarPadrao);

module.exports = router;
