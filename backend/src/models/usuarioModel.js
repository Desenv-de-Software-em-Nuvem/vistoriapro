import pool from '../config/database.js';

const usuarioModel = {
  async listarTodos() {
    const result = await pool.query('SELECT id, empresa_id, nome, email, papel FROM usuarios ORDER BY id');
    return result.rows;
  },

};

export default usuarioModel;