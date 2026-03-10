-- =========================
-- TABELA EMPRESAS
-- =========================
CREATE TABLE IF NOT EXISTS empresas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  cnpj VARCHAR(18) UNIQUE,
  email VARCHAR(200),
  telefone VARCHAR(30),
  endereco TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABELA USUARIOS
-- =========================
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  senha_hash VARCHAR(200) NOT NULL,
  papel papel_usuario NOT NULL DEFAULT 'vistoriador',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABELA IMOVEIS
-- =========================
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
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (empresa_id, nome, endereco_completo)
);
