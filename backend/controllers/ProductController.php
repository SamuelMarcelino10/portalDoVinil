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

    // POST /produtos  -> cria um produto (form-data: campos de texto + foto)
    public function create(PDO $pdo): void
    {
        // Como vem foto junto, os dados chegam em form-data ($_POST / $_FILES),
        // e nao em JSON como nas outras rotas.
        $nome      = trim($_POST['nome'] ?? '');
        $artista   = trim($_POST['artista'] ?? '');
        $tipo      = trim($_POST['tipo'] ?? '');
        $generos   = trim($_POST['generos'] ?? '');
        $descricao = trim($_POST['descricao'] ?? '');
        $estoque   = (int) ($_POST['estoque'] ?? 0);

        // Preco: o frontend ja manda limpo (ex: "289.90"); aqui so viramos numero
        $preco = (float) str_replace(',', '.', (string) ($_POST['preco'] ?? ''));

        // Validacoes basicas
        if ($nome === '' || $tipo === '' || $preco <= 0) {
            http_response_code(422);
            echo json_encode(['erro' => 'Preencha ao menos nome, tipo e preço']);
            return;
        }
        if (!in_array($tipo, ['vinil', 'cd', 'vitrola'], true)) {
            http_response_code(422);
            echo json_encode(['erro' => 'Tipo de produto inválido']);
            return;
        }

        // Foto (opcional): se veio, sobe pro Storage e guarda a URL
        $imagemUrl = null;
        if (!empty($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
            $tmp  = $_FILES['foto']['tmp_name'];
            $mime = mime_content_type($tmp) ?: 'image/jpeg';
            $ext  = strtolower(pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION));

            $imagemUrl = Storage::upload($tmp, $mime, $ext);
            if ($imagemUrl === null) {
                http_response_code(500);
                echo json_encode(['erro' => 'Não foi possível enviar a imagem']);
                return;
            }
        }

        $id = Product::create($pdo, [
            'nome'      => $nome,
            'descricao' => $descricao ?: null,
            'preco'     => $preco,
            'tipo'      => $tipo,
            'artista'   => $artista ?: null,
            'estoque'   => $estoque,
            'imagem'    => $imagemUrl,
            'generos'   => $generos ?: null,
        ]);

        http_response_code(201);
        echo json_encode(['id' => $id, 'imagem' => $imagemUrl]);
    }
}
