import express from 'express';
import empresaController from '../controllers/empresaController.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Empresas
 *   description: Endpoints relacionados a empresas
 */

/**
 * @swagger
 * /empresas:
 *   get:
 *     tags:
 *       - Empresas
 *     summary: Listar empresas (exemplo)
 *     description: Retorna uma mensagem de funcionamento do endpoint de empresas.
 *     responses:
 *       200:
 *         description: Sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Empresas endpoint funcionando!
 */
// Listar empresas
router.get('/', empresaController.listarEmpresas);
// Criar empresa
router.post('/', empresaController.criarEmpresa);

export default router;