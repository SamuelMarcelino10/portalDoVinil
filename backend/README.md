# Backend — Portal do Vinil

API em PHP puro (PDO) com uma estrutura MVC leve. Serve dados em JSON para o
frontend (hospedado na Vercel). Banco de dados no Supabase (Postgres).

## Estrutura

```
backend/
├── public/index.php     # ponto de entrada (todo request passa aqui)
├── config/database.php  # conexão PDO + CORS
├── core/Router.php      # decide qual controller chamar
├── controllers/         # a lógica de cada recurso
├── models/              # as queries no banco
├── routes.php           # mapa de rotas
└── database/schema.sql  # criação das tabelas (rodar no Supabase)
```

## Rodando localmente

1. Copie `.env.example` para `.env` e preencha com os dados do Supabase.
2. Suba o servidor de desenvolvimento do PHP:

   ```
   php -S localhost:8000 -t public public/index.php
   ```

3. Teste no navegador ou via fetch:

   ```
   http://localhost:8000/produtos
   ```

## Rotas disponíveis

| Método | Rota            | O que faz                         |
|--------|-----------------|-----------------------------------|
| GET    | /produtos       | Lista todos os produtos           |
| GET    | /produtos/{id}  | Mostra um produto                 |
| POST   | /register       | Cadastra usuário (nome/email/senha) |
| POST   | /login          | Valida email + senha              |
| GET    | /cart           | (esqueleto, ainda não implementado) |
