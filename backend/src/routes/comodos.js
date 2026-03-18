import express from 'express';
import comodoVistoriaController from '../controllers/comodoVistoriaController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
const router = express.Router();
// Documentação de rotas está no arquivo swagger.json
router.get('/', authenticateToken, comodoVistoriaController.listarComodos);

router.get('/:id', authenticateToken, comodoVistoriaController.buscarComodoPorId);

router.post('/', authenticateToken, requireRole('admin'), comodoVistoriaController.criarComodo);

router.put('/:id', authenticateToken, requireRole('admin'), comodoVistoriaController.atualizarComodo);

router.delete('/:id', authenticateToken, requireRole('admin'), comodoVistoriaController.deletarComodo);

export default router;
