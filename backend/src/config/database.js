const { Pool } = require('pg');
require('dotenv').config();

const useConnectionString = Boolean(process.env.DATABASE_URL);
const useSsl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';

const poolConfig = useConnectionString
  ? {
      connectionString: process.env.DATABASE_URL,
    }
  : {
      host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
      port: Number(process.env.DB_PORT || process.env.PGPORT || 5432),
      user: process.env.DB_USER || process.env.PGUSER || 'postgres',
      password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'postgres',
      database: process.env.DB_NAME || process.env.PGDATABASE || 'vistoriapro',
    };

if (useSsl) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

module.exports = pool;