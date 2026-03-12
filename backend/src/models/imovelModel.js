import pool from '../config/database.js';

const imovelModel = {
  async listarTodos() {
    const result = await pool.query(
      'SELECT id, empresa_id, nome, unidade, cidade, uf, tipo FROM imoveis ORDER BY id');
    return result.rows;
  },

  // async listarPorEmpresa(empresaId) {
  //   const result = await pool.query(
  //     'SELECT id, empresa_id, nome, unidade, cidade, uf, tipo FROM imoveis WHERE empresa_id = $1 ORDER BY id',
  //     [empresaId]
  //   );
  //   return result.rows;
  // },

  async buscarPorId(id, empresa_id) {
    console.log(`Buscando imóvel com id ${id} para empresa_id ${empresa_id}`);
    const result = await pool.query(
      `SELECT * FROM imoveis WHERE id = $1 AND empresa_id = $2`,
      [id, empresa_id]
    );

    return result.rows[0];
  },

};

export default imovelModel;