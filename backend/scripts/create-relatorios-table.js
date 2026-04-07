const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5433),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'vistoriapro',
  });

  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS relatorios (
      id SERIAL PRIMARY KEY,
      vistoria_id INTEGER NOT NULL REFERENCES vistorias(id) ON DELETE CASCADE,
      url_arquivo TEXT NOT NULL,
      dados_adicionais JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.query('CREATE INDEX IF NOT EXISTS idx_relatorios_vistoria_id ON relatorios(vistoria_id)');
  await client.end();
  console.log('relatorios table ready');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});