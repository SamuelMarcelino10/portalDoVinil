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

    // Cria um produto novo e devolve o id gerado
    public static function create(PDO $pdo, array $d): int
    {
        $sql = "INSERT INTO produtos (nome, descricao, preco, tipo, artista, estoque, imagem, generos)
                VALUES (:nome, :descricao, :preco, :tipo, :artista, :estoque, :imagem, :generos)
                RETURNING id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'nome'      => $d['nome'],
            'descricao' => $d['descricao'],
            'preco'     => $d['preco'],
            'tipo'      => $d['tipo'],
            'artista'   => $d['artista'],
            'estoque'   => $d['estoque'],
            'imagem'    => $d['imagem'],
            'generos'   => $d['generos'],
        ]);
        return (int) $stmt->fetchColumn();
    }

    // Apaga um produto (o carrinho some junto pela regra de cascata do banco)
    public static function delete(PDO $pdo, int $id): void
    {
        $stmt = $pdo->prepare("DELETE FROM produtos WHERE id = :id");
        $stmt->execute(['id' => $id]);
    }
}
