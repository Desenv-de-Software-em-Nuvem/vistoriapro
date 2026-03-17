// Script para executar uma migration específica
// Uso: node backend/scripts/run-migration.js [nome-da-migration]
// Exemplo: node backend/scripts/run-migration.js alter-usuarios-senha-hash.sql

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vistoriapro',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
};

const migrationsDir = path.join(__dirname, '../migrations');
const migrationName = process.argv[2];

async function runMigration() {
  if (!migrationName) {
    console.error('Erro: Especifique o nome da migration');
    console.log('Uso: node run-migration.js [nome-da-migration.sql]');
    process.exit(1);
  }

  const migrationPath = path.join(migrationsDir, migrationName);

  if (!fs.existsSync(migrationPath)) {
    console.error(`Erro: Migration "${migrationName}" não encontrada`);
    console.log(`Caminho procurado: ${migrationPath}`);
    process.exit(1);
  }

  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Conectado ao banco de dados!');

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(`\nExecutando migration: ${migrationName}`);
    
    await client.query(sql);
    console.log(`✓ Migration "${migrationName}" executada com sucesso!`);
  } catch (err) {
    console.error(`✗ Erro ao executar migration:`, err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
