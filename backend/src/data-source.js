import 'reflect-metadata';
import path from 'path';
import { fileURLToPath } from 'url';
import { DataSource } from 'typeorm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração de conexão com o banco de dados (PostgreSQL)
// Usa variáveis de ambiente quando disponíveis.
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'vistoriapro',
  synchronize: false, // Não sincroniza esquema automaticamente (usar migrations)
  logging: false,
  entities: [path.join(__dirname, 'entities', '*.js')],
});
