const pool = require('../src/config/database');

(async function main() {
  try {
    const sql = `
WITH nova_empresa AS (
  INSERT INTO empresas (nome, cnpj, created_at)
  VALUES (
    'Empresa Padrão',
    '00000000000191',
    now()
  )
  RETURNING id
)
INSERT INTO usuarios (empresa_id, nome, email, senha_hash, papel, created_at)
SELECT
  ne.id,
  'Administrador',
  'admin1@empresa.com',
  crypt('admin123', gen_salt('bf')),
  'admin',
  now()
FROM nova_empresa ne;`

    await pool.query(sql);
    console.log('Empresa e admin criados com sucesso');
  } catch (err) {
    console.error('Erro ao criar admin:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();