const pool = require('../config/database');

module.exports = {
  async criar({ vistoria_id, nome, descricao, comodo_key }) {
    if (comodo_key) {
      const existingByKey = await pool.query(
        'SELECT id FROM comodos_vistoria WHERE vistoria_id = $1 AND comodo_key = $2',
        [vistoria_id, comodo_key]
      );
      if (existingByKey.rows.length > 0) {
        const result = await pool.query(
          'UPDATE comodos_vistoria SET nome = $1, descricao = $2 WHERE id = $3 RETURNING *',
          [nome, descricao, existingByKey.rows[0].id]
        );
        return result.rows[0];
      }
    }

    const existing = await pool.query(
      'SELECT id FROM comodos_vistoria WHERE vistoria_id = $1 AND nome = $2',
      [vistoria_id, nome]
    );
    if (existing.rows.length > 0) {
      const result = await pool.query(
        'UPDATE comodos_vistoria SET descricao = $1, comodo_key = COALESCE($2, comodo_key) WHERE id = $3 RETURNING *',
        [descricao, comodo_key || null, existing.rows[0].id]
      );
      return result.rows[0];
    }
    const result = await pool.query(
      'INSERT INTO comodos_vistoria (vistoria_id, nome, descricao, comodo_key) VALUES ($1, $2, $3, $4) RETURNING *',
      [vistoria_id, nome, descricao, comodo_key || null]
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
