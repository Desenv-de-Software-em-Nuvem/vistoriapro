import app from './src/app.js';
import { AppDataSource } from './src/data-source.js';


const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Em produção, exigir que o segredo do JWT esteja definido
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('Erro: variável de ambiente JWT_SECRET não definida em produção.');
  process.exit(1);
}

// Inicializa a conexão TypeORM antes de ligar o servidor
AppDataSource.initialize()
  .then(() => {
    console.log('TypeORM: conexão com o banco inicializada.');
    app.listen(PORT, () => {
      console.log(`Express server running at http://localhost:${PORT}/`);
    });
  })
  .catch((err) => {
    console.error('Falha ao inicializar TypeORM:', err);
    process.exit(1);
  });