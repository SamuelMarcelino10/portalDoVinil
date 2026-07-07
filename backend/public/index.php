<?php
/**
 * Ponto de entrada da API. TODO request do frontend passa por aqui.
 * Fluxo: conecta no banco -> carrega as classes -> lê as rotas -> despacha.
 */

// 1. Conexão com o banco + CORS (cria a variável $pdo)
require __DIR__ . '/../config/database.php';

// 2. Carrega as classes (MVC simples, sem autoload)
require __DIR__ . '/../core/Router.php';
require __DIR__ . '/../core/Storage.php';
require __DIR__ . '/../models/Product.php';
require __DIR__ . '/../models/User.php';
require __DIR__ . '/../models/Cart.php';
require __DIR__ . '/../controllers/ProductController.php';
require __DIR__ . '/../controllers/AuthController.php';
require __DIR__ . '/../controllers/CartController.php';

// 3. Cria o router e registra as rotas (definidas em routes.php)
$router = new Router();
require __DIR__ . '/../routes.php';

// 4. Descobre qual rota foi chamada e executa
$router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
