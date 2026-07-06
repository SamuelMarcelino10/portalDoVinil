<?php
/**
 * Mapa de rotas: qual URL chama qual método de qual controller.
 * As arrow functions (fn) capturam o $pdo automaticamente.
 */

// Status da API (abrir a URL no navegador mostra que esta no ar)
$router->get('/', fn() => print(json_encode(['api' => 'Portal do Vinil', 'status' => 'ok'])));

// Produtos
$router->get('/produtos',      fn()   => (new ProductController())->index($pdo));
$router->get('/produtos/{id}', fn($id) => (new ProductController())->show($pdo, $id));

// Autenticação
$router->post('/register', fn() => (new AuthController())->register($pdo));
$router->post('/login',    fn() => (new AuthController())->login($pdo));

// Carrinho
$router->get('/cart',         fn()   => (new CartController())->index($pdo));   // ?usuario_id=X
$router->post('/cart',        fn()   => (new CartController())->add($pdo));
$router->put('/cart/{id}',    fn($id) => (new CartController())->update($pdo, $id));
$router->delete('/cart/{id}', fn($id) => (new CartController())->remove($pdo, $id)); // ?usuario_id=X
