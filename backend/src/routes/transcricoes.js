import express from 'express';
import transcricaoController from '../controllers/transcricaoController.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Transcricoes
 *   description: Endpoints relacionados a transcrições
 */

/**
 * @swagger
 * /transcricoes:
 *   get:
 *     tags:
 *       - Transcricoes
 *     summary: Listar transcrições
 *     responses:
 *       200:
 *         description: Lista de transcrições retornada com sucesso.
 */
router.get('/', transcricaoController.listarTranscricoes);

/**
 * @swagger
 * /transcricoes/{id}:
 *   get:
 *     tags:
 *       - Transcricoes
 *     summary: Buscar transcrição por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transcrição encontrada.
 *       404:
 *         description: Transcrição não encontrada.
 */
router.get('/:id', transcricaoController.buscarTranscricaoPorId);

/**
 * @swagger
 * /transcricoes:
 *   post:
 *     tags:
 *       - Transcricoes
 *     summary: Criar transcrição
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Transcrição criada com sucesso.
 */
router.post('/', transcricaoController.criarTranscricao);

/**
 * @swagger
 * /transcricoes/{id}:
 *   put:
 *     tags:
 *       - Transcricoes
 *     summary: Atualizar transcrição
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
 *         description: Transcrição atualizada.
 *       404:
 *         description: Transcrição não encontrada.
 */
router.put('/:id', transcricaoController.atualizarTranscricao);

/**
 * @swagger
 * /transcricoes/{id}:
 *   delete:
 *     tags:
 *       - Transcricoes
 *     summary: Excluir transcrição
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Transcrição excluída.
 *       404:
 *         description: Transcrição não encontrada.
 */
router.delete('/:id', transcricaoController.deletarTranscricao);

export default router;
