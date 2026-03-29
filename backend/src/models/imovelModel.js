const pool = require('../config/database');

module.exports = {
  async criar({ empresa_id, nome, endereco_completo, unidade, cidade, uf, cep, tipo, observacoes }) {
    const result = await pool.query(
      `INSERT INTO imoveis (empresa_id, nome, endereco_completo, unidade, cidade, uf, cep, tipo, observacoes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id, empresa_id, nome, endereco_completo, unidade, cidade, uf, cep, tipo, observacoes, created_at`,
      [empresa_id, nome, endereco_completo, unidade, cidade, uf, cep, tipo, observacoes]
    );
    return result.rows[0];
  },

  async listarTodos(empresa_id) {
    const result = await pool.query(
      `SELECT id, empresa_id, nome, endereco_completo, unidade, cidade, uf, cep, tipo, observacoes, created_at 
       FROM imoveis WHERE empresa_id = $1 ORDER BY nome`,
      [empresa_id]
    );
    return result.rows;
  },

  async buscarPorId(id, empresa_id) {
    const result = await pool.query(
      `SELECT * FROM imoveis WHERE id = $1 AND empresa_id = $2`,
      [id, empresa_id]
    );
    return result.rows[0];
  },

  async atualizar(id, empresa_id, dados) {
    const campos = [];
    const valores = [];
    let i = 1;
    for (const key in dados) {
      if (dados[key] !== undefined) {
        campos.push(`${key} = $${i}`);
        valores.push(dados[key]);
        i++;
      }
    }
    valores.push(id, empresa_id);
    const result = await pool.query(
      `UPDATE imoveis SET ${campos.join(', ')} 
       WHERE id = $${i} AND empresa_id = $${i + 1} 
       RETURNING *`,
      valores
    );
    return result.rows[0];
  },

  async deletar(id, empresa_id) {
    const result = await pool.query(
      'DELETE FROM imoveis WHERE id = $1 AND empresa_id = $2 RETURNING id',
      [id, empresa_id]
    );
    return result.rowCount > 0;
  },

  async buscarPorEndereco(endereco, empresa_id) {
    const result = await pool.query(
      `SELECT id, empresa_id, nome, endereco_completo, unidade, cidade, uf, cep, tipo, observacoes, created_at 
       FROM imoveis WHERE endereco_completo ILIKE $1 AND empresa_id = $2`,
      [`%${endereco}%`, empresa_id]
    );
    return result.rows;
  }
};
