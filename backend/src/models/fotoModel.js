const pool = require('../config/database');

module.exports = {
  async salvar({ vistoria_id, caminho_arquivo, descricao, comodo_nome, comodo_id }) {
    const result = await pool.query(
      'INSERT INTO fotos (vistoria_id, url, descricao, comodo_nome, comodo_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, vistoria_id, url, descricao, comodo_nome, comodo_id, created_at',
      [vistoria_id, caminho_arquivo, descricao, comodo_nome, comodo_id]
    );
    return result.rows[0];
  },
  async listarPorVistoria(vistoriaId, empresa_id) {
    const result = await pool.query(
      `SELECT f.id, f.vistoria_id, f.url, f.descricao, f.comodo_nome, f.comodo_id, f.created_at
       FROM fotos f
       INNER JOIN vistorias v ON v.id = f.vistoria_id
       WHERE f.vistoria_id = $1 AND v.empresa_id = $2
       ORDER BY f.id`,
      [vistoriaId, empresa_id]
    );
    return result.rows;
  },
  async buscarPorId(id, empresa_id) {
    const result = await pool.query(
      `SELECT f.*
       FROM fotos f
       INNER JOIN vistorias v ON v.id = f.vistoria_id
       WHERE f.id = $1 AND v.empresa_id = $2`,
      [id, empresa_id]
    );
    return result.rows[0];
  },
  async deletar(id, empresa_id) {
    const result = await pool.query(
      `DELETE FROM fotos f
       USING vistorias v
       WHERE f.vistoria_id = v.id AND f.id = $1 AND v.empresa_id = $2
       RETURNING f.id`,
      [id, empresa_id]
    );
    return result.rowCount > 0;
  },
  async listarTodas(empresa_id) {
    const result = await pool.query(
      `SELECT f.id, f.vistoria_id, f.url, f.descricao, f.comodo_nome, f.comodo_id, f.created_at
       FROM fotos f
       INNER JOIN vistorias v ON v.id = f.vistoria_id
       WHERE v.empresa_id = $1
       ORDER BY f.id`,
      [empresa_id]
    );
    return result.rows;
  },
};
