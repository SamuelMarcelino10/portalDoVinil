<?php
/**
 * Model Carrinho: tudo que fala com a tabela "carrinho" no banco.
 */
class Cart
{
    // Adiciona um produto ao carrinho. Se ja existir, SOMA a quantidade.
    public static function add(PDO $pdo, int $usuarioId, int $produtoId, int $quantidade): void
    {
        $stmt = $pdo->prepare(
            "INSERT INTO carrinho (usuario_id, produto_id, quantidade)
             VALUES (:u, :p, :q)
             ON CONFLICT (usuario_id, produto_id)
             DO UPDATE SET quantidade = carrinho.quantidade + EXCLUDED.quantidade"
        );
        $stmt->execute(['u' => $usuarioId, 'p' => $produtoId, 'q' => $quantidade]);
    }

    // Lista os itens do carrinho de um usuario, ja com os dados do produto.
    public static function listByUser(PDO $pdo, int $usuarioId): array
    {
        $stmt = $pdo->prepare(
            "SELECT c.id, c.quantidade,
                    p.id AS produto_id, p.nome, p.artista, p.preco, p.imagem, p.estoque
             FROM carrinho c
             JOIN produtos p ON p.id = c.produto_id
             WHERE c.usuario_id = :u
             ORDER BY c.id"
        );
        $stmt->execute(['u' => $usuarioId]);
        return $stmt->fetchAll();
    }

    // Atualiza a quantidade de um item (do proprio usuario).
    public static function updateQty(PDO $pdo, int $itemId, int $usuarioId, int $quantidade): void
    {
        $stmt = $pdo->prepare(
            "UPDATE carrinho SET quantidade = :q WHERE id = :id AND usuario_id = :u"
        );
        $stmt->execute(['q' => $quantidade, 'id' => $itemId, 'u' => $usuarioId]);
    }

    // Remove um item do carrinho (do proprio usuario).
    public static function remove(PDO $pdo, int $itemId, int $usuarioId): void
    {
        $stmt = $pdo->prepare("DELETE FROM carrinho WHERE id = :id AND usuario_id = :u");
        $stmt->execute(['id' => $itemId, 'u' => $usuarioId]);
    }

    // Finaliza a compra: da baixa no estoque de cada item e esvazia o carrinho.
    // Faz tudo numa transacao (ou tudo da certo, ou nada muda).
    // Retorna ['ok' => bool, 'erro' => string|null].
    public static function checkout(PDO $pdo, int $usuarioId): array
    {
        $itens = self::listByUser($pdo, $usuarioId);
        if (!$itens) {
            return ['ok' => false, 'erro' => 'Seu carrinho está vazio'];
        }

        // Confere se tem estoque suficiente pra todos antes de mexer em nada
        foreach ($itens as $item) {
            if ((int) $item['quantidade'] > (int) $item['estoque']) {
                return ['ok' => false, 'erro' => "Estoque insuficiente para {$item['nome']}"];
            }
        }

        $pdo->beginTransaction();
        try {
            $baixa = $pdo->prepare("UPDATE produtos SET estoque = estoque - :q WHERE id = :p");
            foreach ($itens as $item) {
                $baixa->execute(['q' => $item['quantidade'], 'p' => $item['produto_id']]);
            }
            $pdo->prepare("DELETE FROM carrinho WHERE usuario_id = :u")->execute(['u' => $usuarioId]);
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            return ['ok' => false, 'erro' => 'Falha ao processar o pagamento'];
        }

        return ['ok' => true, 'erro' => null];
    }
}
