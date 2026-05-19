/**
 * Aplica databases/patch_empresa_comodos_config.sql
 *
 * Local:     npm run db:migrate:comodos
 * Supabase:  opção A) SQL Editor → colar patch_empresa_comodos_config.sql → Run
 *            opção B) DATABASE_URL=URI do Supabase + DB_SSL=true + npm run db:migrate:comodos
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
  const sqlPath = path.join(__dirname, '../../databases/patch_empresa_comodos_config.sql');
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
  const label = useConnectionString
    ? 'DATABASE_URL'
    : `${poolConfig.host}:${poolConfig.port}/${poolConfig.database}`;

  console.log(`Aplicando migration em ${label}...`);
  await pool.query(sql);
  await pool.end();
  console.log('OK: patch_empresa_comodos_config.sql aplicado.');
}

main().catch((err) => {
  console.error('Falha na migration:', err.message);
  process.exit(1);
});
