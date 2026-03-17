import express from 'express';
import comodoVistoriaController from '../controllers/comodoVistoriaController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comodos
 *   description: Endpoints relacionados a cômodos de vistoria
 */

/**
 * @swagger
 * /comodos:
 *   get:
 *     tags:
 *       - Comodos
 *     summary: Listar cômodos
 *     responses:
 *       200:
 *         description: Lista de cômodos retornada com sucesso.
 */
router.get('/', authenticateToken, comodoVistoriaController.listarComodos);

/**
 * @swagger
 * /comodos/{id}:
 *   get:
 *     tags:
 *       - Comodos
 *     summary: Buscar cômodo por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cômodo encontrado.
 *       404:
 *         description: Cômodo não encontrado.
 */
router.get('/:id', authenticateToken, comodoVistoriaController.buscarComodoPorId);

/**
 * @swagger
 * /comodos:
 *   post:
 *     tags:
 *       - Comodos
 *     summary: Criar cômodo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vistoria_id:
 *                 type: integer
 *               nome:
 *                 type: string
 *               observacoes:
 *                 type: string
 *               estado_geral:
 *                 type: string
 *                 enum:
 *                   - Bom
 *                   - Regular
 *                   - Ruim
 *     responses:
 *       201:
 *         description: Cômodo criado com sucesso.
 */
router.post('/', authenticateToken, requireRole('admin'), comodoVistoriaController.criarComodo);

/**
 * @swagger
 * /comodos/{id}:
 *   put:
 *     tags:
 *       - Comodos
 *     summary: Atualizar cômodo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cômodo atualizado.
 *       404:
 *         description: Cômodo não encontrado.
 */
router.put('/:id', authenticateToken, requireRole('admin'), comodoVistoriaController.atualizarComodo);

/**
 * @swagger
 * /comodos/{id}:
 *   delete:
 *     tags:
 *       - Comodos
 *     summary: Excluir cômodo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Cômodo excluído.
 *       404:
 *         description: Cômodo não encontrado.
 */
router.delete('/:id', authenticateToken, requireRole('admin'), comodoVistoriaController.deletarComodo);

export default router;
