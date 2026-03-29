// Script para recriar o banco de dados rodando todas as migrations em ordem
// Uso: node backend/scripts/recreate-database.js

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Configurações do banco (ajuste conforme seu ambiente)
const dbConfig = {
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'vistoriapro',
  password: process.env.PGPASSWORD || 'postgres',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
};

const migrationsDir = path.join(__dirname, '../migrations');

async function runMigrations() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Conectado ao banco de dados!');

    // Lê todos os arquivos .sql em ordem alfabética
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`\nExecutando migration: ${file}`);
      try {
        await client.query(sql);
        console.log(`Migration ${file} executada com sucesso!`);
      } catch (err) {
        console.error(`Erro ao executar ${file}:`, err.message);
        throw err;
      }
    }
    console.log('\nTodas as migrations foram executadas com sucesso!');
  } catch (err) {
    console.error('Erro geral:', err.message);
  } finally {
    await client.end();
    console.log('Conexão com o banco encerrada.');
  }
}

runMigrations();
