/* ==========================================================================
   Port Promos — catalog.js
   Powers ofertas.html: filterable, sortable product grid with a
   category/brand/price/rating sidebar (desktop) + offcanvas (mobile),
   reads ?cat= and ?q= from the URL, client-side "carregar mais" paging.
   Depends on: products-data.js (PRODUCTS), main.js (PP)
   ========================================================================== */
(function () {
  "use strict";

  const CATEGORIES = [
    "Eletrônicos",
    "Celulares",
    "Moda",
    "Calçados",
    "Casa",
    "Beleza & Perfumaria",
    "Suplementos & Esportes",
    "Acessórios",
  ];

  const PAGE_SIZE = 12;

  const state = {
    cats: new Set(),
    brands: new Set(),
    minPrice: null,
    maxPrice: null,
    minRating: 0,
    discountOnly: false,
    sort: "relevance",
    q: "",
    visibleCount: PAGE_SIZE,
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function parseInitialState() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    const q = params.get("q");
    if (cat) state.cats.add(cat);
    if (q) state.q = q;
  }

  function allBrands() {
    const set = new Set();
    PRODUCTS.forEach(function (p) {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set).sort(function (a, b) {
      return a.localeCompare(b, "pt-BR");
    });
  }

  /* ---------------------------------------------------------------------
   * Filtering / sorting
   * ------------------------------------------------------------------- */
  function matches(p) {
    if (state.cats.size && !state.cats.has(p.category)) return false;
    if (state.brands.size && !(p.brand && state.brands.has(p.brand))) return false;
    if (state.minPrice !== null && p.price < state.minPrice) return false;
    if (state.maxPrice !== null && p.price > state.maxPrice) return false;
    if (state.minRating && p.rating < state.minRating) return false;
    if (state.discountOnly && !p.discountPercent) return false;
    if (state.q) {
      const q = state.q.toLowerCase();
      const hay = (
        p.title +
        " " +
        p.category +
        " " +
        (p.brand || "") +
        " " +
        (p.shortDesc || "")
      ).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }

  function sortList(list) {
    const sorted = list.slice();
    switch (state.sort) {
      case "price-asc":
        sorted.sort(function (a, b) { return a.price - b.price; });
        break;
      case "price-desc":
        sorted.sort(function (a, b) { return b.price - a.price; });
        break;
      case "discount":
        sorted.sort(function (a, b) { return (b.discountPercent || 0) - (a.discountPercent || 0); });
        break;
      case "rating":
        sorted.sort(function (a, b) { return b.rating - a.rating || (b.reviews || 0) - (a.reviews || 0); });
        break;
      case "newest":
        sorted.sort(function (a, b) { return parseBRDate(b.addedDate) - parseBRDate(a.addedDate); });
        break;
      default:
        // relevance = preserva ordem aleatória gerada no carregamento
        sorted.sort(function (a, b) { return (a._randomIdx || 0) - (b._randomIdx || 0); });
    }
    return sorted;
  }

  function parseBRDate(str) {
    const parts = str.split("/");
    return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
  }

  /* ---------------------------------------------------------------------
   * Filter panel (rendered twice: desktop sidebar + mobile offcanvas)
   * ------------------------------------------------------------------- */
  function filterPanelHTML() {
    const brands = allBrands();
    let html = "";

    // Category
    html += '<div class="pp-filter-block"><h6>Categoria</h6>';
    CATEGORIES.forEach(function (cat) {
      const count = PRODUCTS.filter(function (p) { return p.category === cat; }).length;
      html +=
        '<label class="form-check d-flex align-items-center gap-2 mb-2">' +
        '<input class="form-check-input js-filter-cat" type="checkbox" value="' + PP.escapeHTML(cat) + '"' +
        (state.cats.has(cat) ? " checked" : "") +
        '>' +
        '<span class="form-check-label">' + PP.escapeHTML(cat) + ' <span class="text-faint-pp">(' + count + ')</span></span>' +
        "</label>";
    });
    html += "</div>";

    // Brand
    if (brands.length) {
      html += '<div class="pp-filter-block"><h6>Marca</h6>';
      brands.forEach(function (b) {
        html +=
          '<label class="form-check d-flex align-items-center gap-2 mb-2">' +
          '<input class="form-check-input js-filter-brand" type="checkbox" value="' + PP.escapeHTML(b) + '"' +
          (state.brands.has(b) ? " checked" : "") +
          '>' +
          '<span class="form-check-label">' + PP.escapeHTML(b) + "</span>" +
          "</label>";
      });
      html += "</div>";
    }

    // Price
    html +=
      '<div class="pp-filter-block"><h6>Faixa de preço</h6>' +
      '<div class="d-flex align-items-center gap-2">' +
      '<input type="number" min="0" class="form-control form-control-sm js-filter-min-price" placeholder="Mín." value="' + (state.minPrice !== null ? state.minPrice : "") + '" style="background:var(--input-bg);border-color:var(--border-color);color:var(--text);">' +
      "<span>—</span>" +
      '<input type="number" min="0" class="form-control form-control-sm js-filter-max-price" placeholder="Máx." value="' + (state.maxPrice !== null ? state.maxPrice : "") + '" style="background:var(--input-bg);border-color:var(--border-color);color:var(--text);">' +
      "</div></div>";

    // Rating
    html += '<div class="pp-filter-block"><h6>Avaliação mínima</h6>';
    [4.5, 4.0, 3.5].forEach(function (r) {
      html +=
        '<label class="form-check d-flex align-items-center gap-2 mb-2">' +
        '<input class="form-check-input js-filter-rating" type="radio" name="pp-rating-' + (filterPanelHTML._scope || Math.random()) + '" value="' + r + '"' +
        (state.minRating === r ? " checked" : "") +
        '>' +
        '<span class="form-check-label">' + r.toFixed(1).replace(".", ",") + '+ <i class="bi bi-star-fill" style="color:var(--pp-gold);font-size:.7rem;"></i></span>' +
        "</label>";
    });
    html +=
      '<label class="form-check d-flex align-items-center gap-2">' +
      '<input class="form-check-input js-filter-rating" type="radio" name="pp-rating-' + (filterPanelHTML._scope || Math.random()) + '" value="0"' +
      (state.minRating === 0 ? " checked" : "") +
      '>' +
      '<span class="form-check-label">Todas</span>' +
      "</label>" +
      "</div>";

    // Discount only
    html +=
      '<div class="pp-filter-block">' +
      '<label class="form-check d-flex align-items-center gap-2">' +
      '<input class="form-check-input js-filter-discount" type="checkbox"' +
      (state.discountOnly ? " checked" : "") +
      '>' +
      '<span class="form-check-label">Apenas com desconto</span>' +
      "</label>" +
      "</div>";

    html += '<button type="button" class="btn btn-pp-outline btn-sm w-100 js-clear-filters">Limpar filtros</button>';

    return html;
  }

  /* ---------------------------------------------------------------------
   * Grid rendering
   * ------------------------------------------------------------------- */
  function renderGrid() {
    const matched = sortList(PRODUCTS.filter(matches));
    const visible = matched.slice(0, state.visibleCount);

    const countEl = byId("pp-results-count");
    if (countEl) {
      countEl.textContent =
        matched.length === 0
          ? "Nenhum produto encontrado"
          : matched.length === 1
          ? "1 produto encontrado"
          : matched.length + " produtos encontrados";
    }

    const titleEl = byId("pp-catalog-title");
    if (titleEl) {
      if (state.q) {
        titleEl.innerHTML = 'Resultados para "' + PP.escapeHTML(state.q) + '"';
      } else if (state.cats.size === 1) {
        titleEl.textContent = Array.from(state.cats)[0];
      } else {
        titleEl.textContent = "Todas as Ofertas";
      }
    }

    const mount = byId("pp-catalog-grid");
    if (!mount) return;

    if (!matched.length) {
      mount.innerHTML =
        '<div class="pp-empty">' +
        '<div class="ico"><i class="bi bi-search"></i></div>' +
        "<h3>Nenhum produto encontrado</h3>" +
        '<p class="text-muted-pp">Tente ajustar os filtros ou buscar por outro termo.</p>' +
        '<button type="button" class="btn btn-pp-primary mt-2 js-clear-filters">Limpar filtros</button>' +
        "</div>";
      const loadMoreWrap = byId("pp-load-more-wrap");
      if (loadMoreWrap) loadMoreWrap.classList.add("d-none");
      return;
    }

    mount.innerHTML =
      '<div class="row g-3">' +
      visible.map(function (p) { return '<div class="col-6 col-md-4 col-lg-3">' + PP.cardHTML(p) + "</div>"; }).join("") +
      "</div>";

    const loadMoreWrap = byId("pp-load-more-wrap");
    if (loadMoreWrap) {
      loadMoreWrap.classList.toggle("d-none", visible.length >= matched.length);
    }

    PP.initReveal();
    PP.updateFavCount();
  }

  function renderFilterPanels() {
    const desktop = byId("pp-filters-desktop");
    const mobile = byId("pp-filters-mobile");
    filterPanelHTML._scope = "d";
    if (desktop) desktop.innerHTML = filterPanelHTML();
    filterPanelHTML._scope = "m";
    if (mobile) mobile.innerHTML = filterPanelHTML();
  }

  function refresh() {
    state.visibleCount = PAGE_SIZE;
    renderFilterPanels();
    renderGrid();
    syncURL();
  }

  function syncURL() {
    const params = new URLSearchParams();
    if (state.cats.size === 1) params.set("cat", Array.from(state.cats)[0]);
    if (state.q) params.set("q", state.q);
    const qs = params.toString();
    const url = window.location.pathname + (qs ? "?" + qs : "");
    window.history.replaceState({}, "", url);
  }

  /* ---------------------------------------------------------------------
   * Event wiring (delegated, works for both filter panel instances)
   * ------------------------------------------------------------------- */
  function wireEvents() {
    document.addEventListener("change", function (e) {
      const t = e.target;
      if (t.classList.contains("js-filter-cat")) {
        if (t.checked) state.cats.add(t.value);
        else state.cats.delete(t.value);
        refresh();
      } else if (t.classList.contains("js-filter-brand")) {
        if (t.checked) state.brands.add(t.value);
        else state.brands.delete(t.value);
        refresh();
      } else if (t.classList.contains("js-filter-rating")) {
        state.minRating = parseFloat(t.value);
        refresh();
      } else if (t.classList.contains("js-filter-discount")) {
        state.discountOnly = t.checked;
        refresh();
      } else if (t.classList.contains("js-filter-min-price")) {
        state.minPrice = t.value === "" ? null : parseFloat(t.value);
        refresh();
      } else if (t.classList.contains("js-filter-max-price")) {
        state.maxPrice = t.value === "" ? null : parseFloat(t.value);
        refresh();
      } else if (t.id === "pp-sort-select") {
        state.sort = t.value;
        state.visibleCount = PAGE_SIZE;
        renderGrid();
      }
    });

    document.addEventListener("click", function (e) {
      if (e.target.closest(".js-clear-filters")) {
        state.cats.clear();
        state.brands.clear();
        state.minPrice = null;
        state.maxPrice = null;
        state.minRating = 0;
        state.discountOnly = false;
        state.q = "";
        refresh();
      }
      if (e.target.closest("#pp-load-more-btn")) {
        state.visibleCount += PAGE_SIZE;
        renderGrid();
      }
    });
  }

  function init() {
    parseInitialState();
    wireEvents();
    refresh();
  }

  PP.onProductsReady(init);
})();
