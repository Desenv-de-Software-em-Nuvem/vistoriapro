-- =========================
-- ENUMS
-- =========================
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

-- =========================
-- TABELA VISTORIAS
-- =========================
CREATE TABLE IF NOT EXISTS vistorias (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE SET NULL,
  imovel_id INTEGER NOT NULL REFERENCES imoveis(id) ON DELETE CASCADE,
  descricao TEXT,
  data DATE NOT NULL,
  status status_vistoria NOT NULL DEFAULT 'em_andamento',
  observacoes_gerais TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABELA COMODOS_VISTORIA
-- =========================
CREATE TABLE IF NOT EXISTS comodos_vistoria (
  id SERIAL PRIMARY KEY,
  vistoria_id INTEGER NOT NULL REFERENCES vistorias(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  observacoes TEXT,
  estado_geral estado_geral_comodo NOT NULL DEFAULT 'Bom'
);

-- =========================
-- TABELA FOTOS
-- =========================
CREATE TABLE IF NOT EXISTS fotos (
  id SERIAL PRIMARY KEY,
  vistoria_id INTEGER NOT NULL REFERENCES vistorias(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  descricao TEXT,
  comodo_nome VARCHAR(100),
  comodo_id INTEGER REFERENCES comodos_vistoria(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABELA TRANSCRICOES
-- =========================
CREATE TABLE IF NOT EXISTS transcricoes (
  id SERIAL PRIMARY KEY,
  vistoria_id INTEGER NOT NULL REFERENCES vistorias(id) ON DELETE CASCADE,
  url_audio TEXT NOT NULL,
  texto TEXT NOT NULL,
  foto_id INTEGER REFERENCES fotos(id) ON DELETE SET NULL,
  comodo_nome VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TABELA LOCATARIOS_VISTORIA
-- =========================
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

-- =========================
-- ÍNDICES
-- =========================
CREATE INDEX IF NOT EXISTS idx_vistorias_empresa_id ON vistorias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_vistorias_imovel_id ON vistorias(imovel_id);
CREATE INDEX IF NOT EXISTS idx_fotos_vistoria_id ON fotos(vistoria_id);
CREATE INDEX IF NOT EXISTS idx_comodos_vistoria_vistoria_id ON comodos_vistoria(vistoria_id);
CREATE INDEX IF NOT EXISTS idx_transcricoes_vistoria_id ON transcricoes(vistoria_id);
CREATE INDEX IF NOT EXISTS idx_locatarios_vistoria_vistoria_id ON locatarios_vistoria(vistoria_id);

-- =========================
-- COMENTÁRIOS (DOCUMENTAÇÃO)
-- =========================
COMMENT ON TYPE papel_usuario IS 'admin: administrador do sistema, vistoriador: responsável por vistorias, cliente: usuário final';
COMMENT ON TYPE status_vistoria IS 'Status do ciclo da vistoria';
COMMENT ON TYPE estado_geral_comodo IS 'Estado geral do cômodo: Bom, Regular, Ruim';
COMMENT ON COLUMN usuarios.papel IS 'Papel do usuário no sistema';
COMMENT ON COLUMN vistorias.status IS 'Status da vistoria';
COMMENT ON COLUMN comodos_vistoria.estado_geral IS 'Estado geral do cômodo';
COMMENT ON COLUMN fotos.comodo_id IS 'Referência para o cômodo da vistoria';
COMMENT ON COLUMN transcricoes.foto_id IS 'Referência para a foto associada à transcrição';