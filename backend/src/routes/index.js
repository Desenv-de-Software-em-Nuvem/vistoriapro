const express = require('express');
const router = express.Router();

// Adicionar rota padrão para /api
router.get('/', (req, res) => {
  res.status(200).json({ message: 'API do VistoriaPro está funcionando!' });
});

module.exports = router;
