-- Adicionar campos extras para detalhes do laudo de vistoria
-- TABELA IMOVEIS
ALTER TABLE imoveis 
  ADD COLUMN proprietario_nome VARCHAR(200),
  ADD COLUMN proprietario_cpf VARCHAR(20),
  ADD COLUMN proprietario_rg VARCHAR(30),
  ADD COLUMN proprietario_endereco TEXT,
  ADD COLUMN administradora_nome VARCHAR(200),
  ADD COLUMN administradora_cnpj VARCHAR(30),
  ADD COLUMN imovel_matricula VARCHAR(100),
  ADD COLUMN imovel_cartorio VARCHAR(100);

-- TABELA VISTORIAS
ALTER TABLE vistorias 
  ADD COLUMN numero_contrato VARCHAR(100),
  ADD COLUMN objeto TEXT,
  ADD COLUMN data_vistoria DATE;

-- Observação: após rodar este script, ajuste o backend para popular e ler esses campos corretamente.
