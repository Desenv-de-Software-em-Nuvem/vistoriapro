const pool = require('../config/database');

module.exports = {
  async gerar({ vistoria_id, url_arquivo, dados_adicionais }) {
    const result = await pool.query(
      'INSERT INTO relatorios (vistoria_id, url_arquivo, dados_adicionais) VALUES ($1, $2, $3) RETURNING id, vistoria_id, url_arquivo, dados_adicionais, created_at',
      [vistoria_id, url_arquivo, dados_adicionais]
    );
    return result.rows[0];
  },
  async listarPorVistoria(vistoriaId) {
    const result = await pool.query(
      'SELECT id, vistoria_id, url_arquivo, dados_adicionais, created_at FROM relatorios WHERE vistoria_id = $1 ORDER BY id',
      [vistoriaId]
    );
    return result.rows;
  },
  async buscarPorId(id) {
    const result = await pool.query('SELECT * FROM relatorios WHERE id = $1', [id]);
    return result.rows[0];
  },
  async deletar(id) {
    await pool.query('DELETE FROM relatorios WHERE id = $1', [id]);
  },
  async listarTodos() {
    const result = await pool.query('SELECT * FROM relatorios ORDER BY id');
    return result.rows;
  },
};
