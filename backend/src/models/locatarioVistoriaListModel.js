const pool = require('../config/database');

module.exports = {
  async listarPorVistoria(vistoriaId) {
    const result = await pool.query(
      'SELECT id, vistoria_id, nome, nacionalidade, profissao, cpf, rg, rg_orgao, rg_uf, endereco FROM locatarios_vistoria WHERE vistoria_id = $1 ORDER BY id',
      [vistoriaId]
    );
    return result.rows;
  },
};
