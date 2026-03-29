const pool = require('../config/database');

module.exports = {
  async criar({ empresa_id, nome, email, senha_hash, papel, bloqueado = false }) {
    const result = await pool.query(
      'INSERT INTO usuarios (empresa_id, nome, email, senha_hash, papel, bloqueado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, empresa_id, nome, email, papel, bloqueado, created_at',
      [empresa_id, nome, email, senha_hash, papel, bloqueado]
    );
    return result.rows[0];
  },
  async listarTodos() {
    const result = await pool.query('SELECT id, empresa_id, nome, email, papel, bloqueado, created_at FROM usuarios');
    return result.rows;
  },
  async buscarPorEmail(email) {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    return result.rows[0];
  },
  async buscarPorId(id) {
    const result = await pool.query('SELECT id, empresa_id, nome, email, papel, bloqueado, created_at FROM usuarios WHERE id = $1', [id]);
    return result.rows[0];
  },
  async buscarPorIdCompleto(id) {
    const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
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
      `UPDATE usuarios SET ${campos.join(', ')} WHERE id = $${i} RETURNING id, empresa_id, nome, email, papel, bloqueado, created_at`,
      valores
    );
    return result.rows[0];
  },
  async deletar(id) {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
  },
};
