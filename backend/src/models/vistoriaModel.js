const pool = require('../config/database');

module.exports = {
  async criar({ empresa_id, usuario_id, descricao, data, imovel_id, status = 'em_andamento' }) {
    const result = await pool.query(
      'INSERT INTO vistorias (empresa_id, usuario_id, descricao, data, imovel_id, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [empresa_id, usuario_id, descricao, data, imovel_id, status]
    );
    return result.rows[0];
  },
  async listarTodas(empresa_id) {
    const result = await pool.query(
      'SELECT id, empresa_id, usuario_id, descricao, data, status, created_at, imovel_id FROM vistorias WHERE empresa_id = $1 ORDER BY created_at DESC',
      [empresa_id]
    );
    return result.rows;
  },
  async listarPorImovel(imovel_id, empresa_id) {
    const result = await pool.query(
      'SELECT id, empresa_id, usuario_id, descricao, data, status, created_at, imovel_id FROM vistorias WHERE imovel_id = $1 AND empresa_id = $2 ORDER BY created_at DESC',
      [imovel_id, empresa_id]
    );
    return result.rows;
  },
  async listarTodasSemFiltro() {
    const result = await pool.query('SELECT id, empresa_id, usuario_id, descricao, data, created_at, imovel_id FROM vistorias ORDER BY id');
    return result.rows;
  },
  async buscarPorId(id) {
    const result = await pool.query('SELECT * FROM vistorias WHERE id = $1', [id]);
    return result.rows[0];
  },
  async atualizar(id, dados) {
    const campos = [];
    const valores = [];
    let i = 1;
    for (const key in dados) {
      campos.push(`${key} = $${i}`);
      valores.push(dados[key]);
      i++;
    }
    valores.push(id);
    const result = await pool.query(
      `UPDATE vistorias SET ${campos.join(', ')} WHERE id = $${i} RETURNING *`,
      valores
    );
    return result.rows[0];
  },
  async deletar(id) {
    await pool.query('DELETE FROM vistorias WHERE id = $1', [id]);
  },
};
