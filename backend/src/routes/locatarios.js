import express from 'express';
import locatarioVistoriaController from '../controllers/locatarioVistoriaController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
const router = express.Router();
// Documentação de rotas está no arquivo swagger.json
router.get('/', authenticateToken, locatarioVistoriaController.listarLocatarios);

router.get('/:id', authenticateToken, locatarioVistoriaController.buscarLocatarioPorId);

router.post('/', authenticateToken, requireRole('admin'), locatarioVistoriaController.criarLocatario);

router.put('/:id', authenticateToken, requireRole('admin'), locatarioVistoriaController.atualizarLocatario);

router.delete('/:id', authenticateToken, requireRole('admin'), locatarioVistoriaController.deletarLocatario);

export default router;
