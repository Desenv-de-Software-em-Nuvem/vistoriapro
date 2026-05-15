const pool = require('../config/database');

const EMPRESA_FIELDS = [
  'id',
  'nome',
  'cnpj',
  'email',
  'telefone',
  'whatsapp',
  'endereco',
  'site',
  'instagram',
  'responsavel_nome',
  'creci',
  'logo_url',
  'created_at'
];

const EMPRESA_SELECT = EMPRESA_FIELDS.join(', ');
const EMPRESA_EDITABLE_FIELDS = EMPRESA_FIELDS.filter((field) => !['id', 'created_at'].includes(field));

let ensureFieldsPromise;

function limparTexto(value) {
  if (value === undefined || value === null) return null;

  const text = String(value).trim();
  return text === '' ? null : text;
}

async function ensureEmpresaReportFields() {
  if (!ensureFieldsPromise) {
    ensureFieldsPromise = pool.query(`
      ALTER TABLE empresas
      ADD COLUMN IF NOT EXISTS telefone VARCHAR(30),
      ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(30),
      ADD COLUMN IF NOT EXISTS endereco TEXT,
      ADD COLUMN IF NOT EXISTS site VARCHAR(200),
      ADD COLUMN IF NOT EXISTS instagram VARCHAR(120),
      ADD COLUMN IF NOT EXISTS responsavel_nome VARCHAR(200),
      ADD COLUMN IF NOT EXISTS creci VARCHAR(80),
      ADD COLUMN IF NOT EXISTS logo_url TEXT
    `).catch((error) => {
      ensureFieldsPromise = null;
      throw error;
    });
  }

  return ensureFieldsPromise;
}

module.exports = {
  async criar(dados) {
    await ensureEmpresaReportFields();

    const campos = EMPRESA_EDITABLE_FIELDS;
    const valores = campos.map((campo) => limparTexto(dados[campo]));
    const placeholders = campos.map((_, index) => `$${index + 1}`);

    const result = await pool.query(
      `INSERT INTO empresas (${campos.join(', ')})
       VALUES (${placeholders.join(', ')})
       RETURNING ${EMPRESA_SELECT}`,
      valores
    );
    return result.rows[0];
  },
  async listarTodas() {
    await ensureEmpresaReportFields();

    const result = await pool.query(`SELECT ${EMPRESA_SELECT} FROM empresas ORDER BY id`);
    return result.rows;
  },
  async buscarPorId(id) {
    await ensureEmpresaReportFields();

    const result = await pool.query(`SELECT ${EMPRESA_SELECT} FROM empresas WHERE id = $1`, [id]);
    return result.rows[0];
  },
  async atualizar(id, dados) {
    await ensureEmpresaReportFields();

    const campos = [];
    const valores = [];
    let i = 1;

    for (const key of EMPRESA_EDITABLE_FIELDS) {
      if (!(key in dados)) continue;
      campos.push(`${key} = $${i}`);
      valores.push(limparTexto(dados[key]));
      i++;
    }

    if (campos.length === 0) {
      return this.buscarPorId(id);
    }

    valores.push(id);
    const result = await pool.query(
      `UPDATE empresas SET ${campos.join(', ')} WHERE id = $${i} RETURNING ${EMPRESA_SELECT}`,
      valores
    );
    return result.rows[0];
  },
  async deletar(id) {
    await ensureEmpresaReportFields();

    const result = await pool.query('DELETE FROM empresas WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  },
};
