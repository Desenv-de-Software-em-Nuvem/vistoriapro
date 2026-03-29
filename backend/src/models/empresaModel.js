const pool = require('../config/database');

module.exports = {
  async criar({ nome, cnpj, email }) {
    const result = await pool.query(
      'INSERT INTO empresas (nome, cnpj, email) VALUES ($1, $2, $3) RETURNING id, nome, cnpj, email, created_at',
      [nome, cnpj, email]
    );
    return result.rows[0];
  },
  async listarTodas() {
    const result = await pool.query('SELECT id, nome, cnpj, email, created_at FROM empresas ORDER BY id');
    return result.rows;
  },
  async buscarPorId(id) {
    const result = await pool.query('SELECT id, nome, cnpj, email, created_at FROM empresas WHERE id = $1', [id]);
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
      `UPDATE empresas SET ${campos.join(', ')} WHERE id = $${i} RETURNING id, nome, cnpj, email, created_at`,
      valores
    );
    return result.rows[0];
  },
  async deletar(id) {
    await pool.query('DELETE FROM empresas WHERE id = $1', [id]);
  },
};
