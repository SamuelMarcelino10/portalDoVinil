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

1. Peça o arquivo `.env` para o time e coloque na pasta `backend/`.
   Ele contém as credenciais do Supabase: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`.
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
