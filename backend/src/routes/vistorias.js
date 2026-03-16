import express from 'express';
import vistoriaController from '../controllers/vistoriaController.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Vistorias
 *   description: Endpoints relacionados a vistorias
 */

/**
 * @swagger
 * /vistorias:
 *   get:
 *     tags:
 *       - Vistorias
 *     summary: Listar vistorias
 *     responses:
 *       200:
 *         description: Lista de vistorias retornada com sucesso.
 */
router.get('/', vistoriaController.listarVistorias);

/**
 * @swagger
 * /vistorias/{id}:
 *   get:
 *     tags:
 *       - Vistorias
 *     summary: Buscar vistoria por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vistoria encontrada.
 *       404:
 *         description: Vistoria não encontrada.
 */
router.get('/:id', vistoriaController.buscarVistoriaPorId);

/**
 * @swagger
 * /vistorias:
 *   post:
 *     tags:
 *       - Vistorias
 *     summary: Criar vistoria
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               empresa_id:
 *                 type: integer
 *               usuario_id:
 *                 type: integer
 *               imovel_id:
 *                 type: integer
 *               data:
 *                 type: string
 *                 format: date-time
 *               obs:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vistoria criada com sucesso.
 */
router.post('/', vistoriaController.criarVistoria);

/**
 * @swagger
 * /vistorias/{id}:
 *   put:
 *     tags:
 *       - Vistorias
 *     summary: Atualizar vistoria
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
 *         description: Vistoria atualizada.
 *       404:
 *         description: Vistoria não encontrada.
 */
router.put('/:id', vistoriaController.atualizarVistoria);

/**
 * @swagger
 * /vistorias/{id}:
 *   delete:
 *     tags:
 *       - Vistorias
 *     summary: Excluir vistoria
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Vistoria excluída.
 *       404:
 *         description: Vistoria não encontrada.
 */
router.delete('/:id', vistoriaController.deletarVistoria);

export default router;
