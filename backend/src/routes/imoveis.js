import express from 'express';
import imovelController from '../controllers/imovelController.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Imóveis
 *   description: Endpoints relacionados a imóveis
 */

/**
 * @swagger
 * /imoveis:
 *   get:
 *     tags:
 *       - Imóveis
 *     summary: Listar imóveis
 *     description: Retorna a lista de todos os imóveis.
 *     responses:
 *       200:
 *         description: Lista de imóveis retornada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Erro interno no servidor
 */
// Listar imóveis
router.get('/', imovelController.listarImoveis);

/**
 * @swagger
 * /imoveis/{id}/{empresa_id}:
 *   get:
 *     tags:
 *       - Imóveis
 *     summary: Buscar imóvel por ID
 *     description: Retorna informações de um imóvel específico de uma empresa.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do imóvel
 *       - in: path
 *         name: empresa_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID da empresa à qual o imóvel pertence
 *     responses:
 *       200:
 *         description: Imóvel encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Imóvel não encontrado
 *       500:
 *         description: Erro interno no servidor
 */
router.get('/:id/:empresa_id', imovelController.buscarImovelPorId);

export default router;