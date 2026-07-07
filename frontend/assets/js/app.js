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

  // --- Botao "Compre ja": adiciona ao carrinho e vai pro pagamento ---
  const btnCompra = document.getElementById("btn-compra");
  if (btnCompra) {
    btnCompra.addEventListener("click", async (e) => {
      e.preventDefault();

      const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
      if (!usuario) {
        alert("Você precisa estar logado para comprar.");
        window.location.href = "login.html";
        return;
      }

      try {
        await fetch(`${API_URL}/cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuario_id: usuario.id,
            produto_id: Number(id),
            quantidade: quantidade,
          }),
        });
        window.location.href = "payment.html";
      } catch {
        alert("Não foi possível continuar. Tente de novo em alguns segundos.");
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

// --- Pagina de pagamento: carrega o carrinho do usuario logado ---
const cartItems = document.getElementById("cartItems");

if (cartItems) {
  const FRETE = 20; // valor fixo por enquanto
  const DESCONTO = 0; // cupom ainda nao implementado

  const totalProdutosEl = document.getElementById("totalProdutos");
  const totalFreteEl = document.getElementById("totalFrete");
  const totalDescontosEl = document.getElementById("totalDescontos");
  const totalCompraEl = document.getElementById("totalCompra");

  const reais = (v) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

  function calcularTotais(itens) {
    const produtos = itens.reduce((soma, i) => soma + Number(i.preco) * i.quantidade, 0);
    const frete = itens.length ? FRETE : 0;
    totalProdutosEl.textContent = reais(produtos);
    totalFreteEl.textContent = reais(frete);
    totalDescontosEl.textContent = `- ${reais(DESCONTO)}`;
    totalCompraEl.textContent = reais(produtos + frete - DESCONTO);
  }

  function renderCarrinho(itens) {
    if (!itens.length) {
      cartItems.innerHTML = '<p class="pay-cart__msg">Seu carrinho está vazio.</p>';
      calcularTotais([]);
      return;
    }

    cartItems.innerHTML = itens
      .map((i) => {
        const titulo = i.artista ? `${i.artista} - ${i.nome}` : i.nome;
        const linha = Number(i.preco) * i.quantidade;
        return `
          <div class="pay-cart__item" data-id="${i.id}" data-max="${i.estoque}">
            <img src="../pics/${i.imagem}" alt="${titulo}" onerror="this.src='../pics/logo.svg'">
            <span class="pay-cart__nome">${titulo}</span>
            <div class="pay-qty">
              <button type="button" data-acao="menos" ${i.quantidade <= 1 ? "disabled" : ""}>-</button>
              <span>${i.quantidade}</span>
              <button type="button" data-acao="mais" ${i.quantidade >= i.estoque ? "disabled" : ""}>+</button>
            </div>
            <strong class="pay-cart__preco">${reais(linha)}</strong>
            <button type="button" class="pay-cart__remove" data-acao="remover" title="Remover">🗑</button>
          </div>`;
      })
      .join("");

    calcularTotais(itens);
  }

  function carregarCarrinho() {
    if (!usuario) {
      cartItems.innerHTML = '<p class="pay-cart__msg">Faça login para ver o seu carrinho.</p>';
      calcularTotais([]);
      return;
    }
    fetch(`${API_URL}/cart?usuario_id=${usuario.id}`)
      .then((r) => r.json())
      .then(renderCarrinho)
      .catch(() => {
        cartItems.innerHTML = '<p class="pay-cart__msg">Não foi possível carregar o carrinho.</p>';
      });
  }

  // Clique nos botoes de +/-/remover de cada item
  cartItems.addEventListener("click", async (e) => {
    const botao = e.target.closest("button[data-acao]");
    if (!botao || !usuario) return;

    const item = botao.closest(".pay-cart__item");
    const id = item.dataset.id;
    const max = Number(item.dataset.max);
    const qtdAtual = Number(item.querySelector(".pay-qty span").textContent);

    try {
      if (botao.dataset.acao === "remover") {
        await fetch(`${API_URL}/cart/${id}?usuario_id=${usuario.id}`, { method: "DELETE" });
      } else {
        const nova =
          botao.dataset.acao === "mais" ? Math.min(max, qtdAtual + 1) : Math.max(1, qtdAtual - 1);
        if (nova === qtdAtual) return;
        await fetch(`${API_URL}/cart/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuario_id: usuario.id, quantidade: nova }),
        });
      }
      carregarCarrinho();
    } catch {
      /* se falhar, a proxima acao tenta de novo */
    }
  });

  // --- Endereco: "Usar endereço salvo" preenche com os dados do usuario ---
  const enderecoRadios = document.querySelectorAll("input[name='endereco-tipo']");
  const campoEstado = document.querySelector("select[name='estado']");
  const campoCidade = document.querySelector("input[name='cidade']");
  const campoEndereco = document.querySelector("input[name='endereco']");
  const campoBairro = document.querySelector("input[name='bairro']");
  const campoComplemento = document.querySelector("input[name='complemento']");

  function aplicarEndereco() {
    const marcado = document.querySelector("input[name='endereco-tipo']:checked");
    const usarSalvo = marcado && marcado.value === "salvo";

    if (usarSalvo && usuario) {
      // Preenche com o endereco salvo do usuario (veio no login)
      campoEstado.value = usuario.estado || "";
      campoCidade.value = usuario.cidade || "";
      campoEndereco.value = usuario.endereco || "";
      campoBairro.value = usuario.bairro || "";
      campoComplemento.value = usuario.complemento || "";
    } else if (!usarSalvo) {
      // "Usar outro endereco": limpa pra digitar do zero
      campoEstado.value = "";
      campoCidade.value = "";
      campoEndereco.value = "";
      campoBairro.value = "";
      campoComplemento.value = "";
    }

    // So trava os campos quando realmente esta usando o endereco salvo
    const bloquear = usarSalvo && !!usuario;
    campoEstado.disabled = bloquear;
    [campoCidade, campoEndereco, campoBairro, campoComplemento].forEach(
      (c) => (c.readOnly = bloquear)
    );
  }
  enderecoRadios.forEach((r) => r.addEventListener("change", aplicarEndereco));
  aplicarEndereco();

  // --- Cupom: nenhum cupom e valido por enquanto ---
  const btnCupom = document.getElementById("btnValidarCupom");
  const cupomInput = document.getElementById("cupomInput");
  const cupomErro = document.getElementById("cupomErro");
  if (btnCupom) {
    btnCupom.addEventListener("click", () => {
      cupomErro.textContent = cupomInput.value.trim() ? "Cupom inválido." : "Digite um cupom.";
    });

    // Some com a mensagem quando o campo fica vazio
    cupomInput.addEventListener("input", () => {
      if (!cupomInput.value.trim()) cupomErro.textContent = "";
    });
  }

  // --- Forma de pagamento: mostra os campos certos pra cada metodo ---
  const formaPagamento = document.getElementById("formaPagamento");
  const camposCartao = document.getElementById("camposCartao");
  const parcelasSelect = document.getElementById("parcelas");
  const pagamentoInfo = document.getElementById("pagamentoInfo");
  const numeroCartao = document.querySelector("input[name='numero-cartao']");
  const cvvInput = document.querySelector("input[name='cvv']");

  // Le o "Total da compra" do DOM e devolve como numero
  function totalNumero() {
    const txt = totalCompraEl.textContent.replace(/[^\d,]/g, "").replace(",", ".");
    return Number(txt) || 0;
  }

  function montarParcelas() {
    const total = totalNumero();
    let html = '<option value="" disabled selected>Quantidade de parcelas</option>';
    for (let n = 1; n <= 6; n++) {
      html += `<option value="${n}">${n}x de ${reais(total / n)} sem juros</option>`;
    }
    parcelasSelect.innerHTML = html;
  }

  if (formaPagamento) {
    formaPagamento.addEventListener("change", () => {
      const metodo = formaPagamento.value;
      const ehCartao = metodo === "credito";

      camposCartao.hidden = !ehCartao;
      if (ehCartao) montarParcelas();

      if (metodo === "pix") {
        pagamentoInfo.hidden = false;
        pagamentoInfo.textContent = "Pagamento à vista no Pix — aprovação na hora.";
      } else if (metodo === "boleto") {
        pagamentoInfo.hidden = false;
        pagamentoInfo.textContent = "O boleto vence em 3 dias úteis.";
      } else {
        pagamentoInfo.hidden = true;
      }
    });

    // Formata o numero do cartao em grupos de 4 e limita o CVV a numeros
    if (numeroCartao) {
      numeroCartao.addEventListener("input", () => {
        const digitos = numeroCartao.value.replace(/\D/g, "").slice(0, 16);
        numeroCartao.value = digitos.replace(/(.{4})/g, "$1 ").trim();
      });
    }
    if (cvvInput) {
      cvvInput.addEventListener("input", () => {
        cvvInput.value = cvvInput.value.replace(/\D/g, "").slice(0, 4);
      });
    }
  }

  // --- Botao "Efetuar o Pagamento": da baixa no estoque e esvazia o carrinho ---
  const btnPagar = document.getElementById("btnPagar");
  if (btnPagar) {
    btnPagar.addEventListener("click", async () => {
      if (!usuario) {
        alert("Faça login para finalizar a compra.");
        return;
      }
      if (!formaPagamento.value) {
        alert("Selecione uma forma de pagamento.");
        return;
      }

      const textoOriginal = btnPagar.textContent;
      btnPagar.disabled = true;
      btnPagar.textContent = "Processando...";

      try {
        const resposta = await fetch(`${API_URL}/checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuario_id: usuario.id }),
        });

        const corpo = await resposta.json();

        if (!resposta.ok) {
          alert(corpo.erro || "Não foi possível finalizar a compra.");
          return;
        }

        alert("Compra finalizada com sucesso! 🎉 O estoque foi atualizado.");
        carregarCarrinho(); // recarrega (agora vazio)
      } catch {
        alert("Servidor indisponível. Tente de novo em alguns segundos.");
      } finally {
        btnPagar.disabled = false;
        btnPagar.textContent = textoOriginal;
      }
    });
  }

  carregarCarrinho();
}