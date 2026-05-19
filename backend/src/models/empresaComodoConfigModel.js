const pool = require('../config/database');

module.exports = {
  async listarPorEmpresaETipo(empresa_id, tipo_imovel) {
    const result = await pool.query(
      `SELECT id, empresa_id, tipo_imovel, comodo_key, nome_exibicao, created_at, updated_at
       FROM empresa_comodos_config
       WHERE empresa_id = $1 AND tipo_imovel = $2
       ORDER BY comodo_key`,
      [empresa_id, tipo_imovel]
    );
    return result.rows;
  },

  async upsert({ empresa_id, tipo_imovel, comodo_key, nome_exibicao }) {
    const result = await pool.query(
      `INSERT INTO empresa_comodos_config (empresa_id, tipo_imovel, comodo_key, nome_exibicao, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (empresa_id, tipo_imovel, comodo_key)
       DO UPDATE SET nome_exibicao = EXCLUDED.nome_exibicao, updated_at = CURRENT_TIMESTAMP
       RETURNING id, empresa_id, tipo_imovel, comodo_key, nome_exibicao, created_at, updated_at`,
      [empresa_id, tipo_imovel, comodo_key, nome_exibicao]
    );
    return result.rows[0];
  },

  async remover({ empresa_id, tipo_imovel, comodo_key }) {
    const result = await pool.query(
      `DELETE FROM empresa_comodos_config
       WHERE empresa_id = $1 AND tipo_imovel = $2 AND comodo_key = $3
       RETURNING id`,
      [empresa_id, tipo_imovel, comodo_key]
    );
    return result.rowCount > 0;
  },
};
