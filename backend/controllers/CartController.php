<?php
/**
 * Controller Carrinho: por enquanto é um esqueleto.
 * Quando criarmos a tabela de carrinho, a lógica entra aqui.
 */
class CartController
{
    // GET /cart  -> placeholder
    public function index(PDO $pdo): void
    {
        echo json_encode([
            'mensagem' => 'Carrinho ainda não implementado',
            'itens'    => [],
        ]);
    }
}
