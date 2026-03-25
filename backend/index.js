import app from './src/app.js';
import { AppDataSource } from './src/data-source.js';


const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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