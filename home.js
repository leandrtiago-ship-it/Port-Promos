/* ==========================================================================
   Port Promos — home.js
   Renders dynamic homepage content: category pills, curated product
   carousels, and the "trending now" gamification leaderboard.
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

  function byId(id) {
    return document.getElementById(id);
  }

  /* ---------------------------------------------------------------------
   * Category pills
   * ------------------------------------------------------------------- */
  function renderCategoryPills() {
    const mount = byId("pp-pills-mount");
    if (!mount) return;
    const html = CATEGORIES.map(function (cat) {
      const count = PRODUCTS.filter(function (p) {
        return p.category === cat;
      }).length;
      return (
        '<a href="ofertas.html?cat=' +
        encodeURIComponent(cat) +
        '" class="pp-cat-pill reveal">' +
        '<span class="ico"><i class="bi ' +
        PP.categoryIcon(cat) +
        '"></i></span>' +
        "<span>" +
        PP.escapeHTML(cat) +
        "</span>" +
        "</a>"
      );
    }).join("");
    mount.innerHTML = html;
  }

  /* ---------------------------------------------------------------------
   * Shuffle helper (Fisher-Yates, returns new array)
   * ------------------------------------------------------------------- */
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------------------------------------------------------------------
   * Hero carousel — rendered dynamically with random products each load
   * ------------------------------------------------------------------- */
  function renderHeroCarousel() {
    var carouselEl = document.getElementById("ppHeroCarousel");
    if (!carouselEl || !PRODUCTS.length) return;

    var GRADS = [
      "linear-gradient(120deg,#0A192F 0%,#1B2F57 55%,#7B3FE4 140%)",
      "linear-gradient(120deg,#0A192F 0%,#3A1A0A 55%,#CC5500 140%)",
      "linear-gradient(120deg,#0A192F 0%,#0E2A52 55%,#0056D2 140%)",
      "linear-gradient(120deg,#0A192F 0%,#0E2A52 55%,#1FA45A 140%)",
      "linear-gradient(120deg,#0A192F 0%,#12284A 55%,#00B4D8 140%)",
    ];

    function eyebrow(p) {
      if (!p.discountPercent) return "\uD83D\uDCC8 Destaque do Dia";
      if (p.discountPercent >= 60) return "\uD83D\uDD25 Super Desconto";
      if (p.discountPercent >= 40) return "\uD83D\uDE80 Oferta Rel\u00E2mpago";
      if (p.discountPercent >= 20) return "\uD83D\uDC8E Promo\u00E7\u00E3o do Dia";
      return "\u2B50 Em Destaque";
    }

    // Pool: top 20 por desconto, depois embaralhados
    var pool = PRODUCTS.filter(function (p) { return p.image; })
      .sort(function (a, b) { return (b.discountPercent || 0) - (a.discountPercent || 0); })
      .slice(0, 20);
    pool = shuffle(pool).slice(0, 4);

    var indicatorsHTML = pool.map(function (_, i) {
      return '<button type="button" data-bs-target="#ppHeroCarousel" data-bs-slide-to="' + i + '"' +
        (i === 0 ? ' class="active" aria-current="true"' : '') +
        ' aria-label="Slide ' + (i + 1) + '"></button>';
    }).join("");

    var itemsHTML = pool.map(function (p, i) {
      var grad = GRADS[i % GRADS.length];
      var priceRow = "";
      if (p.oldPrice) {
        priceRow += '<span style="text-decoration:line-through;color:rgba(255,255,255,.6);font-size:1rem;margin-right:.6rem;">' + PP.formatBRL(p.oldPrice) + "</span>";
      }
      priceRow += '<span style="font-family:var(--font-display);font-size:1.8rem;font-weight:800;color:#fff;">' + PP.formatBRL(p.price) + "</span>";
      if (p.discountPercent) {
        priceRow += ' <span style="background:var(--pp-orange);color:#fff;font-size:.78rem;font-weight:800;padding:.2rem .55rem;border-radius:99px;margin-left:.4rem;">-' + p.discountPercent + '%</span>';
      }
      return (
        '<div class="carousel-item' + (i === 0 ? " active" : "") + '">' +
        '<div class="pp-hero-slide" style="--slide-bg:' + grad + '">' +
        '<div class="pp-hero-content">' +
        '<span class="pp-hero-eyebrow">' + eyebrow(p) + "</span>" +
        "<h2>" + PP.escapeHTML(p.title) + "</h2>" +
        "<p>" + PP.escapeHTML(p.shortDesc || "") + "</p>" +
        '<div class="pp-hero-price-row mb-3">' + priceRow + "</div>" +
        '<a href="produto.html?id=' + p.id + '" class="btn btn-pp-cta btn-lg">Ver oferta <i class="bi bi-arrow-right"></i></a>' +
        "</div>" +
        '<div class="pp-hero-figure"><img src="' + p.image + '" alt="' + PP.escapeHTML(p.title) + '" loading="lazy"></div>' +
        '<div class="pp-carousel-bar"></div>' +
        "</div>" +
        "</div>"
      );
    }).join("");

    // Destruir instância anterior e atualizar DOM
    var oldInstance = bootstrap.Carousel.getInstance(carouselEl);
    if (oldInstance) oldInstance.dispose();

    var inner = carouselEl.querySelector(".carousel-inner");
    var indicators = carouselEl.querySelector(".carousel-indicators");
    if (inner) inner.innerHTML = itemsHTML;
    if (indicators) indicators.innerHTML = indicatorsHTML;

    // Re-inicializar Bootstrap carousel
    new bootstrap.Carousel(carouselEl, { interval: 5000, ride: "carousel" });
  }
  let sectionCounter = 0;

  function sectionHTML(opts) {
    sectionCounter++;
    const headId = "sec-head-" + sectionCounter;
    const cards = opts.products.map(PP.cardHTML).join("");
    return (
      '<section class="pp-section reveal" aria-labelledby="' +
      headId +
      '">' +
      '<div class="container">' +
      '<div class="pp-section-head">' +
      "<div>" +
      '<h3 id="' +
      headId +
      '"><i class="bi ' +
      opts.icon +
      '"></i> ' +
      opts.title +
      "</h3>" +
      (opts.sub ? '<div class="sub">' + opts.sub + "</div>" : "") +
      "</div>" +
      (opts.seeAllHref
        ? '<a class="see-all" href="' +
          opts.seeAllHref +
          '">Ver tudo <i class="bi bi-arrow-right"></i></a>'
        : "") +
      "</div>" +
      '<div class="pp-scroller-wrap">' +
      '<button type="button" class="pp-scroll-btn prev" aria-label="Anterior"><i class="bi bi-chevron-left"></i></button>' +
      '<div class="pp-scroller">' +
      cards +
      "</div>" +
      '<button type="button" class="pp-scroll-btn next" aria-label="Próximo"><i class="bi bi-chevron-right"></i></button>' +
      "</div>" +
      "</div>" +
      "</section>"
    );
  }

  /* ---------------------------------------------------------------------
   * Curated carousels
   * ------------------------------------------------------------------- */
  function renderSections() {
    const mount = byId("pp-sections-mount");
    if (!mount) return;

    let html = "";

    // 1. Ofertas em Destaque — top 20 maiores descontos, embaralhados, mostra 12
    var destaque = shuffle(
      PRODUCTS.filter(function (p) { return p.discountPercent; })
        .sort(function (a, b) { return b.discountPercent - a.discountPercent; })
        .slice(0, 20)
    ).slice(0, 12);
    html += sectionHTML({
      title: "Ofertas em Destaque",
      sub: "Os maiores descontos do momento",
      icon: "bi-fire",
      seeAllHref: "ofertas.html",
      products: destaque,
    });

    // 2. Mais Vendidos — embaralhados para variar a ordem
    var maisVendidos = shuffle(
      PRODUCTS.filter(function (p) {
        return p.badges.indexOf("mais-vendido") !== -1;
      })
        .sort(function (a, b) { return (b.reviews || 0) - (a.reviews || 0); })
        .slice(0, 20)
    ).slice(0, 12);
    html += sectionHTML({
      title: "Mais Vendidos",
      sub: "Os queridinhos da galera",
      icon: "bi-star-fill",
      seeAllHref: "ofertas.html",
      products: maisVendidos,
    });

    // 3. Mais Favoritados / Mais bem avaliados — embaralhados
    var favIds = PP.getFavorites();
    var favoritados;
    if (favIds.length >= 4) {
      favoritados = shuffle(
        PRODUCTS.filter(function (p) { return favIds.indexOf(p.id) !== -1; })
      ).slice(0, 12);
    } else {
      favoritados = shuffle(
        PRODUCTS.slice()
          .sort(function (a, b) { return b.rating - a.rating || (b.reviews || 0) - (a.reviews || 0); })
          .slice(0, 20)
      ).slice(0, 12);
    }
    html += sectionHTML({
      title: "Mais Favoritados",
      sub: favIds.length >= 4 ? "Baseado nos seus favoritos" : "Melhor avaliados pela comunidade",
      icon: "bi-heart-fill",
      seeAllHref: "favoritos.html",
      products: favoritados,
    });

    // 4. One carousel per category — top 20 por desconto, embaralhados, mostra 12
    const catIcons = {
      "Eletrônicos": "bi-cpu",
      "Celulares": "bi-phone",
      "Moda": "bi-bag-heart",
      "Calçados": "bi-shoe",
      "Casa": "bi-house-heart",
      "Beleza & Perfumaria": "bi-droplet-half",
      "Suplementos & Esportes": "bi-trophy",
      "Acessórios": "bi-sunglasses",
    };
    CATEGORIES.forEach(function (cat) {
      var items = shuffle(
        PRODUCTS.filter(function (p) { return p.category === cat; })
          .sort(function (a, b) { return (b.discountPercent || 0) - (a.discountPercent || 0); })
          .slice(0, 20)
      ).slice(0, 12);
      if (!items.length) return;
      html += sectionHTML({
        title: cat,
        sub: items.length + " produto" + (items.length > 1 ? "s" : "") + " em oferta",
        icon: catIcons[cat] || "bi-tag",
        seeAllHref: "ofertas.html?cat=" + encodeURIComponent(cat),
        products: items,
      });
    });

    mount.innerHTML = html;
  }

  /* ---------------------------------------------------------------------
   * Gamification leaderboard — "Mais Vistos Hoje" / "Mais Compartilhados"
   * ------------------------------------------------------------------- */
  function trendListHTML(products, statIcon, statSuffix, seedPrefix, min, max) {
    const ranked = products
      .map(function (p) {
        return {
          p: p,
          val: PP.deterministicInt(seedPrefix + p.id, min, max),
        };
      })
      .sort(function (a, b) {
        return b.val - a.val;
      })
      .slice(0, 5);
    return ranked
      .map(function (item, idx) {
        return (
          '<a class="pp-trend-card reveal" href="produto.html?id=' +
          item.p.id +
          '">' +
          '<span class="pp-trend-rank' +
          (idx === 0 ? " top" : "") +
          '">' +
          (idx + 1) +
          "</span>" +
          '<img src="' +
          item.p.image +
          '" alt="" loading="lazy">' +
          '<span class="info">' +
          '<span class="name">' +
          PP.escapeHTML(item.p.title) +
          "</span>" +
          '<span class="stat"><i class="bi ' +
          statIcon +
          '"></i> ' +
          PP.formatCompact(item.val) +
          " " +
          statSuffix +
          "</span>" +
          "</span>" +
          "</a>"
        );
      })
      .join("");
  }

  function renderGamification() {
    const mount = byId("pp-gamification-mount");
    if (!mount) return;
    const pool = PRODUCTS.slice().sort(function (a, b) {
      return (b.reviews || 0) - (a.reviews || 0);
    }).slice(0, 20);

    const html =
      '<section class="pp-section reveal" aria-labelledby="trend-head">' +
      '<div class="container">' +
      '<div class="pp-section-head">' +
      "<div>" +
      '<h3 id="trend-head"><span class="live-dot"></span> Em Alta Agora</h3>' +
      '<div class="sub">Atualizado em tempo real com base no interesse da comunidade</div>' +
      "</div>" +
      "</div>" +
      '<div class="row g-3">' +
      '<div class="col-12 col-lg-6">' +
      '<h6 class="text-muted-pp mb-2" style="font-size:.8rem;text-transform:uppercase;letter-spacing:.04em;font-weight:700;">' +
      '<i class="bi bi-eye-fill"></i> Mais Vistos Hoje</h6>' +
      '<div class="d-flex flex-column gap-2">' +
      trendListHTML(pool, "bi-eye", "visualizações", "views", 120, 2400) +
      "</div></div>" +
      '<div class="col-12 col-lg-6">' +
      '<h6 class="text-muted-pp mb-2" style="font-size:.8rem;text-transform:uppercase;letter-spacing:.04em;font-weight:700;">' +
      '<i class="bi bi-share-fill"></i> Mais Compartilhados</h6>' +
      '<div class="d-flex flex-column gap-2">' +
      trendListHTML(pool, "bi-share", "compartilhamentos", "shares", 18, 540) +
      "</div></div>" +
      "</div>" +
      "</div>" +
      "</section>";

    mount.innerHTML = html;
  }

  /* ---------------------------------------------------------------------
   * Init
   * ------------------------------------------------------------------- */
  function init() {
    renderHeroCarousel();
    renderCategoryPills();
    renderSections();
    renderGamification();
    // Re-run chrome that depends on freshly-injected DOM
    PP.initScrollers();
    PP.initReveal();
    PP.updateFavCount();
  }

  PP.onProductsReady(init);
})();
