import express from 'express';
import imovelController from '../controllers/imovelController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
const router = express.Router();
// Documentação de rotas está no arquivo swagger.json
router.get('/', authenticateToken, imovelController.listarImoveis);

router.get('/:id', authenticateToken, imovelController.buscarImovelPorId);

router.post('/', authenticateToken, requireRole('admin'), imovelController.criarImovel);

router.put('/:id', authenticateToken, requireRole('admin'), imovelController.atualizarImovel);

router.delete('/:id', authenticateToken, requireRole('admin'), imovelController.deletarImovel);

export default router;