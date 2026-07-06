<?php
/**
 * Controller Carrinho: adicionar, listar, atualizar e remover itens.
 * O carrinho pertence a um usuario (usuario_id), entao ele precisa estar logado.
 */
class CartController
{
    // Le o corpo JSON da requisicao (o que o frontend manda no fetch)
    private function corpo(): array
    {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }

    // GET /cart?usuario_id=X  -> lista os itens do carrinho do usuario
    public function index(PDO $pdo): void
    {
        $usuarioId = (int) ($_GET['usuario_id'] ?? 0);
        if ($usuarioId <= 0) {
            http_response_code(422);
            echo json_encode(['erro' => 'usuario_id é obrigatório']);
            return;
        }
        echo json_encode(Cart::listByUser($pdo, $usuarioId));
    }

    // POST /cart  -> adiciona um produto ao carrinho
    public function add(PDO $pdo): void
    {
        $dados = $this->corpo();
        $usuarioId = (int) ($dados['usuario_id'] ?? 0);
        $produtoId = (int) ($dados['produto_id'] ?? 0);
        $quantidade = max(1, (int) ($dados['quantidade'] ?? 1));

        if ($usuarioId <= 0 || $produtoId <= 0) {
            http_response_code(422);
            echo json_encode(['erro' => 'usuario_id e produto_id são obrigatórios']);
            return;
        }

        Cart::add($pdo, $usuarioId, $produtoId, $quantidade);
        http_response_code(201);
        echo json_encode(['mensagem' => 'Produto adicionado ao carrinho']);
    }

    // PUT /cart/{id}  -> muda a quantidade de um item
    public function update(PDO $pdo, string $id): void
    {
        $dados = $this->corpo();
        $usuarioId = (int) ($dados['usuario_id'] ?? 0);
        $quantidade = max(1, (int) ($dados['quantidade'] ?? 1));

        if ($usuarioId <= 0) {
            http_response_code(422);
            echo json_encode(['erro' => 'usuario_id é obrigatório']);
            return;
        }

        Cart::updateQty($pdo, (int) $id, $usuarioId, $quantidade);
        echo json_encode(['mensagem' => 'Quantidade atualizada']);
    }

    // DELETE /cart/{id}?usuario_id=X  -> remove um item
    public function remove(PDO $pdo, string $id): void
    {
        $usuarioId = (int) ($_GET['usuario_id'] ?? 0);
        if ($usuarioId <= 0) {
            http_response_code(422);
            echo json_encode(['erro' => 'usuario_id é obrigatório']);
            return;
        }

        Cart::remove($pdo, (int) $id, $usuarioId);
        echo json_encode(['mensagem' => 'Item removido']);
    }
}
