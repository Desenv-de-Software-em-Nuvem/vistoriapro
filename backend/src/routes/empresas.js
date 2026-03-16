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

/**
 * @swagger
 * /empresas/{id}:
 *   get:
 *     tags:
 *       - Empresas
 *     summary: Buscar empresa por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Empresa encontrada.
 *       404:
 *         description: Empresa não encontrada.
 */
router.get('/:id', empresaController.buscarEmpresaPorId);

/**
 * @swagger
 * /empresas/{id}:
 *   put:
 *     tags:
 *       - Empresas
 *     summary: Atualizar empresa
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
 *         description: Empresa atualizada.
 *       404:
 *         description: Empresa não encontrada.
 */
router.put('/:id', empresaController.atualizarEmpresa);

/**
 * @swagger
 * /empresas/{id}:
 *   delete:
 *     tags:
 *       - Empresas
 *     summary: Excluir empresa
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Empresa excluída.
 *       404:
 *         description: Empresa não encontrada.
 */
router.delete('/:id', empresaController.deletarEmpresa);

export default router;