const express = require('express');
const router = express.Router();
const iaController = require('../controllers/iaController');
const { autenticar, autorizar } = require('../middlewares/auth');

router.post('/descrever-foto', autenticar, autorizar('admin', 'vistoriador'), iaController.descreverFoto);

module.exports = router;
