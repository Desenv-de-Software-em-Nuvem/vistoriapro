-- Adicionar campos extras para alinhar com o modelo de laudo PDF
-- TABELA IMOVEIS
ALTER TABLE imoveis 
  ADD COLUMN proprietario_nacionalidade VARCHAR(100),
  ADD COLUMN proprietario_profissao VARCHAR(100),
  ADD COLUMN proprietario_rg_orgao VARCHAR(30),
  ADD COLUMN proprietario_rg_uf VARCHAR(5),
  ADD COLUMN administradora_endereco TEXT,
  ADD COLUMN socio_nome VARCHAR(200),
  ADD COLUMN socio_cpf VARCHAR(20),
  ADD COLUMN socio_profissao VARCHAR(100),
  ADD COLUMN representante_tipo VARCHAR(100);

-- Observação: após rodar este script, ajuste o frontend para coletar e enviar esses campos,
-- e o backend para salvar e buscar corretamente.
