const express = require('express');
const router = express.Router();

// Importar e usar rotas de cada módulo

router.use('/usuarios', require('./usuarios'));
router.use('/empresas', require('./empresas'));
router.use('/imoveis', require('./imoveis'));
router.use('/vistorias', require('./vistorias'));
router.use('/fotos', require('./fotos'));
router.use('/transcricoes', require('./transcricoes'));

router.use('/relatorios', require('./relatorios'));
router.use('/locatarios-vistoria', require('./locatariosVistoria'));
router.use('/comodos-vistoria', require('./comodos-vistoria'));

// Adicionar rota padrão para /api
router.get('/', (req, res) => {
  res.status(200).json({ message: 'API do VistoriaPro está funcionando!' });
});

module.exports = router;
