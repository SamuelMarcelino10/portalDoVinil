-- Migracao: cria a tabela do carrinho.
-- Cada linha e um produto no carrinho de um usuario.
-- Rode no SQL Editor do Supabase (ou pelo runner local).

CREATE TABLE IF NOT EXISTS carrinho (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  produto_id  INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade  INTEGER NOT NULL DEFAULT 1,
  criado_em   TIMESTAMP DEFAULT now(),
  -- Um usuario so tem UMA linha por produto (adicionar de novo soma a quantidade)
  UNIQUE (usuario_id, produto_id)
);
