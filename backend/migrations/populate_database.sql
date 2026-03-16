-- Populate the development database with sample data.
-- WARNING: This script truncates existing data and restarts identity sequences.
-- Use only in development environments.

BEGIN;

TRUNCATE TABLE locatarios_vistoria,
             transcricoes,
             fotos,
             comodos_vistoria,
             vistorias,
             imoveis,
             usuarios,
             empresas
  RESTART IDENTITY CASCADE;

-- Empresas
INSERT INTO empresas (nome, cnpj, email, telefone, endereco) VALUES
  ('VistoriaPro Ltda', '12.345.678/0001-90', 'contato@vistoriapro.com', '(31) 99999-0000', 'Av. Exemplo, 123, Belo Horizonte, MG');

-- Usuarios
INSERT INTO usuarios (empresa_id, nome, email, senha_hash, papel) VALUES
  (1, 'Alice Vistoriadora', 'alice@vistoriapro.com', 'senha123', 'vistoriador'),
  (1, 'Bob Admin', 'bob@vistoriapro.com', 'senha123', 'admin');

-- Imoveis
INSERT INTO imoveis (empresa_id, nome, endereco_completo, unidade, cidade, uf, cep, tipo, observacoes) VALUES
  (1, 'Imóvel Exemplo', 'Rua das Flores, 100, Centro', 'Apto 101', 'Belo Horizonte', 'MG', '30123-456', 'Apartamento', 'Imóvel usado para testes.');

-- Vistorias
INSERT INTO vistorias (empresa_id, usuario_id, imovel_id, descricao, data, status, observacoes_gerais) VALUES
  (1, 1, 1, 'Vistoria inicial do imóvel', CURRENT_DATE, 'em_andamento', 'Vistoria de exemplo executada em ambiente de desenvolvimento.');

-- Cômodos da vistoria
INSERT INTO comodos_vistoria (vistoria_id, nome, observacoes, estado_geral) VALUES
  (1, 'Sala', 'Sala principal com janela ampla.', 'Bom'),
  (1, 'Cozinha', 'Pia precisa de limpeza.', 'Regular'),
  (1, 'Quarto', 'Nenhum problema visível.', 'Bom');

-- Fotos associadas
INSERT INTO fotos (vistoria_id, url, descricao, comodo_nome, comodo_id) VALUES
  (1, 'https://via.placeholder.com/640x480.png?text=Sala', 'Foto da sala', 'Sala', 1),
  (1, 'https://via.placeholder.com/640x480.png?text=Cozinha', 'Foto da cozinha', 'Cozinha', 2);

-- Transcrições vinculadas
INSERT INTO transcricoes (vistoria_id, url_audio, texto, foto_id, comodo_nome) VALUES
  (1, 'https://example.com/audio/001.mp3', 'Relatório verbal da vistoria da sala.', 1, 'Sala'),
  (1, 'https://example.com/audio/002.mp3', 'Relatório verbal da cozinha.', 2, 'Cozinha');

-- Locatários vinculados
INSERT INTO locatarios_vistoria (vistoria_id, nome, nacionalidade, profissao, cpf, rg, rg_orgao, rg_uf, endereco) VALUES
  (1, 'Carlos Silva', 'BR', 'Engenheiro', '123.456.789-00', 'MG-12.345.678', 'SSP', 'MG', 'Rua A, 123, BH');

COMMIT;
