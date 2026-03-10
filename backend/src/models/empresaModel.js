const pool = require('../config/database');

module.exports = {
  async listarTodas() {
    const result = await pool.query('SELECT id, nome, cnpj, email, created_at FROM empresas ORDER BY id');
    return result.rows;
  },

};