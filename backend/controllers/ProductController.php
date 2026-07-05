<?php
/**
 * Controller Produto: decide o que responder nas rotas de produto.
 */
class ProductController
{
    // GET /produtos  -> lista todos
    public function index(PDO $pdo): void
    {
        echo json_encode(Product::all($pdo));
    }

    // GET /produtos/{id}  -> mostra um só
    public function show(PDO $pdo, string $id): void
    {
        $produto = Product::find($pdo, (int) $id);

        if (!$produto) {
            http_response_code(404);
            echo json_encode(['erro' => 'Produto não encontrado']);
            return;
        }

        echo json_encode($produto);
    }
}
