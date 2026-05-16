const pool = require('../config/database');

const USUARIO_SELECT = 'id, empresa_id, nome, email, cpf, papel, bloqueado, created_at';
const USUARIO_EDITABLE_FIELDS = ['empresa_id', 'nome', 'email', 'cpf', 'senha_hash', 'papel', 'bloqueado'];

let ensureFieldsPromise;

function limparTexto(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

async function ensureUsuarioReportFields() {
  if (!ensureFieldsPromise) {
    ensureFieldsPromise = pool.query(`
      ALTER TABLE usuarios
      ADD COLUMN IF NOT EXISTS cpf VARCHAR(20)
    `).catch((error) => {
      ensureFieldsPromise = null;
      throw error;
    });
  }

  return ensureFieldsPromise;
}

module.exports = {
  async criar({ empresa_id, nome, email, cpf, senha_hash, papel, bloqueado = false }) {
    await ensureUsuarioReportFields();

    const result = await pool.query(
      `INSERT INTO usuarios (empresa_id, nome, email, cpf, senha_hash, papel, bloqueado)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${USUARIO_SELECT}`,
      [empresa_id, nome, email, limparTexto(cpf), senha_hash, papel, bloqueado]
    );
    return result.rows[0];
  },
  async listarTodos() {
    await ensureUsuarioReportFields();

    const result = await pool.query(`SELECT ${USUARIO_SELECT} FROM usuarios`);
    return result.rows;
  },
  async buscarPorEmail(email) {
    await ensureUsuarioReportFields();

    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    return result.rows[0];
  },
  async buscarPorId(id) {
    await ensureUsuarioReportFields();

    const result = await pool.query(`SELECT ${USUARIO_SELECT} FROM usuarios WHERE id = $1`, [id]);
    return result.rows[0];
  },
  async buscarPorIdCompleto(id) {
    await ensureUsuarioReportFields();

    const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    return result.rows[0];
  },
  async atualizar(id, dados) {
    await ensureUsuarioReportFields();

    const campos = [];
    const valores = [];
    let i = 1;
    for (const key of USUARIO_EDITABLE_FIELDS) {
      if (!(key in dados)) continue;
      campos.push(`${key} = $${i}`);
      valores.push(key === 'cpf' ? limparTexto(dados[key]) : dados[key]);
      i++;
    }

    if (campos.length === 0) {
      return this.buscarPorId(id);
    }

    valores.push(id);
    const result = await pool.query(
      `UPDATE usuarios SET ${campos.join(', ')} WHERE id = $${i} RETURNING ${USUARIO_SELECT}`,
      valores
    );
    return result.rows[0];
  },
  async deletar(id) {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
  },
};
