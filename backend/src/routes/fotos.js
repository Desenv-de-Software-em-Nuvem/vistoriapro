import express from 'express';
import fotoController from '../controllers/fotoController.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Fotos
 *   description: Endpoints relacionados a fotos
 */

/**
 * @swagger
 * /fotos:
 *   get:
 *     tags:
 *       - Fotos
 *     summary: Listar fotos
 *     responses:
 *       200:
 *         description: Lista de fotos retornada com sucesso.
 */
router.get('/', fotoController.listarFotos);

/**
 * @swagger
 * /fotos/{id}:
 *   get:
 *     tags:
 *       - Fotos
 *     summary: Buscar foto por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Foto encontrada.
 *       404:
 *         description: Foto não encontrada.
 */
router.get('/:id', fotoController.buscarFotoPorId);

/**
 * @swagger
 * /fotos:
 *   post:
 *     tags:
 *       - Fotos
 *     summary: Criar foto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Foto criada com sucesso.
 */
router.post('/', fotoController.criarFoto);

/**
 * @swagger
 * /fotos/{id}:
 *   put:
 *     tags:
 *       - Fotos
 *     summary: Atualizar foto
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
 *         description: Foto atualizada.
 *       404:
 *         description: Foto não encontrada.
 */
router.put('/:id', fotoController.atualizarFoto);

/**
 * @swagger
 * /fotos/{id}:
 *   delete:
 *     tags:
 *       - Fotos
 *     summary: Excluir foto
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Foto excluída.
 *       404:
 *         description: Foto não encontrada.
 */
router.delete('/:id', fotoController.deletarFoto);

export default router;
