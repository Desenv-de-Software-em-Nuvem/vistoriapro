import express from 'express';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { AppDataSource } from './data-source.js';

dotenv.config();

const app = express();

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
