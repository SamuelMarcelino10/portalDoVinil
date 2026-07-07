-- Adiciona a coluna de generos na tabela produtos.
-- Guarda os generos separados por virgula, ex: "Rock, Rock Progressivo, Arena Rock".
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS generos TEXT;

-- Preenche os produtos que ja existiam
UPDATE produtos SET generos = 'Rock, Rock Progressivo, Arena Rock' WHERE nome = 'A Night at the Opera' AND artista = 'Queen';
UPDATE produtos SET generos = 'Hip Hop' WHERE nome = 'Swimming' AND artista = 'Mac Miller';
UPDATE produtos SET generos = 'Hip Hop' WHERE nome = 'Circles'  AND artista = 'Mac Miller';
