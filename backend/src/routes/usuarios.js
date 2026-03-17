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
router.get('/', usuarioController.listarUsuarios);

/**
 * @swagger
 * /usuarios/{id}:
 *   get:
 *     tags:
 *       - Usuários
 *     summary: Obter usuário por ID
 *     description: Retorna um usuário específico pelo ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno no servidor
 */
router.get('/:id', usuarioController.obterUsuario);

/**
 * @swagger
 * /usuarios:
 *   post:
 *     tags:
 *       - Usuários
 *     summary: Criar novo usuário
 *     description: Cria um novo usuário com a senha criptografada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - email
 *               - senha_hash
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               senha_hash:
 *                 type: string
 *                 description: Senha em texto plano (será criptografada)
 *               papel:
 *                 type: string
 *                 enum: [admin, vistoriador, cliente]
 *               empresa_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados obrigatórios faltando
 *       409:
 *         description: Email já cadastrado
 *       500:
 *         description: Erro interno no servidor
 */
router.post('/', usuarioController.criarUsuario);

/**
 * @swagger
 * /usuarios/{id}:
 *   put:
 *     tags:
 *       - Usuários
 *     summary: Atualizar usuário
 *     description: Atualiza um usuário existente (a senha será criptografada se fornecida)
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
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               senha_hash:
 *                 type: string
 *                 description: Senha em texto plano (será criptografada)
 *               papel:
 *                 type: string
 *                 enum: [admin, vistoriador, cliente]
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno no servidor
 */
router.put('/:id', usuarioController.atualizarUsuario);

/**
 * @swagger
 * /usuarios/{id}:
 *   delete:
 *     tags:
 *       - Usuários
 *     summary: Deletar usuário
 *     description: Remove um usuário do sistema
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Usuário deletado com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno no servidor
 */
router.delete('/:id', usuarioController.deletarUsuario);

/**
 * @swagger
 * /usuarios/auth/login:
 *   post:
 *     tags:
 *       - Usuários
 *     summary: Autenticar usuário
 *     description: Valida as credenciais do usuário e retorna os dados se válido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 description: Senha em texto plano
 *     responses:
 *       200:
 *         description: Autenticação bem-sucedida
 *       400:
 *         description: Email e senha obrigatórios
 *       401:
 *         description: Email ou senha inválidos
 *       500:
 *         description: Erro interno no servidor
 */
router.post('/auth/login', usuarioController.autenticar);

export default router;