const pool = require('../config/database');

module.exports = {
  async criar({ vistoria_id, nome, descricao }) {
    const result = await pool.query(
      'INSERT INTO comodos_vistoria (vistoria_id, nome, descricao) VALUES ($1, $2, $3) RETURNING id, vistoria_id, nome, descricao',
      [vistoria_id, nome, descricao]
    );
    return result.rows[0];
  },
  async listarPorVistoria(vistoriaId) {
    const result = await pool.query(
      'SELECT id, vistoria_id, nome, descricao FROM comodos_vistoria WHERE vistoria_id = $1 ORDER BY id',
      [vistoriaId]
    );
    return result.rows;
  },
  async buscarPorId(id) {
    const result = await pool.query('SELECT * FROM comodos_vistoria WHERE id = $1', [id]);
    return result.rows[0];
  },
  async deletar(id) {
    await pool.query('DELETE FROM comodos_vistoria WHERE id = $1', [id]);
  },
};
