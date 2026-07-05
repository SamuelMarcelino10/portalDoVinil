<?php
/**
 * Model Produto: tudo que fala com a tabela "produtos" no banco.
 */
class Product
{
    // Lista todos os produtos
    public static function all(PDO $pdo): array
    {
        return $pdo->query("SELECT * FROM produtos ORDER BY id")->fetchAll();
    }

    // Busca um produto pelo id (retorna o produto ou null se não achar)
    public static function find(PDO $pdo, int $id): ?array
    {
        $stmt = $pdo->prepare("SELECT * FROM produtos WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $produto = $stmt->fetch();
        return $produto ?: null;
    }
}
