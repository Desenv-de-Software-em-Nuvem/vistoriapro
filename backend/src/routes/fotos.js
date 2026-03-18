import express from 'express';
import fotoController from '../controllers/fotoController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
const router = express.Router();
// Documentação de rotas está no arquivo swagger.json
router.get('/', authenticateToken, fotoController.listarFotos);

router.get('/:id', authenticateToken, fotoController.buscarFotoPorId);

router.post('/', authenticateToken, requireRole('admin'), fotoController.criarFoto);

router.put('/:id', authenticateToken, requireRole('admin'), fotoController.atualizarFoto);

router.delete('/:id', authenticateToken, requireRole('admin'), fotoController.deletarFoto);

export default router;
