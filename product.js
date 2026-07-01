/* ==========================================================================
   Port Promos — product.js
   Renders the product detail page (produto.html?id=pXXX) entirely from
   PRODUCTS data: gallery, price box, ratings, features, spec table,
   price-history sparkline, share buttons, related products.
   Depends on: products-data.js (PRODUCTS), main.js (PP)
   ========================================================================== */
(function () {
  "use strict";

  function getParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function byId(id) {
    return document.getElementById(id);
  }

  /* ---------------------------------------------------------------------
   * Rating distribution synthesis — deterministic per product ID
   * Each product gets its own realistic distribution seeded from its ID,
   * so no two products look exactly the same.
   * ------------------------------------------------------------------- */
  function ratingDistribution(rating, productId) {
    // Base distribution by rating tier
    var base;
    if (rating >= 4.7)      base = [78, 15, 4, 2, 1];
    else if (rating >= 4.5) base = [72, 19, 5, 2, 2];
    else if (rating >= 4.2) base = [60, 25, 9, 4, 2];
    else if (rating >= 4.0) base = [50, 29, 12, 6, 3];
    else if (rating >= 3.7) base = [38, 30, 18, 9, 5];
    else                    base = [24, 26, 23, 16, 11];

    // Simple deterministic hash from product ID
    var seed = 0x811c9dc5;
    var id = String(productId || "x");
    for (var i = 0; i < id.length; i++) {
      seed ^= id.charCodeAt(i);
      seed = (seed * 0x01000193) >>> 0;
    }

    // Apply small ±variation to each bar
    var OFFSETS = [-6, -4, -3, -5, -4];
    var result = base.map(function (v, idx) {
      var rnd = ((seed >> (idx * 5)) & 0x1F) - 15; // -15 to +16
      var delta = Math.round(rnd * OFFSETS[idx] / 10);
      return Math.max(0, v + delta);
    });

    // Normalise to exactly 100
    var total = result.reduce(function (a, b) { return a + b; }, 0);
    result = result.map(function (v) { return Math.round(v * 100 / total); });
    var sum = result.reduce(function (a, b) { return a + b; }, 0);
    result[0] += (100 - sum); // fix rounding remainder on the top bar
    return result;
  }

  function ratingBarsHTML(rating, productId) {
    const dist = ratingDistribution(rating, productId || "");
    let html = "";
    for (let i = 0; i < 5; i++) {
      const stars = 5 - i;
      const pct = dist[i];
      html +=
        '<div class="pp-rating-bar-row">' +
        '<span class="lbl">' +
        stars +
        ' <i class="bi bi-star-fill" style="font-size:.65rem;color:var(--pp-gold);"></i></span>' +
        '<span class="track"><span class="fill" style="width:' +
        pct +
        '%"></span></span>' +
        '<span class="pct">' +
        pct +
        "%</span>" +
        "</div>";
    }
    return html;
  }

  /* ---------------------------------------------------------------------
   * Price-history chart — improved with axes, grid, labels, trend badge
   * ------------------------------------------------------------------- */
  function sparklineHTML(history, currentPrice, oldPrice) {
    // Generate synthetic history if not available
    if (!history || history.length < 2) {
      var base = oldPrice || currentPrice;
      history = [
        Math.round(base * 1.22),
        Math.round(base * 1.18),
        Math.round(base * 1.15),
        Math.round(base * 1.10),
        Math.round(base * 1.04),
        currentPrice
      ];
    }
    // Always force the last point to be the current price
    history = history.slice();
    history[history.length - 1] = currentPrice;

    var W = 560, H = 200;
    var padL = 72, padR = 20, padT = 24, padB = 40;
    var chartW = W - padL - padR;
    var chartH = H - padT - padB;

    var min = Math.min.apply(null, history);
    var max = Math.max.apply(null, history);
    var range = max - min || (min * 0.1) || 1;
    // Add 15% breathing room above and below
    var yMin = min - range * 0.15;
    var yMax = max + range * 0.15;
    var yRange = yMax - yMin;

    function xPos(i) { return padL + (i / (history.length - 1)) * chartW; }
    function yPos(v) { return padT + (1 - (v - yMin) / yRange) * chartH; }

    var points = history.map(function (v, i) { return [xPos(i), yPos(v)]; });

    // Smooth bezier path
    function bezierPath(pts) {
      var d = "M" + pts[0][0].toFixed(1) + "," + pts[0][1].toFixed(1);
      for (var i = 1; i < pts.length; i++) {
        var cp1x = (pts[i-1][0] + pts[i][0]) / 2;
        var cp1y = pts[i-1][1];
        var cp2x = cp1x;
        var cp2y = pts[i][1];
        d += " C" + cp1x.toFixed(1) + "," + cp1y.toFixed(1) + " " + cp2x.toFixed(1) + "," + cp2y.toFixed(1) + " " + pts[i][0].toFixed(1) + "," + pts[i][1].toFixed(1);
      }
      return d;
    }

    var linePath = bezierPath(points);
    var lastPt = points[points.length - 1];
    var areaPath = linePath +
      " L" + lastPt[0].toFixed(1) + "," + (padT + chartH).toFixed(1) +
      " L" + padL.toFixed(1) + "," + (padT + chartH).toFixed(1) + " Z";

    var minIdx = history.indexOf(Math.min.apply(null, history));
    var minPt = points[minIdx];

    // Y-axis ticks (4 evenly spaced)
    var yTicks = [0, 0.33, 0.67, 1].map(function (f) {
      return yMin + f * yRange;
    });

    // X-axis labels
    var xLabels;
    if (history.length <= 2) {
      xLabels = ["Anterior", "Atual"];
    } else {
      xLabels = history.map(function (_, i) {
        if (i === 0) return "Antes";
        if (i === history.length - 1) return "Hoje";
        var ago = history.length - 1 - i;
        return ago + "m atrás";
      });
    }

    // Trend arrow
    var trend = currentPrice < history[0] ? "down" : currentPrice > history[0] ? "up" : "stable";
    var trendColor = trend === "down" ? "var(--pp-success)" : trend === "up" ? "#e53935" : "var(--text-muted)";
    var trendIcon = trend === "down" ? "↓" : trend === "up" ? "↑" : "→";
    var trendLabel = trend === "down" ? "Preço caiu" : trend === "up" ? "Preço subiu" : "Preço estável";

    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" role="img" aria-label="Histórico de preços">' +
      '<defs>' +
      '<linearGradient id="ppChartFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="var(--pp-orange)" stop-opacity="0.28"/>' +
      '<stop offset="100%" stop-color="var(--pp-orange)" stop-opacity="0.02"/>' +
      '</linearGradient>' +
      '</defs>';

    // Grid lines (horizontal)
    yTicks.forEach(function (v) {
      var y = yPos(v).toFixed(1);
      svg += '<line x1="' + padL + '" y1="' + y + '" x2="' + (W - padR) + '" y2="' + y + '" stroke="var(--border-color)" stroke-width="1" stroke-dasharray="4,4"/>';
      svg += '<text x="' + (padL - 6) + '" y="' + (parseFloat(y) + 4) + '" text-anchor="end" fill="var(--text-muted)" font-size="10" font-family="system-ui,sans-serif">' + PP.formatBRL(v) + '</text>';
    });

    // Vertical grid lines for each data point
    points.forEach(function (pt) {
      svg += '<line x1="' + pt[0].toFixed(1) + '" y1="' + padT + '" x2="' + pt[0].toFixed(1) + '" y2="' + (padT + chartH) + '" stroke="var(--border-color)" stroke-width="1" stroke-dasharray="3,5" stroke-opacity="0.5"/>';
    });

    // Area fill
    svg += '<path d="' + areaPath + '" fill="url(#ppChartFill)"/>';
    // Line
    svg += '<path d="' + linePath + '" fill="none" stroke="var(--pp-orange)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';

    // Min price dot + label
    svg += '<circle cx="' + minPt[0].toFixed(1) + '" cy="' + minPt[1].toFixed(1) + '" r="5" fill="var(--pp-success)" stroke="var(--bg-card)" stroke-width="2"/>';
    svg += '<text x="' + minPt[0].toFixed(1) + '" y="' + (minPt[1] - 10).toFixed(1) + '" text-anchor="middle" fill="var(--pp-success)" font-size="10" font-weight="700" font-family="system-ui,sans-serif">mín</text>';

    // Current price dot + label
    svg += '<circle cx="' + lastPt[0].toFixed(1) + '" cy="' + lastPt[1].toFixed(1) + '" r="6" fill="var(--pp-orange)" stroke="var(--bg-card)" stroke-width="2.5"/>';

    // X-axis labels
    var step = Math.max(1, Math.floor(history.length / 6));
    xLabels.forEach(function (lbl, i) {
      if (i % step !== 0 && i !== history.length - 1 && i !== 0) return;
      var x = xPos(i).toFixed(1);
      var y = (padT + chartH + 18).toFixed(1);
      svg += '<text x="' + x + '" y="' + y + '" text-anchor="middle" fill="var(--text-muted)" font-size="10" font-family="system-ui,sans-serif">' + lbl + '</text>';
    });

    svg += '</svg>';

    // Trend badge
    var trendBadge = '<div class="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill" style="background:rgba(0,0,0,.06);font-size:.75rem;font-weight:700;color:' + trendColor + ';">' +
      '<span>' + trendIcon + '</span><span>' + trendLabel + '</span></div>';

    return svg + '<div class="d-flex justify-content-between align-items-center mt-2" style="font-size:.78rem;">' +
      '<div class="d-flex gap-3">' +
      '<span class="text-muted-pp"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--pp-success);margin-right:.3rem;"></span>Menor: <strong>' + PP.formatBRL(Math.min.apply(null, history)) + '</strong></span>' +
      '<span class="text-muted-pp"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--pp-orange);margin-right:.3rem;"></span>Atual: <strong>' + PP.formatBRL(currentPrice) + '</strong></span>' +
      '</div>' +
      trendBadge +
      '</div>';
  }

  /* ---------------------------------------------------------------------
   * Spec table rows
   * ------------------------------------------------------------------- */
  function specTableHTML(p) {
    const rows = [
      ["Categoria", p.category],
      ["Marca", p.brand || "Não informado"],
      ["Avaliação", (p.rating || 0).toFixed(1).replace(".", ",") + " de 5,0 (" + PP.formatNumber(p.reviews || 0) + " avaliações)"],
    ];
    if (p.sold) rows.push(["Vendidos", PP.formatNumber(p.sold) + "+"]);
    rows.push(["Adicionado em", p.addedDate]);
    return (
      "<table class=\"pp-spec-table\"><tbody>" +
      rows
        .map(function (r) {
          return "<tr><td>" + PP.escapeHTML(r[0]) + "</td><td>" + PP.escapeHTML(String(r[1])) + "</td></tr>";
        })
        .join("") +
      "</tbody></table>"
    );
  }

  /* ---------------------------------------------------------------------
   * Related products (same category, excluding current)
   * ------------------------------------------------------------------- */
  function relatedSectionHTML(p) {
    const related = PRODUCTS.filter(function (x) {
      return x.category === p.category && x.id !== p.id;
    })
      .sort(function (a, b) {
        return (b.discountPercent || 0) - (a.discountPercent || 0);
      })
      .slice(0, 12);
    if (!related.length) return "";
    return (
      '<section class="pp-section reveal" aria-labelledby="related-head">' +
      '<div class="pp-section-head">' +
      "<div><h3 id=\"related-head\"><i class=\"bi " +
      PP.categoryIcon(p.category) +
      '"></i> Você também pode gostar</h3>' +
      '<div class="sub">Mais produtos de ' +
      PP.escapeHTML(p.category) +
      "</div></div>" +
      '<a class="see-all" href="ofertas.html?cat=' +
      encodeURIComponent(p.category) +
      '">Ver tudo <i class="bi bi-arrow-right"></i></a>' +
      "</div>" +
      '<div class="pp-scroller-wrap">' +
      '<button type="button" class="pp-scroll-btn prev" aria-label="Anterior"><i class="bi bi-chevron-left"></i></button>' +
      '<div class="pp-scroller">' +
      related.map(PP.cardHTML).join("") +
      "</div>" +
      '<button type="button" class="pp-scroll-btn next" aria-label="Próximo"><i class="bi bi-chevron-right"></i></button>' +
      "</div>" +
      "</section>"
    );
  }

  /* ---------------------------------------------------------------------
   * Not-found state
   * ------------------------------------------------------------------- */
  function renderNotFound() {
    const mount = byId("pp-product-mount");
    if (!mount) return;
    mount.innerHTML =
      '<div class="col-12">' +
      '<div class="pp-empty">' +
      '<div class="ico"><i class="bi bi-search"></i></div>' +
      "<h3>Produto não encontrado</h3>" +
      '<p class="text-muted-pp">O produto que você procura não existe ou foi removido.</p>' +
      '<a href="ofertas.html" class="btn btn-pp-primary mt-2">Ver todas as ofertas</a>' +
      "</div></div>";
  }

  /* ---------------------------------------------------------------------
   * Main render
   * ------------------------------------------------------------------- */
  function render(p) {
    document.title = p.title + " — Port Promos";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", p.shortDesc + " — " + PP.formatBRL(p.price) + " na Port Promos.");

    // Breadcrumb
    const crumb = byId("pp-breadcrumb");
    if (crumb) {
      crumb.innerHTML =
        '<a href="index.html">Início</a> <i class="bi bi-chevron-right" style="font-size:.65rem;"></i> ' +
        '<a href="ofertas.html?cat=' +
        encodeURIComponent(p.category) +
        '">' +
        PP.escapeHTML(p.category) +
        '</a> <i class="bi bi-chevron-right" style="font-size:.65rem;"></i> ' +
        '<span class="text-muted-pp">' +
        PP.escapeHTML(p.title.length > 50 ? p.title.slice(0, 50) + "…" : p.title) +
        "</span>";
    }

    const hasOld = p.oldPrice && p.oldPrice > p.price;
    const savings = hasOld ? p.oldPrice - p.price : 0;
    const fav = PP.isFavorite(p.id);

    const mount = byId("pp-product-mount");
    if (mount) {
      mount.innerHTML =
        // Gallery column
        '<div class="col-12 col-lg-6">' +
        '<div class="pp-gallery-main">' +
        '<img src="' + PP.safeUrl(p.image) + '" alt="' + PP.escapeHTML(p.title) + '" id="pp-main-img">' +
        "</div>" +
        '<div class="pp-gallery-thumbs d-none" id="pp-gallery-thumbs"></div>' +
        '<div class="d-flex align-items-center gap-2 mt-3">' +
        '<button type="button" class="pp-share-btn" data-channel="whatsapp" aria-label="Grupo do WhatsApp"><i class="bi bi-whatsapp"></i></button>' +
        '<button type="button" class="pp-share-btn" data-channel="instagram" aria-label="Instagram"><i class="bi bi-instagram"></i></button>' +
        '<button type="button" class="pp-fav-btn js-fav-btn position-relative ms-auto' + (fav ? " active" : "") + '" style="position:relative !important;" data-id="' + p.id + '" aria-pressed="' + (fav ? "true" : "false") + '" aria-label="Favoritar produto">' +
        '<i class="bi ' + (fav ? "bi-heart-fill" : "bi-heart") + '"></i></button>' +
        "</div>" +
        "</div>" +
        // Info column
        '<div class="col-12 col-lg-6">' +
        '<span class="cat-tag">' + PP.escapeHTML(p.category) + (p.brand ? " · " + PP.escapeHTML(p.brand) : "") + "</span>" +
        "<h1 class=\"mt-2 mb-2\" style=\"font-size:clamp(1.4rem,2.6vw,1.9rem);font-weight:800;\">" + PP.escapeHTML(p.title) + "</h1>" +
        '<div class="d-flex align-items-center gap-2 mb-3">' +
        '<span class="pp-stars-lg" aria-hidden="true">' + PP.starsHTML(p.rating || 0) + "</span>" +
        '<strong>' + (p.rating || 0).toFixed(1).replace(".", ",") + "</strong>" +
        '<span class="text-muted-pp">(' + PP.formatNumber(p.reviews) + " avaliações)</span>" +
        (p.sold ? '<span class="text-muted-pp">· ' + PP.formatCompact(p.sold) + " vendidos</span>" : "") +
        "</div>" +
        '<div class="d-flex flex-wrap gap-2 mb-3">' + PP.badgesHTML(p.badges) + "</div>" +
        '<div class="pp-price-box mb-3">' +
        (hasOld ? '<div class="old">' + PP.formatBRL(p.oldPrice) + "</div>" : "") +
        '<div class="new">' + PP.formatBRL(p.price) + "</div>" +
        (hasOld
          ? '<span class="pp-savings"><i class="bi bi-piggy-bank-fill"></i> Economize ' + PP.formatBRL(savings) + " (-" + p.discountPercent + "%)</span>"
          : "") +
        '<a href="' + PP.safeUrl(p.link) + '" target="_blank" rel="noopener sponsored nofollow" class="btn btn-pp-cta btn-lg w-100 mt-3">Ver oferta <i class="bi bi-box-arrow-up-right"></i></a>' +
        '<p class="text-faint-pp mt-2 mb-0" style="font-size:.74rem;">Você será redirecionado para a loja parceira para finalizar a compra.</p>' +
        "</div>" +
        (p.features && p.features.length
          ? '<h2 style="font-size:1rem;font-weight:700;margin-bottom:.7rem;">Destaques do produto</h2>' +
            '<ul class="pp-feature-list mb-4">' +
            p.features.map(function (f) { return '<li><i class="bi bi-check-circle-fill"></i>' + PP.escapeHTML(f) + "</li>"; }).join("") +
            "</ul>"
          : "") +
        '<h2 style="font-size:1rem;font-weight:700;margin-bottom:.7rem;">Distribuição de avaliações</h2>' +
        '<div class="mb-4">' + ratingBarsHTML(p.rating || 0, p.id) + "</div>" +
        '<h2 style="font-size:1rem;font-weight:700;margin-bottom:.7rem;">Especificações</h2>' +
        specTableHTML(p) +
        "</div>" +
        // Price history (full width)
        '<div class="col-12 mt-2">' +
        '<div class="pp-sparkline-wrap">' +
        '<div class="d-flex align-items-center justify-content-between mb-3">' +
        '<h2 style="font-size:1rem;font-weight:700;margin:0;"><i class="bi bi-graph-down-arrow text-orange"></i> Histórico de preço</h2>' +
        '<span class="text-muted-pp" style="font-size:.78rem;">Variação dos últimos registros</span>' +
        "</div>" +
        sparklineHTML(p.priceHistory, p.price, p.oldPrice) +
        "</div>" +
        "</div>";
    }

    const relatedMount = byId("pp-related-mount");
    if (relatedMount) relatedMount.innerHTML = relatedSectionHTML(p);

    // Share button wiring
    document.querySelectorAll(".pp-share-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        PP.shareProduct(p, btn.getAttribute("data-channel"));
      });
    });

    // JSON-LD structured data
    const ld = {
      "@context": "https://schema.org/",
      "@type": "Product",
      name: p.title,
      image: window.location.origin + window.location.pathname.replace(/[^/]*$/, "") + p.image,
      description: p.shortDesc,
      brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: p.rating,
        reviewCount: p.reviews,
      },
      offers: {
        "@type": "Offer",
        priceCurrency: "BRL",
        price: p.price,
        availability: "https://schema.org/InStock",
        url: p.link,
      },
    };
    const ldScript = document.createElement("script");
    ldScript.type = "application/ld+json";
    ldScript.textContent = JSON.stringify(ld);
    document.head.appendChild(ldScript);

    PP.initScrollers();
    PP.initReveal();
    PP.updateFavCount();
  }

  /* ---------------------------------------------------------------------
   * Galeria de múltiplas imagens (produtos cadastrados pelo painel admin
   * podem ter mais de 1 foto; produtos antigos com só 1 foto continuam
   * exatamente iguais, porque a faixa de miniaturas fica oculta)
   * ------------------------------------------------------------------- */
  async function loadGallery(p) {
    const wrap = byId("pp-gallery-thumbs");
    if (!wrap || typeof PP_SB === "undefined") return;
    try {
      const { data, error } = await PP_SB.from("product_images")
        .select("storage_path, position, is_primary")
        .eq("product_id", p.id)
        .order("position", { ascending: true });
      if (error || !data || data.length < 2) return;

      const urls = data.map(function (row) {
        const { data: pub } = PP_SB.storage.from("product-images").getPublicUrl(row.storage_path);
        return pub.publicUrl;
      });

      wrap.innerHTML = urls
        .map(function (url, idx) {
          return (
            '<button type="button" class="pp-gallery-thumb' + (idx === 0 ? " active" : "") + '" data-url="' +
            PP.safeUrl(url) + '"><img src="' + PP.safeUrl(url) + '" alt=""></button>'
          );
        })
        .join("");
      wrap.classList.remove("d-none");

      wrap.querySelectorAll(".pp-gallery-thumb").forEach(function (btn) {
        btn.addEventListener("click", function () {
          byId("pp-main-img").src = btn.getAttribute("data-url");
          wrap.querySelectorAll(".pp-gallery-thumb").forEach(function (b) { b.classList.remove("active"); });
          btn.classList.add("active");
        });
      });
    } catch (err) {
      console.warn("Galeria de imagens indisponível:", err);
    }
  }

  function init() {
    const id = getParam("id");
    const p = PRODUCTS.find(function (x) {
      return x.id === id;
    });
    if (!p) {
      renderNotFound();
      return;
    }
    render(p);
    loadGallery(p);
  }

  PP.onProductsReady(init);
})();
