import express from 'express';
import vistoriaController from '../controllers/vistoriaController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
const router = express.Router();
// Documentação de rotas está no arquivo swagger.json
router.get('/', authenticateToken, vistoriaController.listarVistorias);

router.get('/:id', authenticateToken, vistoriaController.buscarVistoriaPorId);

router.post('/', authenticateToken, requireRole('admin'), vistoriaController.criarVistoria);

router.put('/:id', authenticateToken, requireRole('admin'), vistoriaController.atualizarVistoria);

router.delete('/:id', authenticateToken, requireRole('admin'), vistoriaController.deletarVistoria);

export default router;
