import express from 'express';
const router = express.Router();


// Listar empresas
router.get('/', (req, res) => {
  res.json({ 
    message: 'Empresas endpoint funcionando!',
  });
});

export default router;