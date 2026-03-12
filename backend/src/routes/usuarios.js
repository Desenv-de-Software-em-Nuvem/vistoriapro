import express from 'express';
import usuarioController from '../controllers/usuarioController.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Usuários
 *   description: Endpoints relacionados a usuários
 */

/**
 * @swagger
 * /usuarios:
 *   get:
 *     tags:
 *       - Usuários
 *     summary: Listar usuários
 *     description: Retorna a lista de todos os usuários cadastrados.
 *     responses:
 *       200:
 *         description: Lista de usuários retornada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 description: Usuário
 *       500:
 *         description: Erro interno no servidor
 */
// Listar usuarios
router.get('/', usuarioController.listarUsuarios);

export default router;