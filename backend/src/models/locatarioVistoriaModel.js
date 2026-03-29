const pool = require('../config/database');

module.exports = {
  async criar({ vistoria_id, nome, nacionalidade, profissao, cpf, rg, rg_orgao, rg_uf, endereco }) {
    const result = await pool.query(
      `INSERT INTO locatarios_vistoria (vistoria_id, nome, nacionalidade, profissao, cpf, rg, rg_orgao, rg_uf, endereco)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, vistoria_id, nome, nacionalidade, profissao, cpf, rg, rg_orgao, rg_uf, endereco`,
      [vistoria_id, nome, nacionalidade, profissao, cpf, rg, rg_orgao, rg_uf, endereco]
    );
    return result.rows[0];
  },
  async listarPorVistoria(vistoriaId) {
    const result = await pool.query(
      'SELECT id, vistoria_id, nome, nacionalidade, profissao, cpf, rg, rg_orgao, rg_uf, endereco FROM locatarios_vistoria WHERE vistoria_id = $1 ORDER BY id',
      [vistoriaId]
    );
    return result.rows;
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
      `UPDATE locatarios_vistoria SET ${campos.join(', ')} WHERE id = $${i} RETURNING *`,
      valores
    );
    return result.rows[0];
  },
  async deletar(id) {
    await pool.query('DELETE FROM locatarios_vistoria WHERE id = $1', [id]);
  },
  async buscarPorId(id) {
    const result = await pool.query('SELECT * FROM locatarios_vistoria WHERE id = $1', [id]);
    return result.rows[0];
  },
};
