const searchInput = document.getElementById("searchInput");
const priceMin = document.getElementById("priceMin");
const priceMax = document.getElementById("priceMax");
const priceMaxLabel = document.getElementById("priceMaxLabel");
const priceMinLabel = document.getElementById("priceMinLabel");
const genreButtons = document.querySelectorAll(".genre-pill");
const filterCount = document.getElementById("filterCount");
const resultCards = document.querySelectorAll("[data-product]");
const urlParams = new URLSearchParams(window.location.search);
const queryParam = urlParams.get("q");

if (searchInput && queryParam) {
  searchInput.value = queryParam;
}

// Endereco do backend (API PHP no Render) - usado no login e no cadastro
const API_URL = "https://portaldovinil.onrender.com";

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  const loginErro = document.getElementById("loginErro");
  const loginBotao = loginForm.querySelector("button[type='submit']");

  // Se veio do cadastro com sucesso, mostra um aviso verde
  if (urlParams.get("cadastro") === "ok" && loginErro) {
    loginErro.classList.add("is-ok");
    loginErro.textContent = "Cadastro realizado! Faça o seu login.";
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = loginForm.user.value.trim();
    const senha = loginForm.password.value;

    // Limpa aviso anterior e trava o botao enquanto espera a resposta
    if (loginErro) {
      loginErro.textContent = "";
      loginErro.classList.remove("is-ok");
    }
    loginBotao.disabled = true;
    loginBotao.textContent = "Entrando...";

    try {
      const resposta = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resposta.json();

      // Se a API respondeu com erro (ex: 401 email/senha errados)
      if (!resposta.ok) {
        if (loginErro) loginErro.textContent = dados.erro || "Não foi possível entrar.";
        return;
      }

      // Deu certo: guarda o usuario logado no navegador e vai pra home
      localStorage.setItem("usuario", JSON.stringify(dados.usuario));
      window.location.href = "../index.html";
    } catch {
      if (loginErro) {
        loginErro.textContent = "Servidor indisponível. Tente de novo em alguns segundos.";
      }
    } finally {
      // Libera o botao de volta (deu certo ou nao)
      loginBotao.disabled = false;
      loginBotao.textContent = "Fazer Login";
    }
  });
}

// --- Cadastro em 2 passos ---
const cadastroStep1 = document.getElementById("cadastroStep1");
const cadastroStep2 = document.getElementById("cadastroStep2");

if (cadastroStep1 && cadastroStep2) {
  const cadastroErro1 = document.getElementById("cadastroErro1");

  // Passo 1 -> valida senha e termos, depois revela o passo 2
  cadastroStep1.addEventListener("submit", (event) => {
    event.preventDefault();
    if (cadastroErro1) cadastroErro1.textContent = "";

    const senha = cadastroStep1.senha.value;
    const senha2 = cadastroStep1.senha2.value;

    if (senha !== senha2) {
      if (cadastroErro1) cadastroErro1.textContent = "As senhas não são iguais.";
      return;
    }

    // Esconde o passo 1 e mostra o passo 2
    cadastroStep1.classList.add("is-hidden");
    cadastroStep2.classList.remove("is-hidden");
  });

  // Passo 2 -> junta os dados dos 2 passos e cria a conta na API
  const cadastroErro2 = document.getElementById("cadastroErro2");

  cadastroStep2.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (cadastroErro2) cadastroErro2.textContent = "";

    const botao = cadastroStep2.querySelector("button[type='submit']");
    botao.disabled = true;
    botao.textContent = "Enviando...";

    // email e senha vem do passo 1; o resto do passo 2.
    // (tipo_usuario NAO e enviado: quem decide isso e o servidor.)
    const dados = {
      nome: cadastroStep2.nome.value.trim(),
      email: cadastroStep1.email.value.trim(),
      senha: cadastroStep1.senha.value,
      estado: cadastroStep2.estado.value,
      cidade: cadastroStep2.cidade.value.trim(),
      endereco: cadastroStep2.endereco.value.trim(),
      bairro: cadastroStep2.bairro.value.trim(),
      complemento: cadastroStep2.complemento.value.trim(),
    };

    try {
      const resposta = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      const corpo = await resposta.json();

      // Ex: 409 email ja cadastrado, 422 faltou campo
      if (!resposta.ok) {
        if (cadastroErro2) cadastroErro2.textContent = corpo.erro || "Não foi possível cadastrar.";
        return;
      }

      // Deu certo: vai pra tela de login com um aviso de sucesso
      window.location.href = "login.html?cadastro=ok";
    } catch {
      if (cadastroErro2) {
        cadastroErro2.textContent = "Servidor indisponível. Tente de novo em alguns segundos.";
      }
    } finally {
      botao.disabled = false;
      botao.textContent = "Finalizar o cadastro";
    }
  });
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function applyFilters() {
  if (!searchInput || !priceMin || !priceMax || !priceMinLabel || !priceMaxLabel || !filterCount || !resultCards.length) {
    return;
  }

  const query = searchInput.value.trim().toLowerCase();
  const min = Number(priceMin.value);
  const max = Number(priceMax.value);
  const activeGenres = [...genreButtons]
    .filter((button) => button.classList.contains("is-active"))
    .map((button) => button.dataset.genre);

  priceMinLabel.textContent = min === 0 ? "Qualquer valor" : `A partir de ${formatCurrency(min)}`;
  priceMaxLabel.textContent = `Até ${formatCurrency(max)}`;
  filterCount.textContent = `(${activeGenres.length || 1})`;

  resultCards.forEach((card) => {
    const title = card.dataset.title.toLowerCase();
    const genre = card.dataset.genre;
    const price = Number(card.dataset.price);

    const matchesQuery = title.includes(query);
    const matchesPrice = price >= min && price <= max;
    const matchesGenre = activeGenres.length === 0 || activeGenres.includes(genre);

    card.classList.toggle("is-hidden", !(matchesQuery && matchesPrice && matchesGenre));
  });
}

if (searchInput && priceMin && priceMax) {
  genreButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.genre === "Rock" && button.classList.contains("is-active")) {
        button.classList.remove("is-active");
      } else {
        button.classList.toggle("is-active");
      }

      applyFilters();
    });
  });

  [searchInput, priceMin, priceMax].forEach((field) => {
    field.addEventListener("input", applyFilters);
  });

  applyFilters();
}

// --- Pagina de produto: busca o produto pelo id da URL e preenche a tela ---
const produtoNome = document.getElementById("produtoNome");

if (produtoNome) {
  // Formata um numero como preco em Real com centavos (ex: 289 -> "R$ 289,00")
  const emReais = (valor) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

  const id = urlParams.get("id");

  const elImagem = document.getElementById("produtoImagem");
  const elPreco = document.getElementById("produtoPreco");
  const elParcelas = document.getElementById("produtoParcelas");
  const elDescricao = document.getElementById("produtoDescricao");
  const elDetalhes = document.getElementById("produtoDetalhes");

  // --- Controle de quantidade (usa o estoque real depois do fetch) ---
  const quantityValue = document.getElementById("quantityValue");
  const qtyDown = document.getElementById("qtyDown");
  const qtyUp = document.getElementById("qtyUp");
  const stockLabel = document.getElementById("stockLabel");
  let quantidade = 1;
  let estoque = 1;

  function renderQuantidade() {
    quantityValue.textContent = quantidade;
    stockLabel.textContent = `${estoque - quantidade} disponível(is)`;
    qtyDown.disabled = quantidade <= 1;
    qtyUp.disabled = quantidade >= estoque;
  }
  qtyDown.addEventListener("click", () => {
    quantidade = Math.max(1, quantidade - 1);
    renderQuantidade();
  });
  qtyUp.addEventListener("click", () => {
    quantidade = Math.min(estoque, quantidade + 1);
    renderQuantidade();
  });

  // --- Frete: o botao "Calcular" so revela o resultado (valores de exemplo) ---
  const btnCalcular = document.getElementById("btn-calcular");
  const cepInput = document.getElementById("cep-input");
  const resultadoFrete = document.getElementById("resultado-frete");
  if (resultadoFrete) resultadoFrete.style.display = "none";
  if (btnCalcular) {
    btnCalcular.addEventListener("click", () => {
      const cep = cepInput.value.replace(/\D/g, "");
      if (cep.length < 8) {
        cepInput.focus();
        return;
      }
      resultadoFrete.style.display = "block";
    });
  }

  // --- Botao "Adicionar ao carrinho" ---
  const btnCarrinho = document.getElementById("btn-carrinho");
  if (btnCarrinho) {
    btnCarrinho.addEventListener("click", async () => {
      // Precisa estar logado (o carrinho pertence a um usuario)
      const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
      if (!usuario) {
        alert("Você precisa estar logado para adicionar ao carrinho.");
        window.location.href = "login.html";
        return;
      }

      const textoOriginal = btnCarrinho.textContent;
      btnCarrinho.disabled = true;
      btnCarrinho.textContent = "Adicionando...";

      try {
        const resposta = await fetch(`${API_URL}/cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuario_id: usuario.id,
            produto_id: Number(id),
            quantidade: quantidade,
          }),
        });

        if (!resposta.ok) throw new Error();

        // Feedback rapido de sucesso
        btnCarrinho.textContent = "Adicionado ✓";
        setTimeout(() => {
          btnCarrinho.textContent = textoOriginal;
          btnCarrinho.disabled = false;
        }, 1500);
      } catch {
        btnCarrinho.textContent = textoOriginal;
        btnCarrinho.disabled = false;
        alert("Não foi possível adicionar ao carrinho. Tente de novo.");
      }
    });
  }

  // Preenche a tela com os dados do produto vindo da API
  function mostrarProduto(p) {
    document.title = `Portal do Vinil | ${p.nome}`;
    produtoNome.textContent = p.artista ? `${p.artista} - ${p.nome}` : p.nome;

    const valor = Number(p.preco);
    elPreco.textContent = emReais(valor);
    elParcelas.textContent = `Em até 6x de ${emReais(valor / 6)} sem juros`;

    elImagem.src = p.imagem ? `../pics/${p.imagem}` : "../pics/logo.svg";
    elImagem.alt = p.nome;
    elImagem.onerror = () => (elImagem.src = "../pics/logo.svg");

    elDescricao.textContent = p.descricao || "Sem descrição.";
    elDetalhes.innerHTML = `
      <li>Artista: ${p.artista || "-"}</li>
      <li>Tipo: ${p.tipo}</li>
      <li>Em estoque: ${p.estoque} unidade(s)</li>
    `;

    estoque = Math.max(1, Number(p.estoque) || 1);
    renderQuantidade();
  }

  if (!id) {
    produtoNome.textContent = "Produto não informado.";
  } else {
    fetch(`${API_URL}/produtos/${id}`)
      .then((r) => {
        if (r.status === 404) throw new Error("nao-encontrado");
        if (!r.ok) throw new Error("erro");
        return r.json();
      })
      .then(mostrarProduto)
      .catch((e) => {
        produtoNome.textContent =
          e.message === "nao-encontrado"
            ? "Produto não encontrado."
            : "Não foi possível carregar o produto.";
      });
  }

  // --- "Aproveite e compre junto": mostra outros produtos da API ---
  const compreJunto = document.getElementById("compreJunto");
  if (compreJunto) {
    fetch(`${API_URL}/produtos`)
      .then((r) => r.json())
      .then((produtos) => {
        const outros = produtos.filter((p) => String(p.id) !== String(id)).slice(0, 4);
        compreJunto.innerHTML = outros
          .map((p) => {
            const titulo = p.artista ? `${p.artista} - ${p.nome}` : p.nome;
            const valor = Number(p.preco);
            return `
              <a class="product-card" href="product.html?id=${p.id}">
                <div class="product-art">
                  <img src="../pics/${p.imagem}" alt="${titulo}" onerror="this.src='../pics/logo.svg'">
                </div>
                <h2>${titulo}</h2>
                <strong>${emReais(valor)} no Pix</strong>
                <span>Até 3x de ${emReais(valor / 3)}</span>
              </a>`;
          })
          .join("");
      })
      .catch(() => (compreJunto.innerHTML = ""));
  }
}

// --- Home: busca os produtos na API e monta os cards ---
const productsGrid = document.getElementById("productsGrid");

if (productsGrid) {
  // Formata um numero como preco em Real (ex: 289 -> "R$ 289,00")
  function precoBRL(valor) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }

  // Recebe a lista de produtos e desenha um card para cada um
  function renderProdutos(produtos) {
    if (!produtos.length) {
      productsGrid.innerHTML = '<p class="grid-message">Nenhum produto disponivel no momento.</p>';
      return;
    }

    productsGrid.innerHTML = produtos
      .map((produto) => {
        const preco = Number(produto.preco);
        const titulo = produto.artista ? `${produto.artista} - ${produto.nome}` : produto.nome;

        return `
          <a class="product-card" href="pages/product.html?id=${produto.id}">
            <div class="product-art">
              <img src="pics/${produto.imagem}" alt="${titulo}" onerror="this.src='pics/logo.svg'">
            </div>
            <h2>${titulo}</h2>
            <strong>${precoBRL(preco)} no Pix</strong>
            <span>Ate 3x de ${precoBRL(preco / 3)}</span>
          </a>
        `;
      })
      .join("");
  }

  // Pede os produtos para a API; se der erro (ex: servidor "dormindo"), avisa
  fetch(`${API_URL}/produtos`)
    .then((resposta) => {
      if (!resposta.ok) throw new Error("Resposta invalida da API");
      return resposta.json();
    })
    .then(renderProdutos)
    .catch(() => {
      productsGrid.innerHTML =
        '<p class="grid-message">Nao foi possivel carregar os produtos agora. Atualize a pagina em alguns segundos.</p>';
    });
}