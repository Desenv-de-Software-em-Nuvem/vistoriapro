-- Migration: Aumentar tamanho do campo senha_hash
-- Descrição: Altera o tamanho de senha_hash de 200 para 255 caracteres
-- para acomodar hashes bcrypt de 60 caracteres com margem de segurança
-- Data: 17 de março de 2026

-- Aumentar o tamanho da coluna senha_hash na tabela usuarios
ALTER TABLE usuarios
ALTER COLUMN senha_hash TYPE VARCHAR(255);

-- Comentário explicativo
COMMENT ON COLUMN usuarios.senha_hash IS 'Hash bcrypt da senha do usuário (60+ caracteres)';
