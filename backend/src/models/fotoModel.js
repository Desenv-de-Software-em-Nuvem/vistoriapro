const pool = require('../config/database');

module.exports = {
  async salvar({ vistoria_id, caminho_arquivo, descricao, comodo_nome, comodo_id }) {
    const result = await pool.query(
      'INSERT INTO fotos (vistoria_id, url, descricao, comodo_nome, comodo_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, vistoria_id, url, descricao, comodo_nome, comodo_id, created_at',
      [vistoria_id, caminho_arquivo, descricao, comodo_nome, comodo_id]
    );
    return result.rows[0];
  },
  async listarPorVistoria(vistoriaId) {
    const result = await pool.query(
      'SELECT id, vistoria_id, url, descricao, comodo_nome, comodo_id, created_at FROM fotos WHERE vistoria_id = $1 ORDER BY id',
      [vistoriaId]
    );
    return result.rows;
  },
  async buscarPorId(id) {
    const result = await pool.query('SELECT * FROM fotos WHERE id = $1', [id]);
    return result.rows[0];
  },
  async deletar(id) {
    await pool.query('DELETE FROM fotos WHERE id = $1', [id]);
  },
  async listarTodas() {
    const result = await pool.query('SELECT id, vistoria_id, url, descricao, comodo_nome, comodo_id, created_at FROM fotos ORDER BY id');
    return result.rows;
  },
};
