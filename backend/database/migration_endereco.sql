-- Migracao: adiciona as colunas de endereco na tabela usuarios.
-- Use isto no banco que JA existe (o schema.sql so vale pra criar do zero).
-- Rode no SQL Editor do Supabase (ou ja foi aplicado pelo runner local).
-- "IF NOT EXISTS" deixa seguro rodar mais de uma vez sem dar erro.

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS estado      CHAR(2),
  ADD COLUMN IF NOT EXISTS cidade      VARCHAR(100),
  ADD COLUMN IF NOT EXISTS endereco    VARCHAR(200),
  ADD COLUMN IF NOT EXISTS bairro      VARCHAR(100),
  ADD COLUMN IF NOT EXISTS complemento VARCHAR(100);
