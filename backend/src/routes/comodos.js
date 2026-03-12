import express from 'express';
import comodoVistoriaController from '../controllers/comodoVistoriaController.js';
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
router.get('/', comodoVistoriaController.listarComodos);

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
router.get('/:id', comodoVistoriaController.buscarComodoPorId);

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
 *     responses:
 *       201:
 *         description: Cômodo criado com sucesso.
 */
router.post('/', comodoVistoriaController.criarComodo);

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
router.put('/:id', comodoVistoriaController.atualizarComodo);

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
router.delete('/:id', comodoVistoriaController.deletarComodo);

export default router;
