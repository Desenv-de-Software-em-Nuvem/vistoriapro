const pool = require('../config/database');

module.exports = {
  async criar({ vistoria_id, nome, descricao }) {
    const result = await pool.query(
      'INSERT INTO comodos_vistoria (vistoria_id, nome, descricao) VALUES ($1, $2, $3) RETURNING *',
      [vistoria_id, nome, descricao]
    );
    return result.rows[0];
  },
  async listarPorVistoria(vistoriaId, empresa_id) {
    const result = await pool.query(
      `SELECT c.*
       FROM comodos_vistoria c
       INNER JOIN vistorias v ON v.id = c.vistoria_id
       WHERE c.vistoria_id = $1 AND v.empresa_id = $2
       ORDER BY c.id`,
      [vistoriaId, empresa_id]
    );
    return result.rows;
  },
  async buscarPorId(id, empresa_id) {
    const result = await pool.query(
      `SELECT c.*
       FROM comodos_vistoria c
       INNER JOIN vistorias v ON v.id = c.vistoria_id
       WHERE c.id = $1 AND v.empresa_id = $2`,
      [id, empresa_id]
    );
    return result.rows[0];
  },
  async deletar(id, empresa_id) {
    const result = await pool.query(
      `DELETE FROM comodos_vistoria c
       USING vistorias v
       WHERE c.vistoria_id = v.id AND c.id = $1 AND v.empresa_id = $2
       RETURNING c.id`,
      [id, empresa_id]
    );
    return result.rowCount > 0;
  },
};
