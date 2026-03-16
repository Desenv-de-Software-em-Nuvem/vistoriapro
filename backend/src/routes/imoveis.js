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
 *     description: Retorna a lista de imóveis. Opcionalmente filtra por empresa.
 *     parameters:
 *       - in: query
 *         name: empresa_id
 *         schema:
 *           type: integer
 *         required: false
 *         description: Filtrar imóveis por empresa
 *     responses:
 *       200:
 *         description: Lista de imóveis retornada com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   empresa_id:
 *                     type: integer
 *                   nome:
 *                     type: string
 *                   endereco_completo:
 *                     type: string
 *                   unidade:
 *                     type: string
 *                   cidade:
 *                     type: string
 *                   uf:
 *                     type: string
 *                   cep:
 *                     type: string
 *                   tipo:
 *                     type: string
 *                   observacoes:
 *                     type: string
 *       500:
 *         description: Erro interno no servidor
 */
// Listar imóveis
router.get('/', imovelController.listarImoveis);

/**
 * @swagger
 * /imoveis/{id}:
 *   get:
 *     tags:
 *       - Imóveis
 *     summary: Buscar imóvel por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do imóvel
 *       - in: query
 *         name: empresa_id
 *         schema:
 *           type: integer
 *         required: false
 *         description: Filtrar por empresa
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
router.get('/:id', imovelController.buscarImovelPorId);

/**
 * @swagger
 * /imoveis:
 *   post:
 *     tags:
 *       - Imóveis
 *     summary: Criar imóvel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               empresa_id:
 *                 type: integer
 *               nome:
 *                 type: string
 *               endereco_completo:
 *                 type: string
 *               unidade:
 *                 type: string
 *               cidade:
 *                 type: string
 *               uf:
 *                 type: string
 *               cep:
 *                 type: string
 *               tipo:
 *                 type: string
 *               observacoes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Imóvel criado com sucesso.
 */
router.post('/', imovelController.criarImovel);

/**
 * @swagger
 * /imoveis/{id}:
 *   put:
 *     tags:
 *       - Imóveis
 *     summary: Atualizar imóvel
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
 *         description: Imóvel atualizado.
 *       404:
 *         description: Imóvel não encontrado.
 */
router.put('/:id', imovelController.atualizarImovel);

/**
 * @swagger
 * /imoveis/{id}:
 *   delete:
 *     tags:
 *       - Imóveis
 *     summary: Excluir imóvel
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Imóvel excluído.
 *       404:
 *         description: Imóvel não encontrado.
 */
router.delete('/:id', imovelController.deletarImovel);

export default router;