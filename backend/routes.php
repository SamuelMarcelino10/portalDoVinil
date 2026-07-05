<?php
/**
 * Mapa de rotas: qual URL chama qual método de qual controller.
 * As arrow functions (fn) capturam o $pdo automaticamente.
 */

// Produtos
$router->get('/produtos',      fn()   => (new ProductController())->index($pdo));
$router->get('/produtos/{id}', fn($id) => (new ProductController())->show($pdo, $id));

// Autenticação
$router->post('/register', fn() => (new AuthController())->register($pdo));
$router->post('/login',    fn() => (new AuthController())->login($pdo));

// Carrinho (esqueleto)
$router->get('/cart', fn() => (new CartController())->index($pdo));
