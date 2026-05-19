-- Remove o papel "cliente" do enum papel_usuario (Supabase / Postgres)
-- Idempotente: pode rodar após falha parcial (ex.: erro 42804 no DEFAULT).

-- 1) Usuários com papel cliente → vistoriador
UPDATE usuarios
SET papel = 'vistoriador'
WHERE papel::text = 'cliente';

DO $$
BEGIN
  -- 2a) Recovery: migration parou depois de criar o enum novo (papel_usuario_old existe)
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'papel_usuario_old')
     AND EXISTS (SELECT 1 FROM pg_type WHERE typname = 'papel_usuario')
     AND NOT EXISTS (
       SELECT 1 FROM pg_enum e
       JOIN pg_type t ON t.oid = e.enumtypid
       WHERE t.typname = 'papel_usuario' AND e.enumlabel = 'cliente'
     ) THEN
    ALTER TABLE usuarios ALTER COLUMN papel DROP DEFAULT;
    ALTER TABLE usuarios
      ALTER COLUMN papel TYPE papel_usuario
      USING (papel::text::papel_usuario);
    ALTER TABLE usuarios
      ALTER COLUMN papel SET DEFAULT 'vistoriador'::papel_usuario;
    DROP TYPE papel_usuario_old;
    RETURN;
  END IF;

  -- 2b) Migração completa: enum antigo ainda tem valor 'cliente'
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'papel_usuario' AND e.enumlabel = 'cliente'
  ) THEN
    ALTER TABLE usuarios ALTER COLUMN papel DROP DEFAULT;

    ALTER TYPE papel_usuario RENAME TO papel_usuario_old;
    CREATE TYPE papel_usuario AS ENUM ('admin', 'vistoriador');

    ALTER TABLE usuarios
      ALTER COLUMN papel TYPE papel_usuario
      USING (papel::text::papel_usuario);

    ALTER TABLE usuarios
      ALTER COLUMN papel SET DEFAULT 'vistoriador'::papel_usuario;

    DROP TYPE papel_usuario_old;
  END IF;
END$$;

COMMENT ON TYPE papel_usuario IS 'admin: administrador do sistema, vistoriador: responsável por vistorias';
