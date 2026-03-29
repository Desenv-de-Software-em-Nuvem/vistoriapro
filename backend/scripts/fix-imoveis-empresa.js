const pool = require('../src/config/database');

(async function main() {
  try {
    // Busca o empresa_id do admin
    const admin = await pool.query("SELECT empresa_id FROM usuarios WHERE papel = 'admin' ORDER BY created_at LIMIT 1");
    if (!admin.rows.length) throw new Error('Nenhum usuário admin encontrado.');
    const empresa_id = admin.rows[0].empresa_id;

    // Atualiza todos os imóveis para o empresa_id do admin
    const result = await pool.query('UPDATE imoveis SET empresa_id = $1', [empresa_id]);
    console.log(`Todos os imóveis agora pertencem à empresa do admin (empresa_id=${empresa_id}).`);
  } catch (err) {
    console.error('Erro ao atualizar imóveis:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
