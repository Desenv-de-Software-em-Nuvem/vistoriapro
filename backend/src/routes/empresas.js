import express from 'express';
import empresaController from '../controllers/empresaController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
const router = express.Router();

// Documentação de rotas está no arquivo swagger.json
// Listar empresas
router.get('/', authenticateToken, requireRole('admin'), empresaController.listarEmpresas);
// Criar empresa
router.post('/', authenticateToken, requireRole('admin'), empresaController.criarEmpresa);

router.get('/:id', authenticateToken, requireRole('admin'), empresaController.buscarEmpresaPorId);

router.put('/:id', authenticateToken, requireRole('admin'), empresaController.atualizarEmpresa);

router.delete('/:id', authenticateToken, requireRole('admin'), empresaController.deletarEmpresa);

export default router;