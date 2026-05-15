-- =============================================================================
-- VistoriaPro: alinhar schema do Supabase (Postgres remoto) ao repositório local
-- =============================================================================
-- Como usar:
-- 1. Supabase → SQL Editor → New query
-- 2. Cole este arquivo inteiro e execute (Run)
-- 3. Seguro para rodar mais de uma vez (idempotente na medida do possível)
--
-- Observação: não apaga dados. Não recria tabelas existentes com CREATE OR REPLACE.
-- Só cria o que falta (tipos, tabelas, colunas, índices).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------- Tipos enumerados --------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_vistoria') THEN
    CREATE TYPE status_vistoria AS ENUM ('em_andamento', 'finalizada', 'cancelada');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'papel_usuario') THEN
    CREATE TYPE papel_usuario AS ENUM ('admin', 'vistoriador', 'cliente');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_geral_comodo') THEN
    CREATE TYPE estado_geral_comodo AS ENUM ('Bom', 'Regular', 'Ruim');
  END IF;
END$$;

-- -------------------- Tabelas (novos projetos) --------------------
CREATE TABLE IF NOT EXISTS empresas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  cnpj VARCHAR(18) UNIQUE,
  email VARCHAR(200),
  telefone VARCHAR(30),
  whatsapp VARCHAR(30),
  endereco TEXT,
  site VARCHAR(200),
  instagram VARCHAR(120),
  responsavel_nome VARCHAR(200),
  creci VARCHAR(80),
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  senha_hash VARCHAR(200) NOT NULL,
  papel papel_usuario NOT NULL DEFAULT 'vistoriador',
  bloqueado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS imoveis (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  endereco_completo TEXT NOT NULL,
  unidade VARCHAR(50),
  cidade VARCHAR(100) NOT NULL,
  uf VARCHAR(2) NOT NULL,
  cep VARCHAR(20) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  proprietario_nome VARCHAR(200),
  proprietario_nacionalidade VARCHAR(100),
  proprietario_profissao VARCHAR(100),
  proprietario_cpf VARCHAR(20),
  proprietario_rg VARCHAR(30),
  proprietario_rg_orgao VARCHAR(30),
  proprietario_rg_uf VARCHAR(5),
  proprietario_endereco TEXT,
  administradora_nome VARCHAR(200),
  administradora_cnpj VARCHAR(30),
  administradora_endereco TEXT,
  socio_nome VARCHAR(200),
  socio_cpf VARCHAR(20),
  socio_profissao VARCHAR(100),
  representante_tipo VARCHAR(100),
  imovel_matricula VARCHAR(100),
  imovel_cartorio VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (empresa_id, nome, endereco_completo)
);

CREATE TABLE IF NOT EXISTS vistorias (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  imovel_id INTEGER NOT NULL REFERENCES imoveis(id) ON DELETE CASCADE,
  descricao TEXT,
  data DATE NOT NULL,
  status status_vistoria NOT NULL DEFAULT 'em_andamento',
  numero_contrato VARCHAR(100),
  objeto TEXT,
  data_vistoria DATE,
  observacoes_gerais TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comodos_vistoria (
  id SERIAL PRIMARY KEY,
  vistoria_id INTEGER NOT NULL REFERENCES vistorias(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  estado_geral estado_geral_comodo NOT NULL DEFAULT 'Bom'
);

CREATE TABLE IF NOT EXISTS fotos (
  id SERIAL PRIMARY KEY,
  vistoria_id INTEGER NOT NULL REFERENCES vistorias(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  descricao TEXT,
  comodo_nome VARCHAR(100),
  comodo_id INTEGER REFERENCES comodos_vistoria(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS relatorios (
  id SERIAL PRIMARY KEY,
  vistoria_id INTEGER NOT NULL REFERENCES vistorias(id) ON DELETE CASCADE,
  url_arquivo TEXT NOT NULL,
  dados_adicionais JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transcricoes (
  id SERIAL PRIMARY KEY,
  vistoria_id INTEGER NOT NULL REFERENCES vistorias(id) ON DELETE CASCADE,
  url_audio TEXT NOT NULL,
  texto TEXT NOT NULL,
  foto_id INTEGER REFERENCES fotos(id) ON DELETE SET NULL,
  comodo_nome VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locatarios_vistoria (
  id SERIAL PRIMARY KEY,
  vistoria_id INTEGER NOT NULL REFERENCES vistorias(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  nacionalidade VARCHAR(50),
  profissao VARCHAR(100),
  cpf VARCHAR(20),
  rg VARCHAR(30),
  rg_orgao VARCHAR(20),
  rg_uf VARCHAR(5),
  endereco TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -------------------- Colunas extras em bases antigas --------------------
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS telefone VARCHAR(30),
  ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(30),
  ADD COLUMN IF NOT EXISTS endereco TEXT,
  ADD COLUMN IF NOT EXISTS site VARCHAR(200),
  ADD COLUMN IF NOT EXISTS instagram VARCHAR(120),
  ADD COLUMN IF NOT EXISTS responsavel_nome VARCHAR(200),
  ADD COLUMN IF NOT EXISTS creci VARCHAR(80),
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS bloqueado BOOLEAN DEFAULT FALSE;

-- Se usuarios.papel ainda for TEXT/VARCHAR no seu projeto legado, converta manualmente para papel_usuario antes de usar este script em produção.

ALTER TABLE imoveis
  ADD COLUMN IF NOT EXISTS unidade VARCHAR(50),
  ADD COLUMN IF NOT EXISTS proprietario_nome VARCHAR(200),
  ADD COLUMN IF NOT EXISTS proprietario_nacionalidade VARCHAR(100),
  ADD COLUMN IF NOT EXISTS proprietario_profissao VARCHAR(100),
  ADD COLUMN IF NOT EXISTS proprietario_cpf VARCHAR(20),
  ADD COLUMN IF NOT EXISTS proprietario_rg VARCHAR(30),
  ADD COLUMN IF NOT EXISTS proprietario_rg_orgao VARCHAR(30),
  ADD COLUMN IF NOT EXISTS proprietario_rg_uf VARCHAR(5),
  ADD COLUMN IF NOT EXISTS proprietario_endereco TEXT,
  ADD COLUMN IF NOT EXISTS administradora_nome VARCHAR(200),
  ADD COLUMN IF NOT EXISTS administradora_cnpj VARCHAR(30),
  ADD COLUMN IF NOT EXISTS administradora_endereco TEXT,
  ADD COLUMN IF NOT EXISTS socio_nome VARCHAR(200),
  ADD COLUMN IF NOT EXISTS socio_cpf VARCHAR(20),
  ADD COLUMN IF NOT EXISTS socio_profissao VARCHAR(100),
  ADD COLUMN IF NOT EXISTS representante_tipo VARCHAR(100),
  ADD COLUMN IF NOT EXISTS imovel_matricula VARCHAR(100),
  ADD COLUMN IF NOT EXISTS imovel_cartorio VARCHAR(100),
  ADD COLUMN IF NOT EXISTS observacoes TEXT;

ALTER TABLE vistorias
  ADD COLUMN IF NOT EXISTS numero_contrato VARCHAR(100),
  ADD COLUMN IF NOT EXISTS objeto TEXT,
  ADD COLUMN IF NOT EXISTS data_vistoria DATE,
  ADD COLUMN IF NOT EXISTS observacoes_gerais TEXT;

ALTER TABLE comodos_vistoria
  ADD COLUMN IF NOT EXISTS estado_geral estado_geral_comodo NOT NULL DEFAULT 'Bom';

ALTER TABLE fotos
  ADD COLUMN IF NOT EXISTS comodo_nome VARCHAR(100),
  ADD COLUMN IF NOT EXISTS comodo_id INTEGER REFERENCES comodos_vistoria(id) ON DELETE SET NULL;

ALTER TABLE relatorios
  ADD COLUMN IF NOT EXISTS dados_adicionais JSONB;

ALTER TABLE transcricoes
  ADD COLUMN IF NOT EXISTS foto_id INTEGER REFERENCES fotos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS comodo_nome VARCHAR(100);

-- -------------------- Índices --------------------
CREATE INDEX IF NOT EXISTS idx_vistorias_empresa_id ON vistorias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_vistorias_imovel_id ON vistorias(imovel_id);
CREATE INDEX IF NOT EXISTS idx_fotos_vistoria_id ON fotos(vistoria_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_vistoria_id ON relatorios(vistoria_id);
CREATE INDEX IF NOT EXISTS idx_comodos_vistoria_vistoria_id ON comodos_vistoria(vistoria_id);
CREATE INDEX IF NOT EXISTS idx_transcricoes_vistoria_id ON transcricoes(vistoria_id);
CREATE INDEX IF NOT EXISTS idx_locatarios_vistoria_vistoria_id ON locatarios_vistoria(vistoria_id);

-- =============================================================================
-- Fim. Opcional: rode databases/banco.sql a partir da seção de seed se quiser
-- recriar usuário demo em ambiente vazio (não rode seed em produção com dados reais sem revisar).
-- =============================================================================
