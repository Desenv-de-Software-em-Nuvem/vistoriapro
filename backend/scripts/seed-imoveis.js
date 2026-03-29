const pool = require('../src/config/database');

const tipos = [
  'Apartamento',
  'Casa',
  'Sala Comercial',
  'Galpão',
  'Terreno',
  'Loja'
];

const cidades = [
  'São Paulo',
  'Rio de Janeiro',
  'Belo Horizonte',
  'Curitiba',
  'Porto Alegre',
  'Salvador',
  'Brasília'
];


(async function main() {
  try {
    // Busca o empresa_id do usuário admin
    const admin = await pool.query("SELECT empresa_id FROM usuarios WHERE papel = 'admin' ORDER BY created_at LIMIT 1");
    if (!admin.rows.length) throw new Error('Nenhum usuário admin encontrado.');
    const empresa_id = admin.rows[0].empresa_id;

    for (let i = 0; i < tipos.length; i++) {
      const tipo = tipos[i];
      const cidade = cidades[i % cidades.length];
      const nome = `${tipo} Exemplo`;
      const endereco = `Rua Exemplo, ${100 + i}, Bairro Centro`;
      const unidade = `Unidade ${i+1}`;
      const uf = 'SP';
      const cep = `0100${i}0-000`;
      const observacoes = `Imóvel de exemplo do tipo ${tipo}`;
      await pool.query(
        `INSERT INTO imoveis (empresa_id, nome, endereco_completo, unidade, cidade, uf, cep, tipo, observacoes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())`,
        [empresa_id, nome, endereco, unidade, cidade, uf, cep, tipo, observacoes]
      );
      console.log(`Imóvel do tipo ${tipo} inserido.`);
    }
    console.log('Todos os imóveis de exemplo foram inseridos com sucesso!');
  } catch (err) {
    console.error('Erro ao inserir imóveis:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
