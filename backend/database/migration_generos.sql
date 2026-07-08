-- Adiciona a coluna de generos na tabela produtos.
-- Guarda os generos separados por virgula, ex: "Rock, Rock Progressivo, Arena Rock".
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS generos TEXT;
