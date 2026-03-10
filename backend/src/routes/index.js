import express from 'express';
import empresasRouter from './empresas.js';
const router = express.Router();

router.use('/empresas', empresasRouter);



// Adicionar rota padrão para /api
router.get('/', (req, res) => {
  res.status(200).json({ message: 'API do VistoriaPro está funcionando!' });
});

// module.exports = router;
export default router;

