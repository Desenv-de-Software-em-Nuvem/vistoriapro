/**
 * Aplica databases/patch_remove_papel_cliente.sql
 * Uso: npm run db:migrate:remove-cliente-role
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
  const sqlPath = path.join(__dirname, '../../databases/patch_remove_papel_cliente.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const useConnectionString = Boolean(process.env.DATABASE_URL);
  const useSsl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';

  const poolConfig = useConnectionString
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'vistoriapro',
      };

  if (useSsl) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }

  const pool = new Pool(poolConfig);
  console.log('Aplicando patch_remove_papel_cliente.sql...');
  await pool.query(sql);
  await pool.end();
  console.log('OK: papel cliente removido do enum.');
}

main().catch((err) => {
  console.error('Falha na migration:', err.message || err);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
