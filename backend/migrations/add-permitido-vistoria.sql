-- Adiciona o campo permitido_vistoria à tabela de usuários
ALTER TABLE usuarios ADD COLUMN permitido_vistoria BOOLEAN DEFAULT TRUE;

-- Atualiza o model/backend para considerar o novo campo nas queries e updates.
