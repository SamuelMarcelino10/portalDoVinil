<?php
/**
 * Model Usuario: tudo que fala com a tabela "usuarios" no banco.
 */
class User
{
    // Procura um usuário pelo email (usado no login e pra impedir email duplicado)
    public static function findByEmail(PDO $pdo, string $email): ?array
    {
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = :email");
        $stmt->execute(['email' => $email]);
        $usuario = $stmt->fetch();
        return $usuario ?: null;
    }

    // Cria um novo usuário. A senha já deve chegar aqui como hash.
    // Recebe um array com: nome, email, senha (hash) e os campos de endereço.
    public static function create(PDO $pdo, array $dados): int
    {
        // IMPORTANTE: tipo_usuario NÃO vem da interface. O servidor grava
        // sempre 'c' (cliente) aqui, então o usuário não pode se tornar vendedor
        // pela tela de cadastro.
        $stmt = $pdo->prepare(
            "INSERT INTO usuarios
                (nome, email, senha, tipo_usuario, estado, cidade, endereco, bairro, complemento)
             VALUES
                (:nome, :email, :senha, 'c', :estado, :cidade, :endereco, :bairro, :complemento)
             RETURNING id"
        );
        $stmt->execute([
            'nome'        => $dados['nome'],
            'email'       => $dados['email'],
            'senha'       => $dados['senha'],
            'estado'      => $dados['estado'] ?? null,
            'cidade'      => $dados['cidade'] ?? null,
            'endereco'    => $dados['endereco'] ?? null,
            'bairro'      => $dados['bairro'] ?? null,
            'complemento' => $dados['complemento'] ?? null,
        ]);
        return (int) $stmt->fetchColumn();
    }
}
