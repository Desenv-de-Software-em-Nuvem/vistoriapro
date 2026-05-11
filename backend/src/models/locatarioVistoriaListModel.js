const pool = require('../config/database');

module.exports = {
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
};
