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

// Logo (marca): leva pra home; se ja estiver na propria pagina, nao faz nada
document.querySelectorAll("a.brand").forEach((link) => {
  link.addEventListener("click", (evento) => {
    if (new URL(link.href).pathname === window.location.pathname) {
      evento.preventDefault();
    }
  });
});

// --- Cabecalho: menu da conta (pessoa) e botao do carrinho ---
const headerActions = document.querySelector(".header-actions");

if (headerActions) {
  // Caminho relativo certo dependendo se estamos na raiz ou dentro de /pages/
  const emPages = window.location.pathname.includes("/pages/");
  const prefixo = emPages ? "" : "pages/";

  const contaBtn = headerActions.querySelector('[aria-label="Perfil"]');
  const carrinhoBtn = headerActions.querySelector('[aria-label="Carrinho"]');

  // Carrinho -> tela de pagamento
  if (carrinhoBtn) {
    carrinhoBtn.addEventListener("click", () => {
      window.location.href = `${prefixo}payment.html`;
    });
  }

  // Conta -> nao logado: vai pro login | logado: abre menu (Sair / Adicionar produto)
  if (contaBtn) {
    const menu = document.createElement("div");
    menu.className = "account-menu";
    headerActions.appendChild(menu);

    function montarMenu(usuario) {
      let html = "";
      // "Adicionar produto" so aparece pra vendedor (tipo_usuario === 'v')
      if (usuario.tipo_usuario === "v") {
        html += '<button class="account-menu__item" data-acao="add-produto">Adicionar produto</button>';
      }
      html += '<button class="account-menu__item" data-acao="sair">Sair</button>';
      menu.innerHTML = html;
    }

    contaBtn.addEventListener("click", (evento) => {
      evento.preventDefault();
      const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
      if (!usuario) {
        window.location.href = `${prefixo}login.html`;
        return;
      }
      montarMenu(usuario);
      menu.classList.toggle("is-open");
    });

    menu.addEventListener("click", (evento) => {
      const item = evento.target.closest("[data-acao]");
      if (!item) return;
      if (item.dataset.acao === "sair") {
        localStorage.removeItem("usuario"); // desloga
        window.location.href = `${prefixo}login.html`;
      } else if (item.dataset.acao === "add-produto") {
        window.location.href = `${prefixo}criar-produto.html`;
      }
    });

    // Fecha o menu ao clicar fora dele
    document.addEventListener("click", (evento) => {
      if (!menu.contains(evento.target) && !contaBtn.contains(evento.target)) {
        menu.classList.remove("is-open");
      }
    });
  }
}

// Endereco do backend (API PHP no Render) - usado no login e no cadastro
const API_URL = "https://portaldovinil.onrender.com";

// Caminho certo da capa: se for URL completa (Storage) usa direto;
// se for so um nome de arquivo (produtos antigos) procura na pasta /pics.
// "base" e "" na home e "../" nas paginas dentro de /pages.
function urlImagem(imagem, base = "") {
  if (!imagem) return `${base}pics/logo.svg`;
  if (/^https?:\/\//i.test(imagem)) return imagem;
  return `${base}pics/${imagem}`;
}

// --- Excluir produto: so aparece pra vendedor (tipo_usuario === 'v') ---
const usuarioAtual = JSON.parse(localStorage.getItem("usuario") || "null");
const ehVendedor = usuarioAtual?.tipo_usuario === "v";

// HTML do botao de lixeira que aparece no hover do card (vazio se nao for vendedor)
function botaoExcluir(id) {
  return ehVendedor
    ? `<button type="button" class="card-excluir" data-excluir="${id}" title="Excluir produto" aria-label="Excluir produto">🗑</button>`
    : "";
}

// Confirma e chama o DELETE do backend; tira o card da tela se der certo
async function excluirProduto(botao) {
  const card = botao.closest(".product-card, .result-card");
  const titulo = card?.querySelector("h2")?.textContent || "este produto";
  if (!confirm(`Tem certeza que deseja excluir "${titulo}"?\nEssa ação não pode ser desfeita.`)) {
    return;
  }

  botao.disabled = true;
  try {
    const r = await fetch(`${API_URL}/produtos/${botao.dataset.excluir}`, { method: "DELETE" });
    if (!r.ok) throw new Error();
    if (card) card.remove();
  } catch {
    botao.disabled = false;
    alert("Não foi possível excluir o produto. Tente de novo em alguns segundos.");
  }
}

// Liga a exclusao num container de cards (um listener so, por delegacao)
function ativarExclusao(container) {
  if (!container || !ehVendedor) return;
  container.addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-excluir]");
    if (!botao) return;
    evento.preventDefault(); // nao segue o link do card
    evento.stopPropagation();
    excluirProduto(botao);
  });
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  // Marca a sessao: estando no login, voltar pra home nao redireciona de novo
  sessionStorage.setItem("entrou", "1");

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

    elImagem.src = urlImagem(p.imagem, "../");
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
            const artista = p.artista || "Sem artista";
            const valor = Number(p.preco);
            return `
              <div class="product-card">
                <div class="product-card__header">${artista}${botaoExcluir(p.id)}</div>
                <div class="product-art">
                  <img src="${urlImagem(p.imagem, "../")}" alt="${titulo}" onerror="this.src='../pics/logo.svg'">
                </div>
                <div class="product-card__info">
                  <strong class="product-card__price">${emReais(valor)} no Pix</strong>
                  <span class="product-card__installments">Até 3x de ${emReais(valor / 3)}</span>
                  <div class="product-card__divider"></div>
                  <a class="product-card__action" href="product.html?id=${p.id}">Ver Produto</a>
                </div>
              </div>`;
          })
          .join("");
        ativarExclusao(compreJunto);
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
        const artista = produto.artista || "Sem artista";

        return `
          <div class="product-card">
            <div class="product-card__header">${artista}${botaoExcluir(produto.id)}</div>
            <div class="product-art">
              <img src="${urlImagem(produto.imagem)}" alt="${titulo}" onerror="this.src='pics/logo.svg'">
            </div>
            <div class="product-card__info">
              <strong class="product-card__price">${precoBRL(preco)} no Pix</strong>
              <span class="product-card__installments">Ate 3x de ${precoBRL(preco / 3)}</span>
              <div class="product-card__divider"></div>
              <a class="product-card__action" href="pages/product.html?id=${produto.id}">Ver Produto</a>
            </div>
          </div>
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
    .then((produtos) => {
      renderProdutos(produtos);
      ativarExclusao(productsGrid);
    })
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
            <img src="${urlImagem(i.imagem, "../")}" alt="${titulo}" onerror="this.src='../pics/logo.svg'">
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

// --- Pagina de busca: resultados + filtros (preco, genero, estoque...) ---
const searchResults = document.getElementById("searchResults");

if (searchResults) {
  const searchTitle = document.getElementById("searchTitle");
  const cat = urlParams.get("cat"); // vinil | vitrola | cd | artistas | ofertas
  const termo = (urlParams.get("q") || "").trim().toLowerCase();

  const emReaisBusca = (v) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const filtrosAtivos = document.getElementById("filtrosAtivos");
  const generoFiltros = document.getElementById("generoFiltros");

  // Todos os generos possiveis (mesma lista da tela de cadastro de produto)
  const GENEROS = [
    "Rock", "Pop", "Pop Rock", "Rock Progressivo", "Arena Rock", "Metal",
    "Indie", "Jazz", "Blues", "MPB", "Samba", "Hip Hop", "Eletrônica",
    "Clássica", "Reggae", "Country",
  ];

  let todos = []; // lista completa vinda da API

  // Monta o card de um produto
  function cardBusca(p) {
    const titulo = p.artista ? `${p.artista} - ${p.nome}` : p.nome;
    const artista = p.artista || "Sem artista";
    const preco = Number(p.preco);
    return `
      <div class="result-card">
        <div class="result-card__header">${artista}${botaoExcluir(p.id)}</div>
        <div class="result-card__art">
          <img src="${urlImagem(p.imagem, "../")}" alt="${titulo}" onerror="this.src='../pics/logo.svg'">
        </div>
        <div class="result-card__info">
          <strong class="result-card__price">${emReaisBusca(preco)} no Pix</strong>
          <span class="result-card__installments">Até 3x de ${emReaisBusca(preco / 3)}</span>
          <div class="result-card__divider"></div>
          <a class="result-card__action" href="product.html?id=${p.id}">Ver Produto</a>
        </div>
      </div>`;
  }

  // Titulo da pagina conforme a categoria (ou a busca digitada)
  const titulos = {
    vinil: "Vinis",
    vitrola: "Vitrolas",
    cd: "CD's",
    artistas: "Discos por artista",
    ofertas: "Ofertas — os mais baratos",
  };
  if (searchTitle) {
    if (termo) searchTitle.textContent = `Resultados para "${urlParams.get("q").trim()}"`;
    else searchTitle.textContent = titulos[cat] || "Todos os produtos";
  }

  // Quebra "Rock, Arena Rock" numa lista limpa ["Rock", "Arena Rock"]
  function listaGeneros(p) {
    return (p.generos || "")
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);
  }

  // Valores marcados de um tipo de filtro (genero, selo, oferta, estoque)
  function marcados(tipo) {
    return [...document.querySelectorAll(`.filters input[data-filtro='${tipo}']:checked`)].map(
      (c) => c.value
    );
  }

  function atualizarLabelsPreco() {
    const min = Number(priceMin.value);
    const max = Number(priceMax.value);
    priceMinLabel.textContent = min === 0 ? "Qualquer valor" : `A partir de ${emReaisBusca(min)}`;
    priceMaxLabel.textContent = `Até ${emReaisBusca(max)}`;
  }

  // Monta as etiquetas de "filtros ativos" e atualiza o contador "Filtros (N)"
  function renderChips() {
    const chips = [];

    // preco: so vira filtro quando saiu do intervalo cheio
    const min = Number(priceMin.value);
    const max = Number(priceMax.value);
    const teto = Number(priceMax.max);
    if (min > 0 || max < teto) {
      const texto =
        min > 0 ? `${emReaisBusca(min)} – ${emReaisBusca(max)}` : `Até ${emReaisBusca(max)}`;
      chips.push({ tipo: "preco", label: texto });
    }

    // um chip por genero marcado
    marcados("genero").forEach((g) => chips.push({ tipo: "genero", valor: g, label: g }));

    // estoque
    if (marcados("estoque").length) chips.push({ tipo: "estoque", label: "Em estoque" });

    if (filtrosAtivos) {
      filtrosAtivos.innerHTML = chips
        .map(
          (c) =>
            `<button type="button" class="filters__chip" data-tipo="${c.tipo}" data-valor="${c.valor || ""}">× ${c.label}</button>`
        )
        .join("");
    }
    if (filterCount) filterCount.textContent = `(${chips.length})`;
  }

  function aplicar() {
    let lista = todos;

    // texto digitado na busca (nome/artista)
    if (termo) {
      lista = lista.filter((p) => `${p.artista || ""} ${p.nome}`.toLowerCase().includes(termo));
    }

    // categoria (tipo do produto)
    if (cat === "vinil" || cat === "vitrola" || cat === "cd") {
      lista = lista.filter((p) => p.tipo === cat);
    }

    // preco (barras min/max)
    const min = Number(priceMin.value);
    const max = Number(priceMax.value);
    lista = lista.filter((p) => Number(p.preco) >= min && Number(p.preco) <= max);

    // genero (dado real do banco)
    const generos = marcados("genero");
    if (generos.length) {
      lista = lista.filter((p) => {
        const meus = listaGeneros(p);
        return generos.some((g) => meus.includes(g));
      });
    }

    // estoque: mostra so o que tem estoque > 0
    if (marcados("estoque").length) lista = lista.filter((p) => Number(p.estoque) > 0);

    // "Ofertas": ordena do mais barato pro mais caro
    if (cat === "ofertas") lista = [...lista].sort((a, b) => Number(a.preco) - Number(b.preco));

    renderChips();

    if (!lista.length) {
      searchResults.innerHTML = '<p class="grid-message">Nenhum produto encontrado.</p>';
      return;
    }

    // "Artistas": agrupa os produtos por artista, um bloco pra cada
    if (cat === "artistas") {
      const grupos = {};
      lista.forEach((p) => {
        const nome = p.artista || "Outros";
        (grupos[nome] = grupos[nome] || []).push(p);
      });

      searchResults.innerHTML = Object.keys(grupos)
        .sort((a, b) => a.localeCompare(b, "pt-BR"))
        .map(
          (artista) => `
          <section class="artist-group">
            <h2 class="artist-group__nome">${artista}</h2>
            <div class="results">${grupos[artista].map(cardBusca).join("")}</div>
          </section>`
        )
        .join("");
      ativarExclusao(searchResults);
      return;
    }

    // Demais casos: uma grade unica de cards
    searchResults.innerHTML = `<div class="results">${lista.map(cardBusca).join("")}</div>`;
    ativarExclusao(searchResults);
  }

  // Cria os checkboxes com TODOS os generos possiveis
  function montarFiltroGeneros() {
    if (!generoFiltros) return;
    generoFiltros.innerHTML = GENEROS.map(
      (g) =>
        `<label class="filtro-check"><input type="checkbox" data-filtro="genero" value="${g}" /><span>${g}</span></label>`
    ).join("");
  }

  // --- Liga os eventos dos filtros ---
  [priceMin, priceMax].forEach((s) =>
    s.addEventListener("input", () => {
      atualizarLabelsPreco();
      aplicar();
    })
  );

  // Um so listener no aside pega qualquer checkbox (inclusive os de genero criados depois)
  document.querySelector(".filters").addEventListener("change", (e) => {
    if (e.target.matches("input[type='checkbox']")) aplicar();
  });

  // Clique no × de uma etiqueta remove aquele filtro especifico
  if (filtrosAtivos) {
    filtrosAtivos.addEventListener("click", (e) => {
      const chip = e.target.closest(".filters__chip");
      if (!chip) return;

      if (chip.dataset.tipo === "preco") {
        priceMin.value = 0;
        priceMax.value = priceMax.max;
        atualizarLabelsPreco();
      } else if (chip.dataset.tipo === "genero") {
        const box = document.querySelector(
          `.filters input[data-filtro='genero'][value="${chip.dataset.valor}"]`
        );
        if (box) box.checked = false;
      } else if (chip.dataset.tipo === "estoque") {
        const box = document.querySelector(".filters input[data-filtro='estoque']");
        if (box) box.checked = false;
      }
      aplicar();
    });
  }

  fetch(`${API_URL}/produtos`)
    .then((r) => {
      if (!r.ok) throw new Error();
      return r.json();
    })
    .then((produtos) => {
      todos = produtos;

      // Ajusta o teto das barras de preco pro maior preco real do catalogo
      const maior = produtos.reduce((m, p) => Math.max(m, Number(p.preco)), 0);
      const teto = Math.max(50, Math.ceil(maior / 10) * 10);
      [priceMin, priceMax].forEach((s) => (s.max = teto));
      priceMin.value = 0;
      priceMax.value = teto;

      montarFiltroGeneros();
      atualizarLabelsPreco();
      aplicar();
    })
    .catch(() => {
      searchResults.innerHTML =
        '<p class="grid-message">Não foi possível carregar os produtos agora. Atualize em alguns segundos.</p>';
    });
}

// --- Pagina de criar produto (vendedor): interatividade da propria tela ---
const produtoForm = document.getElementById("produtoForm");

if (produtoForm) {
  // --- Foto: mostra a previa no circulo (ainda sem enviar pro servidor) ---
  const fotoInput = document.getElementById("fotoInput");
  const fotoPreview = document.getElementById("fotoPreview");
  const btnTrocarFoto = document.getElementById("btnTrocarFoto");
  const btnRemoverFoto = document.getElementById("btnRemoverFoto");
  const fotoIconeHTML = '<span class="foto-preview__icone" aria-hidden="true">📷</span>';

  btnTrocarFoto.addEventListener("click", () => fotoInput.click());

  fotoInput.addEventListener("change", () => {
    const arquivo = fotoInput.files[0];
    if (!arquivo) return;
    const url = URL.createObjectURL(arquivo);
    fotoPreview.innerHTML = `<img src="${url}" alt="Pré-visualização da capa">`;
  });

  btnRemoverFoto.addEventListener("click", () => {
    fotoInput.value = "";
    fotoPreview.innerHTML = fotoIconeHTML;
  });

  // --- Generos: escolher no menu vira uma etiqueta (chip) removivel ---
  const generoSelect = document.getElementById("generoSelect");
  const generoChips = document.getElementById("generoChips");

  // --- Tipo de produto: mostrar/esconder campos de genero e alterar placeholder de artista ---
  const tipoRadios = document.querySelectorAll("input[name='tipo']");
  const artistaInput = produtoForm.artista;

  function atualizarCamposSecundarios() {
    const tipoSelecionado = produtoForm.querySelector("input[name='tipo']:checked")?.value || "";
    const eVitrola = tipoSelecionado === "vitrola";

    // Mostra/esconde select de gêneros
    if (generoSelect) {
      generoSelect.style.display = eVitrola ? "none" : "";
    }

    // Mostra/esconde chips de gêneros
    if (generoChips) {
      generoChips.style.display = eVitrola ? "none" : "";
      if (eVitrola) {
        // Limpa gêneros selecionados ao mudar para vitrola
        generoChips.innerHTML = "";
      }
    }

    // Altera placeholder do artista
    if (artistaInput) {
      artistaInput.placeholder = eVitrola ? "Marca" : "Artista/Banda";
    }
  }

  tipoRadios.forEach((radio) => {
    radio.addEventListener("change", atualizarCamposSecundarios);
  });

  // Executa na primeira carga
  atualizarCamposSecundarios();

  function adicionarGenero(nome) {
    // Nao repete um genero que ja foi escolhido
    const jaTem = [...generoChips.querySelectorAll(".genero-chip span")].some(
      (s) => s.textContent === nome
    );
    if (jaTem) return;

    const chip = document.createElement("span");
    chip.className = "genero-chip";
    chip.innerHTML = `<button type="button" aria-label="Remover ${nome}">×</button><span>${nome}</span>`;
    generoChips.appendChild(chip);
  }

  generoSelect.addEventListener("change", () => {
    if (!generoSelect.value) return;
    adicionarGenero(generoSelect.value);
    generoSelect.value = ""; // volta pro texto "Gêneros"
  });

  generoChips.addEventListener("click", (evento) => {
    const botao = evento.target.closest(".genero-chip button");
    if (botao) botao.closest(".genero-chip").remove();
  });

  // --- Salvar: envia os dados + a foto pro backend (que sobe pro Storage) ---
  const produtoMsg = document.getElementById("produtoMsg");

  function avisar(texto, erro = false) {
    if (!produtoMsg) return;
    produtoMsg.textContent = texto;
    produtoMsg.style.color = erro ? "var(--botoes)" : "var(--accent)";
  }

  produtoForm.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    avisar("");

    // So vendedor pode cadastrar
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
    if (!usuario || usuario.tipo_usuario !== "v") {
      avisar("Apenas vendedores podem cadastrar produtos.", true);
      return;
    }

    const nome = produtoForm.nome.value.trim();
    const tipo = produtoForm.querySelector("input[name='tipo']:checked")?.value || "";

    // Preco em formato BR ("R$ 289,90") -> numero limpo ("289.90")
    const preco = produtoForm.preco.value
      .replace(/[^\d.,]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");

    if (!nome || !preco || Number(preco) <= 0) {
      avisar("Preencha ao menos o nome e um preço válido.", true);
      return;
    }

    // Junta os generos escolhidos numa string ("Rock, Pop Rock")
    const generos = [...generoChips.querySelectorAll(".genero-chip span")]
      .map((s) => s.textContent)
      .join(", ");

    // FormData porque vai arquivo junto (o navegador cuida do cabecalho)
    const dados = new FormData();
    dados.append("tipo", tipo);
    dados.append("nome", nome);
    dados.append("artista", produtoForm.artista.value.trim());
    dados.append("preco", preco);
    dados.append("estoque", produtoForm.estoque.value || "0");
    dados.append("generos", generos);
    dados.append("descricao", produtoForm.descricao.value.trim());
    if (fotoInput.files[0]) dados.append("foto", fotoInput.files[0]);

    const botao = produtoForm.querySelector("button[type='submit']");
    botao.disabled = true;
    botao.textContent = "Salvando...";

    try {
      const resposta = await fetch(`${API_URL}/produtos`, { method: "POST", body: dados });
      const corpo = await resposta.json();

      if (!resposta.ok) {
        avisar(corpo.erro || "Não foi possível cadastrar o produto.", true);
        return;
      }

      // Deu certo: vai pra tela do produto recem-criado
      window.location.href = `product.html?id=${corpo.id}`;
    } catch {
      avisar("Servidor indisponível. Tente de novo em alguns segundos.", true);
    } finally {
      botao.disabled = false;
      botao.textContent = "Salvar produto";
    }
  });
}