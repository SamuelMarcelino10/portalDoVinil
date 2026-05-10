const searchInput = document.getElementById("searchInput");
const priceMin = document.getElementById("priceMin");
const priceMax = document.getElementById("priceMax");
const priceMaxLabel = document.getElementById("priceMaxLabel");
const genreButtons = document.querySelectorAll(".genre-pill");
const filterCount = document.getElementById("filterCount");
const resultCards = document.querySelectorAll("[data-product]");
const urlParams = new URLSearchParams(window.location.search);
const queryParam = urlParams.get("q");

if (searchInput && queryParam) {
  searchInput.value = queryParam;
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    window.location.href = "index.html";
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
  if (!searchInput || !priceMin || !priceMax || !priceMaxLabel || !filterCount || !resultCards.length) {
    return;
  }

  const query = searchInput.value.trim().toLowerCase();
  const min = Number(priceMin.value);
  const max = Number(priceMax.value);
  const activeGenres = [...genreButtons]
    .filter((button) => button.classList.contains("is-active"))
    .map((button) => button.dataset.genre);

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

if (document.getElementById("quantityValue") && document.getElementById("qtyDown") && document.getElementById("qtyUp")) {
  const quantityValue = document.getElementById("quantityValue");
  const qtyDown = document.getElementById("qtyDown");
  const qtyUp = document.getElementById("qtyUp");
  const stockLabel = document.getElementById("stockLabel");
  let quantity = 1;
  const stock = 4;

  function renderQuantity() {
    quantityValue.textContent = quantity;
    stockLabel.textContent = `${stock - quantity} disponível(is)`;
    qtyDown.disabled = quantity <= 1;
    qtyUp.disabled = quantity >= stock;
  }

  qtyDown.addEventListener("click", () => {
    quantity = Math.max(1, quantity - 1);
    renderQuantity();
  });

  qtyUp.addEventListener("click", () => {
    quantity = Math.min(stock, quantity + 1);
    renderQuantity();
  });

  renderQuantity();

  const cepInput = document.getElementById("cepInput");
  const houseInput = document.getElementById("houseInput");
  const addressInput = document.getElementById("addressInput");
  const districtInput = document.getElementById("districtInput");
  const complementInput = document.getElementById("complementInput");
  const calcShippingBtn = document.getElementById("calcShippingBtn");
  const shippingResult = document.getElementById("shippingResult");

  calcShippingBtn.addEventListener("click", () => {
    const cepDigits = cepInput.value.replace(/\D/g, "");
    const house = houseInput.value.trim();
    const address = addressInput.value.trim();
    const district = districtInput.value.trim();
    const complement = complementInput.value.trim();

    if (cepDigits.length < 8) {
      shippingResult.textContent = "Digite um CEP válido para calcular o frete.";
      return;
    }

    const basePrice = 18.9 + quantity * 2.5;
    shippingResult.textContent = `Frete estimado para ${cepDigits.slice(0, 5)}-${cepDigits.slice(5)}: ${formatCurrency(basePrice)}. ${address ? `Entrega em ${address}${house ? `, ${house}` : ""}${district ? ` - ${district}` : ""}${complement ? ` (${complement})` : ""}.` : ""}`;
  });
}