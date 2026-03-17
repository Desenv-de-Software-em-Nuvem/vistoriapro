import express from 'express';
import locatarioVistoriaController from '../controllers/locatarioVistoriaController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
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
router.get('/', authenticateToken, locatarioVistoriaController.listarLocatarios);

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
router.get('/:id', authenticateToken, locatarioVistoriaController.buscarLocatarioPorId);

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
 *             properties:
 *               vistoria_id:
 *                 type: integer
 *               nome:
 *                 type: string
 *               nacionalidade:
 *                 type: string
 *               profissao:
 *                 type: string
 *               cpf:
 *                 type: string
 *               rg:
 *                 type: string
 *               rg_orgao:
 *                 type: string
 *               rg_uf:
 *                 type: string
 *               endereco:
 *                 type: string
 *     responses:
 *       201:
 *         description: Locatário criado com sucesso.
 */
router.post('/', authenticateToken, requireRole('admin'), locatarioVistoriaController.criarLocatario);

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
router.put('/:id', authenticateToken, requireRole('admin'), locatarioVistoriaController.atualizarLocatario);

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
router.delete('/:id', authenticateToken, requireRole('admin'), locatarioVistoriaController.deletarLocatario);

export default router;
