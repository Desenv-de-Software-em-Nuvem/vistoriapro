import express, { text } from "express";
import pool from './src/config/database.js';
import routes from './src/routes/index.js';
// import dotenv from 'dotenv';

// dotenv.config();

const app = express();  
const PORT = 3000;

app.get("/", (req, res) => {
  res.json({ 
    message: 'API VistoriaPro rodando!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Exemplo de rota de teste com o banco
app.get('/test-db', async (req, res) => {
  try {
    console.log('Testando conexão com o banco...');
    const result = await pool.query('SELECT NOW() as current_time, version() as db_version');
    console.log('Conexão com banco OK');
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Conexão com banco de dados funcionando!'
    });
  } catch (err) {
    console.error('Erro ao conectar com o banco:', err.message);
    res.status(500).json({ 
      success: false,
      error: err.message,
      message: 'Erro ao conectar com o banco de dados'
    });
  }
});

app.use(express.json());
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}/`);
});