const pool = require('../config/database');

module.exports = {
  async gerar({ vistoria_id, url_arquivo, dados_adicionais }) {
    const result = await pool.query(
      'INSERT INTO relatorios (vistoria_id, url_arquivo, dados_adicionais) VALUES ($1, $2, $3) RETURNING id, vistoria_id, url_arquivo, dados_adicionais, created_at',
      [vistoria_id, url_arquivo, dados_adicionais]
    );
    return result.rows[0];
  },
  async listarPorVistoria(vistoriaId, empresa_id) {
    const result = await pool.query(
      `SELECT r.id, r.vistoria_id, r.url_arquivo, r.dados_adicionais, r.created_at
       FROM relatorios r
       INNER JOIN vistorias v ON v.id = r.vistoria_id
       WHERE r.vistoria_id = $1 AND v.empresa_id = $2
       ORDER BY r.id`,
      [vistoriaId, empresa_id]
    );
    return result.rows;
  },
  async buscarPorId(id, empresa_id) {
    const result = await pool.query(
      `SELECT r.*
       FROM relatorios r
       INNER JOIN vistorias v ON v.id = r.vistoria_id
       WHERE r.id = $1 AND v.empresa_id = $2`,
      [id, empresa_id]
    );
    return result.rows[0];
  },
  async deletar(id, empresa_id) {
    const result = await pool.query(
      `DELETE FROM relatorios r
       USING vistorias v
       WHERE r.vistoria_id = v.id AND r.id = $1 AND v.empresa_id = $2
       RETURNING r.id`,
      [id, empresa_id]
    );
    return result.rowCount > 0;
  },
  async listarTodos(empresa_id) {
    const result = await pool.query(
      `SELECT r.*
       FROM relatorios r
       INNER JOIN vistorias v ON v.id = r.vistoria_id
       WHERE v.empresa_id = $1
       ORDER BY r.id`,
      [empresa_id]
    );
    return result.rows;
  },
};
