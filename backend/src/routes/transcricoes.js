import express from 'express';
import transcricaoController from '../controllers/transcricaoController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
const router = express.Router();
// Documentação de rotas está no arquivo swagger.json
router.get('/', authenticateToken, transcricaoController.listarTranscricoes);

router.get('/:id', authenticateToken, transcricaoController.buscarTranscricaoPorId);

router.post('/', authenticateToken, requireRole('admin'), transcricaoController.criarTranscricao);

router.put('/:id', authenticateToken, requireRole('admin'), transcricaoController.atualizarTranscricao);

router.delete('/:id', authenticateToken, requireRole('admin'), transcricaoController.deletarTranscricao);

export default router;
