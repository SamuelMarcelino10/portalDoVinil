-- Esquema do banco (Postgres / Supabase)
-- Rode este arquivo no SQL Editor do Supabase.

CREATE TABLE usuarios (
  id            SERIAL PRIMARY KEY,
  nome          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  senha         TEXT NOT NULL,              -- guarda o hash, nunca a senha real
  tipo_usuario  CHAR(1) NOT NULL DEFAULT 'c'
                CHECK (tipo_usuario IN ('v', 'c')),  -- v = vendedor, c = cliente
  -- Endereco (preenchido no passo 2 do cadastro)
  estado        CHAR(2),
  cidade        VARCHAR(100),
  endereco      VARCHAR(200),
  bairro        VARCHAR(100),
  complemento   VARCHAR(100),
  criado_em     TIMESTAMP DEFAULT now()
);

CREATE TABLE produtos (
  id         SERIAL PRIMARY KEY,
  nome       TEXT NOT NULL,
  descricao  TEXT,
  preco      NUMERIC(10,2) NOT NULL,
  tipo       TEXT NOT NULL CHECK (tipo IN ('vinil', 'vitrola', 'cd')),
  artista    TEXT,
  estoque    INTEGER NOT NULL DEFAULT 0,
  imagem     TEXT,                          -- nome do arquivo ou URL da capa
  criado_em  TIMESTAMP DEFAULT now()
);

-- Carrinho: cada linha e um produto no carrinho de um usuario
CREATE TABLE carrinho (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  produto_id  INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade  INTEGER NOT NULL DEFAULT 1,
  criado_em   TIMESTAMP DEFAULT now(),
  UNIQUE (usuario_id, produto_id)  -- 1 linha por produto (adicionar de novo soma)
);

-- Alguns produtos de exemplo pra testar a API já com dados
INSERT INTO produtos (nome, descricao, preco, tipo, artista, estoque, imagem) VALUES
  ('A Night at the Opera', 'LP clássico de 1975', 289.00, 'vinil', 'Queen', 4, 'queen-a-night-at-the-opera-lp-removebg-preview.png'),
  ('Swimming', 'Álbum de 2018', 199.90, 'vinil', 'Mac Miller', 7, 'albumdeluxe.jpg'),
  ('Circles', 'Álbum póstumo', 219.90, 'cd', 'Mac Miller', 10, 'macmiller.jpeg');
