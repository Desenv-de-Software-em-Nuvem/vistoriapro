import express from 'express';
import locatarioVistoriaController from '../controllers/locatarioVistoriaController.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Locatarios
 *   description: Endpoints relacionados a locatários
 */

/**
 * @swagger
 * /locatarios:
 *   get:
 *     tags:
 *       - Locatarios
 *     summary: Listar locatários
 *     responses:
 *       200:
 *         description: Lista de locatários retornada com sucesso.
 */
router.get('/', locatarioVistoriaController.listarLocatarios);

/**
 * @swagger
 * /locatarios/{id}:
 *   get:
 *     tags:
 *       - Locatarios
 *     summary: Buscar locatário por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Locatário encontrado.
 *       404:
 *         description: Locatário não encontrado.
 */
router.get('/:id', locatarioVistoriaController.buscarLocatarioPorId);

/**
 * @swagger
 * /locatarios:
 *   post:
 *     tags:
 *       - Locatarios
 *     summary: Criar locatário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Locatário criado com sucesso.
 */
router.post('/', locatarioVistoriaController.criarLocatario);

/**
 * @swagger
 * /locatarios/{id}:
 *   put:
 *     tags:
 *       - Locatarios
 *     summary: Atualizar locatário
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
 *         description: Locatário atualizado.
 *       404:
 *         description: Locatário não encontrado.
 */
router.put('/:id', locatarioVistoriaController.atualizarLocatario);

/**
 * @swagger
 * /locatarios/{id}:
 *   delete:
 *     tags:
 *       - Locatarios
 *     summary: Excluir locatário
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Locatário excluído.
 *       404:
 *         description: Locatário não encontrado.
 */
router.delete('/:id', locatarioVistoriaController.deletarLocatario);

export default router;
