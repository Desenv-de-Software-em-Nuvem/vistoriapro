-- =============================================================================
-- Migration: nomes de cômodos por empresa (VistoriaPro)
-- =============================================================================
-- PRODUÇÃO (Supabase):
--   1. Dashboard → SQL Editor → New query
--   2. Cole este arquivo inteiro e clique em Run
--   3. Confirme: Table Editor → empresa_comodos_config existe
--      e comodos_vistoria tem coluna comodo_key
--
-- Alternativa (local ou CI com DATABASE_URL do Supabase):
--   cd backend && npm run db:migrate:comodos
--   (use Connection string em Settings → Database → URI, com DB_SSL=true)
-- =============================================================================

-- Configuração de nomes de cômodos por empresa e tipo de imóvel
CREATE TABLE IF NOT EXISTS empresa_comodos_config (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo_imovel VARCHAR(50) NOT NULL,
  comodo_key VARCHAR(50) NOT NULL,
  nome_exibicao VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT empresa_comodos_config_unique UNIQUE (empresa_id, tipo_imovel, comodo_key)
);

CREATE INDEX IF NOT EXISTS idx_empresa_comodos_config_empresa_tipo
  ON empresa_comodos_config(empresa_id, tipo_imovel);

-- Chave estável do cômodo na vistoria (complementa nome exibido)
ALTER TABLE comodos_vistoria
  ADD COLUMN IF NOT EXISTS comodo_key VARCHAR(50);

CREATE UNIQUE INDEX IF NOT EXISTS comodos_vistoria_vistoria_comodo_key_unique
  ON comodos_vistoria(vistoria_id, comodo_key)
  WHERE comodo_key IS NOT NULL;

COMMENT ON TABLE empresa_comodos_config IS 'Rótulos customizados de cômodos por empresa e tipo de imóvel';
COMMENT ON COLUMN comodos_vistoria.comodo_key IS 'Identificador estável do cômodo (ex: sala_estar)';
