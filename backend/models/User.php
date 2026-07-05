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
    public static function create(PDO $pdo, string $nome, string $email, string $senhaHash, string $tipo = 'c'): int
    {
        $stmt = $pdo->prepare(
            "INSERT INTO usuarios (nome, email, senha, tipo_usuario)
             VALUES (:nome, :email, :senha, :tipo)
             RETURNING id"
        );
        $stmt->execute([
            'nome'  => $nome,
            'email' => $email,
            'senha' => $senhaHash,
            'tipo'  => $tipo,
        ]);
        return (int) $stmt->fetchColumn();
    }
}
