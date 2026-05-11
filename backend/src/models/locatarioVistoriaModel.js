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
  async listarPorVistoria(vistoriaId, empresa_id) {
    const result = await pool.query(
      `SELECT l.id, l.vistoria_id, l.nome, l.nacionalidade, l.profissao, l.cpf, l.rg, l.rg_orgao, l.rg_uf, l.endereco
       FROM locatarios_vistoria l
       INNER JOIN vistorias v ON v.id = l.vistoria_id
       WHERE l.vistoria_id = $1 AND v.empresa_id = $2
       ORDER BY l.id`,
      [vistoriaId, empresa_id]
    );
    return result.rows;
  },
  async atualizar(id, empresa_id, dados) {
    const campos = [];
    const valores = [];
    let i = 1;
    for (const key in dados) {
      campos.push(`${key} = $${i}`);
      valores.push(dados[key]);
      i++;
    }

    if (campos.length === 0) {
      return this.buscarPorId(id, empresa_id);
    }

    valores.push(id, empresa_id);
    const result = await pool.query(
      `UPDATE locatarios_vistoria l
       SET ${campos.join(', ')}
       FROM vistorias v
       WHERE l.vistoria_id = v.id AND l.id = $${i} AND v.empresa_id = $${i + 1}
       RETURNING l.*`,
      valores
    );
    return result.rows[0];
  },
  async deletar(id, empresa_id) {
    const result = await pool.query(
      `DELETE FROM locatarios_vistoria l
       USING vistorias v
       WHERE l.vistoria_id = v.id AND l.id = $1 AND v.empresa_id = $2
       RETURNING l.id`,
      [id, empresa_id]
    );
    return result.rowCount > 0;
  },
  async buscarPorId(id, empresa_id) {
    const result = await pool.query(
      `SELECT l.*
       FROM locatarios_vistoria l
       INNER JOIN vistorias v ON v.id = l.vistoria_id
       WHERE l.id = $1 AND v.empresa_id = $2`,
      [id, empresa_id]
    );
    return result.rows[0];
  },
};
