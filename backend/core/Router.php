<?php
/**
 * Router leve: guarda as rotas e descobre qual função chamar
 * com base no método (GET/POST) e no caminho da URL.
 */
class Router
{
    private array $rotas = [];

    public function get(string $caminho, callable $acao): void
    {
        $this->rotas[] = ['GET', $caminho, $acao];
    }

    public function post(string $caminho, callable $acao): void
    {
        $this->rotas[] = ['POST', $caminho, $acao];
    }

    public function put(string $caminho, callable $acao): void
    {
        $this->rotas[] = ['PUT', $caminho, $acao];
    }

    public function delete(string $caminho, callable $acao): void
    {
        $this->rotas[] = ['DELETE', $caminho, $acao];
    }

    public function dispatch(string $metodo, string $uri): void
    {
        // remove a query string (?q=...) e barras finais
        $uri = rtrim(parse_url($uri, PHP_URL_PATH), '/') ?: '/';

        foreach ($this->rotas as [$rotaMetodo, $rotaCaminho, $acao]) {
            // transforma "/produtos/{id}" em uma expressão que captura o id
            $padrao = preg_replace('#\{[^/]+\}#', '([^/]+)', $rotaCaminho);
            $padrao = "#^" . $padrao . "$#";

            if ($rotaMetodo === $metodo && preg_match($padrao, $uri, $params)) {
                array_shift($params); // remove o match completo, sobram os parâmetros
                call_user_func_array($acao, $params);
                return;
            }
        }

        http_response_code(404);
        echo json_encode(['erro' => 'Rota não encontrada']);
    }
}
