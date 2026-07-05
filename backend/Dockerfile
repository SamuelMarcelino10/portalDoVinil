# Receita que o Render usa pra construir e rodar o backend.
# Voce nao precisa instalar Docker nem mexer neste arquivo.

# 1) Comeca a partir do PHP 8.2
FROM php:8.2-cli

# 2) Instala a extensao pdo_pgsql (pra o PHP falar com o Postgres/Supabase)
RUN apt-get update \
    && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo_pgsql pgsql \
    && rm -rf /var/lib/apt/lists/*

# 3) Copia o codigo do backend pra dentro
WORKDIR /app
COPY . /app

# 4) Liga o servidor do PHP (a plataforma escolhe a porta pela variavel PORT)
EXPOSE 8080
CMD php -S 0.0.0.0:${PORT:-8080} -t public public/index.php
