<?php
/**
 * Conexão com o banco (Supabase/Postgres) via PDO + configuração de CORS.
 * Este arquivo é incluído no início de tudo (public/index.php).
 */

// --- Carrega variáveis do .env (só em ambiente local; na Railway elas já vêm prontas) ---
$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) {
    foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linha) {
        if (str_starts_with(trim($linha), '#')) {
            continue; // ignora comentários
        }
        [$chave, $valor] = array_map('trim', explode('=', $linha, 2));
        putenv("$chave=$valor");
    }
}

// --- CORS: autoriza o site (Vercel) a chamar esta API ---
header('Access-Control-Allow-Origin: *'); // depois trocar '*' pelo domínio real do site
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// O navegador manda um "OPTIONS" antes do POST pra checar permissão. Respondemos e paramos.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// --- Conexão PDO com o Postgres ---
$host = getenv('DB_HOST');
$port = getenv('DB_PORT') ?: '5432';
$nome = getenv('DB_NAME');
$user = getenv('DB_USER');
$pass = getenv('DB_PASS');

try {
    $pdo = new PDO(
        "pgsql:host=$host;port=$port;dbname=$nome",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,   // erros viram exceções
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,         // resultados como array
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Falha ao conectar no banco de dados']);
    exit;
}
