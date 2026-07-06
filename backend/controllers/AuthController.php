<?php
/**
 * Controller Auth: cadastro e login de usuários.
 */
class AuthController
{
    // Lê o corpo JSON da requisição (o que o frontend manda no fetch)
    private function corpo(): array
    {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }

    // POST /register  -> cria um usuário novo
    public function register(PDO $pdo): void
    {
        $dados = $this->corpo();
        $nome  = trim($dados['nome'] ?? '');
        $email = trim($dados['email'] ?? '');
        $senha = $dados['senha'] ?? '';

        if ($nome === '' || $email === '' || $senha === '') {
            http_response_code(422);
            echo json_encode(['erro' => 'Preencha nome, email e senha']);
            return;
        }

        if (User::findByEmail($pdo, $email)) {
            http_response_code(409);
            echo json_encode(['erro' => 'Esse email já está cadastrado']);
            return;
        }

        // Uma funcaozinha pra limpar cada campo de endereco (vazio vira null)
        $opcional = fn(string $campo) => (trim($dados[$campo] ?? '') ?: null);

        // password_hash embaralha a senha antes de salvar.
        // Nao lemos 'tipo_usuario' do corpo: o servidor decide (sempre 'c').
        $id = User::create($pdo, [
            'nome'        => $nome,
            'email'       => $email,
            'senha'       => password_hash($senha, PASSWORD_DEFAULT),
            'estado'      => $opcional('estado'),
            'cidade'      => $opcional('cidade'),
            'endereco'    => $opcional('endereco'),
            'bairro'      => $opcional('bairro'),
            'complemento' => $opcional('complemento'),
        ]);

        http_response_code(201);
        echo json_encode(['id' => $id, 'nome' => $nome, 'email' => $email]);
    }

    // POST /login  -> valida email + senha
    public function login(PDO $pdo): void
    {
        $dados = $this->corpo();
        $email = trim($dados['email'] ?? '');
        $senha = $dados['senha'] ?? '';

        $usuario = User::findByEmail($pdo, $email);

        // password_verify compara a senha digitada com o hash salvo
        if (!$usuario || !password_verify($senha, $usuario['senha'])) {
            http_response_code(401);
            echo json_encode(['erro' => 'Email ou senha inválidos']);
            return;
        }

        // Nunca devolvemos a senha (nem o hash) pro frontend.
        unset($usuario['senha']);
        echo json_encode([
            'mensagem' => 'Login realizado com sucesso',
            'usuario'  => $usuario,
            // Depois: aqui geramos um token pra deixar o login "mais robusto".
        ]);
    }
}
