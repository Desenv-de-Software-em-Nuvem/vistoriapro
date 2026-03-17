import express from 'express';
import empresasRouter from './empresas.js';
import usuariosRouter from './usuarios.js';
import imoveisRouter from './imoveis.js';
import vistoriasRouter from './vistorias.js';
import comodosRouter from './comodos.js';
import fotosRouter from './fotos.js';
import transcricoesRouter from './transcricoes.js';
import locatariosRouter from './locatarios.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Routers
router.use('/empresas', empresasRouter);
router.use('/usuarios', usuariosRouter);
router.use('/imoveis', imoveisRouter);
router.use('/vistorias', vistoriasRouter);
router.use('/comodos', comodosRouter);
router.use('/fotos', fotosRouter);
router.use('/transcricoes', transcricoesRouter);
router.use('/locatarios', locatariosRouter);

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VistoriaPro API',
      version: '1.0.0',
      description: 'Documentação da API VistoriaPro',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor local (desenvolvimento)',
      },
    ],
  },
  apis: [path.join(__dirname, '*.js')], // Caminho absoluto para os arquivos de rotas
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

// Rota para servir o JSON do Swagger diretamente (deve vir ANTES do swaggerUi.serve)
router.get('/docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Adicionar rota padrão para /api
router.get('/', (req, res) => {
  res.status(200).json({ message: 'API do VistoriaPro está funcionando!' });
});

export default router;

