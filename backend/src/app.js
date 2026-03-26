import cors from 'cors';
import express from 'express';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { AppDataSource } from './data-source.js';

dotenv.config();

const app = express();


const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://imob-vistorias.netlify.app',
        'https://vistoriapro.netlify.app',
        'https://*.netlify.app',
        'http://localhost:5173',
        'capacitor://localhost',
        'file://',
        'https://localhost'
      ]
    : [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'capacitor://localhost',
        'file://',
        'https://localhost'
      
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Custom-Header'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
// console.log('CORS configurado com as seguintes origens permitidas:', corsOptions.origin);

app.get('/', (req, res) => {
  res.json({
    message: 'API VistoriaPro rodando!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/test-db', async (req, res) => {
  try {
    const result = await AppDataSource.query('SELECT NOW() as current_time, version() as db_version');
    res.json({
      success: true,
      data: result[0],
      message: 'Conexão com banco de dados funcionando!',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      message: 'Erro ao conectar com o banco de dados',
    });
  }
});

app.use(express.json());
app.use('/api', routes);

export default app;
