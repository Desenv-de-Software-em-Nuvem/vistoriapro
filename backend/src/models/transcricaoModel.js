const pool = require('../config/database');

module.exports = {
  async salvar({ vistoria_id, url_audio, texto, foto_id, comodo_nome }) {
    const result = await pool.query(
      'INSERT INTO transcricoes (vistoria_id, url_audio, texto, foto_id, comodo_nome) VALUES ($1, $2, $3, $4, $5) RETURNING id, vistoria_id, url_audio, texto, foto_id, comodo_nome, created_at',
      [vistoria_id, url_audio, texto, foto_id, comodo_nome]
    );
    return result.rows[0];
  },
  async listarPorVistoria(vistoriaId, empresa_id) {
    const result = await pool.query(
      `SELECT t.id, t.vistoria_id, t.url_audio, t.texto, t.foto_id, t.comodo_nome, t.created_at
       FROM transcricoes t
       INNER JOIN vistorias v ON v.id = t.vistoria_id
       WHERE t.vistoria_id = $1 AND v.empresa_id = $2
       ORDER BY t.id`,
      [vistoriaId, empresa_id]
    );
    return result.rows;
  },
  async buscarPorId(id, empresa_id) {
    const result = await pool.query(
      `SELECT t.*
       FROM transcricoes t
       INNER JOIN vistorias v ON v.id = t.vistoria_id
       WHERE t.id = $1 AND v.empresa_id = $2`,
      [id, empresa_id]
    );
    return result.rows[0];
  },
  async deletar(id, empresa_id) {
    const result = await pool.query(
      `DELETE FROM transcricoes t
       USING vistorias v
       WHERE t.vistoria_id = v.id AND t.id = $1 AND v.empresa_id = $2
       RETURNING t.id`,
      [id, empresa_id]
    );
    return result.rowCount > 0;
  },
};
