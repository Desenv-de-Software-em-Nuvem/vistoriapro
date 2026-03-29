const pool = require('../config/database');

module.exports = {
  async salvar({ vistoria_id, url_audio, texto, foto_id, comodo_nome }) {
    const result = await pool.query(
      'INSERT INTO transcricoes (vistoria_id, url_audio, texto, foto_id, comodo_nome) VALUES ($1, $2, $3, $4, $5) RETURNING id, vistoria_id, url_audio, texto, foto_id, comodo_nome, created_at',
      [vistoria_id, url_audio, texto, foto_id, comodo_nome]
    );
    return result.rows[0];
  },
  async listarPorVistoria(vistoriaId) {
    const result = await pool.query(
      'SELECT id, vistoria_id, url_audio, texto, foto_id, comodo_nome, created_at FROM transcricoes WHERE vistoria_id = $1 ORDER BY id',
      [vistoriaId]
    );
    return result.rows;
  },
  async buscarPorId(id) {
    const result = await pool.query('SELECT * FROM transcricoes WHERE id = $1', [id]);
    return result.rows[0];
  },
  async deletar(id) {
    await pool.query('DELETE FROM transcricoes WHERE id = $1', [id]);
  },
};
