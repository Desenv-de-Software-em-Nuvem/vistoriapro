import bcrypt from 'bcrypt';
import { AppDataSource } from '../src/data-source.js';

async function seed() {
  if (process.env.NODE_ENV !== 'development') {
    console.log('Seed skipped: NODE_ENV !== development');
    return;
  }

  await AppDataSource.initialize();
  const manager = AppDataSource.manager;

  // Truncate tables (dev-only)
  await manager.query(`
    TRUNCATE TABLE locatarios_vistoria, transcricoes, fotos, comodos_vistoria, vistorias, imoveis, usuarios, empresas RESTART IDENTITY CASCADE;
  `);

  // Empresa
  const empresa = await manager.getRepository('Empresa').save({
    nome: 'VistoriaPro Ltda',
    cnpj: '12.345.678/0001-90',
    email: 'contato@vistoriapro.com',
    telefone: '(31) 99999-0000',
    endereco: 'Av. Exemplo, 123, Belo Horizonte, MG',
  });

  // Usuarios
  const passHash = await bcrypt.hash('senha123', 10);
  const usuario1 = await manager.getRepository('Usuario').save({
    empresa_id: empresa.id,
    nome: 'Alice Vistoriadora',
    email: 'alice@vistoriapro.com',
    senha_hash: passHash,
    papel: 'vistoriador',
  });

  const usuario2 = await manager.getRepository('Usuario').save({
    empresa_id: empresa.id,
    nome: 'Bob Admin',
    email: 'bob@vistoriapro.com',
    senha_hash: passHash,
    papel: 'admin',
  });

  // Imovel
  const imovel = await manager.getRepository('Imovel').save({
    empresa_id: empresa.id,
    nome: 'Imóvel Exemplo',
    endereco_completo: 'Rua das Flores, 100, Centro',
    unidade: 'Apto 101',
    cidade: 'Belo Horizonte',
    uf: 'MG',
    cep: '30123-456',
    tipo: 'Apartamento',
    observacoes: 'Imóvel usado para testes.',
  });

  // Vistoria
  const vistoria = await manager.getRepository('Vistoria').save({
    empresa_id: empresa.id,
    usuario_id: usuario1.id,
    imovel_id: imovel.id,
    descricao: 'Vistoria inicial do imóvel',
    data: new Date(),
    status: 'em_andamento',
    observacoes_gerais: 'Vistoria de exemplo executada em ambiente de desenvolvimento.',
  });

  // Comodos
  const sala = await manager.getRepository('ComodoVistoria').save({
    vistoria_id: vistoria.id,
    nome: 'Sala',
    observacoes: 'Sala principal com janela ampla.',
    estado_geral: 'Bom',
  });

  const cozinha = await manager.getRepository('ComodoVistoria').save({
    vistoria_id: vistoria.id,
    nome: 'Cozinha',
    observacoes: 'Pia precisa de limpeza.',
    estado_geral: 'Regular',
  });

  // Fotos
  const foto1 = await manager.getRepository('Foto').save({
    vistoria_id: vistoria.id,
    url: 'https://via.placeholder.com/640x480.png?text=Sala',
    descricao: 'Foto da sala',
    comodo_nome: 'Sala',
    comodo_id: sala.id,
  });

  const foto2 = await manager.getRepository('Foto').save({
    vistoria_id: vistoria.id,
    url: 'https://via.placeholder.com/640x480.png?text=Cozinha',
    descricao: 'Foto da cozinha',
    comodo_nome: 'Cozinha',
    comodo_id: cozinha.id,
  });

  // Transcricoes
  await manager.getRepository('Transcricao').save({
    vistoria_id: vistoria.id,
    url_audio: 'https://example.com/audio/001.mp3',
    texto: 'Relatório verbal da vistoria da sala.',
    foto_id: foto1.id,
    comodo_nome: 'Sala',
  });

  await manager.getRepository('Transcricao').save({
    vistoria_id: vistoria.id,
    url_audio: 'https://example.com/audio/002.mp3',
    texto: 'Relatório verbal da cozinha.',
    foto_id: foto2.id,
    comodo_nome: 'Cozinha',
  });

  console.log('Seed completo.');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Erro ao seedar DB:', err);
  process.exit(1);
});
