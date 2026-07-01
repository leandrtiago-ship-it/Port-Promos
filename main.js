/* ==========================================================================
   Port Promos — main.js
   Shared utilities: formatting, favorites, search, theme, toasts, cards,
   scrollers, reveal animations, countdowns, gamification helpers.
   Exposes a global `PP` object used by home.js / product.js / catalog.js /
   favoritos.js.
   ========================================================================== */
const PP = (function () {
  "use strict";

  /* ---------------------------------------------------------------------
   * Formatting
   * ------------------------------------------------------------------- */
  function formatBRL(value) {
    if (value === null || value === undefined || isNaN(value)) return "—";
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatNumber(value) {
    if (value === null || value === undefined) return "—";
    return value.toLocaleString("pt-BR");
  }

  function formatCompact(value) {
    if (value === null || value === undefined) return "—";
    if (value >= 1000) {
      return (value / 1000).toFixed(value % 1000 === 0 ? 0 : 1).replace(".", ",") + "k";
    }
    return String(value);
  }

  /* ---------------------------------------------------------------------
   * Deterministic pseudo-random helpers (seeded by string, e.g. product id)
   * Used so "views today" / "shares" counts stay stable across renders.
   * ------------------------------------------------------------------- */
  function hashSeed(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  function deterministic(seedStr, min, max) {
    const seed = hashSeed(String(seedStr));
    const r = seededRandom(seed);
    return min + r * (max - min);
  }

  function deterministicInt(seedStr, min, max) {
    return Math.floor(deterministic(seedStr, min, max + 1));
  }

  /* ---------------------------------------------------------------------
   * Stars / ratings
   * ------------------------------------------------------------------- */
  function starsHTML(rating) {
    let html = "";
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
    const roundedFull = rating - full >= 0.75 ? full + 1 : full;
    for (let i = 0; i < 5; i++) {
      if (i < roundedFull) {
        html += '<i class="bi bi-star-fill"></i>';
      } else if (i === roundedFull && hasHalf) {
        html += '<i class="bi bi-star-half"></i>';
      } else {
        html += '<i class="bi bi-star"></i>';
      }
    }
    return html;
  }

  /* ---------------------------------------------------------------------
   * Category icons
   * ------------------------------------------------------------------- */
  const CATEGORY_ICONS = {
    "Eletrônicos": "bi-cpu",
    "Celulares": "bi-phone",
    "Moda": "bi-bag-heart",
    "Calçados": "bi-shoe",
    "Casa": "bi-house-heart",
    "Beleza & Perfumaria": "bi-droplet-half",
    "Suplementos & Esportes": "bi-trophy",
    "Acessórios": "bi-sunglasses",
  };

  function categoryIcon(cat) {
    return CATEGORY_ICONS[cat] || "bi-tag";
  }

  /* ---------------------------------------------------------------------
   * Badges
   * ------------------------------------------------------------------- */
  const BADGE_LABELS = {
    "relampago": { label: "Oferta Relâmpago", icon: "🔥" },
    "mais-vendido": { label: "Mais Vendido", icon: "⭐" },
    "exclusivo": { label: "Exclusivo", icon: "💎" },
    "tendencia": { label: "Tendência", icon: "🚀" },
    "poucas-unidades": { label: "Poucas Unidades", icon: "🛒" },
    "mais-procurado": { label: "Mais Procurado", icon: "📈" },
  };

  function badgesHTML(badges) {
    if (!badges || !badges.length) return "";
    return badges
      .map(function (b) {
        const meta = BADGE_LABELS[b];
        if (!meta) return "";
        return (
          '<span class="pp-badge ' +
          b +
          '">' +
          meta.icon +
          " " +
          meta.label +
          "</span>"
        );
      })
      .join("");
  }

  /* ---------------------------------------------------------------------
   * Favorites (localStorage)
   * ------------------------------------------------------------------- */
  const FAV_KEY = "pp_favorites";

  function getFavorites() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function isFavorite(id) {
    return getFavorites().indexOf(id) !== -1;
  }

  function toggleFavorite(id) {
    let favs = getFavorites();
    let added;
    if (favs.indexOf(id) === -1) {
      favs.push(id);
      added = true;
    } else {
      favs = favs.filter(function (f) {
        return f !== id;
      });
      added = false;
    }
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favs));
    } catch (e) {
      /* storage unavailable, ignore */
    }
    updateFavCount();
    document.dispatchEvent(
      new CustomEvent("pp:favorites-changed", { detail: { id: id, added: added } })
    );
    return added;
  }

  function updateFavCount() {
    const count = getFavorites().length;
    document.querySelectorAll(".js-fav-count").forEach(function (el) {
      el.textContent = count;
      el.classList.toggle("d-none", count === 0);
    });
  }

  /* ---------------------------------------------------------------------
   * Search history (localStorage)
   * ------------------------------------------------------------------- */
  const HIST_KEY = "pp_search_history";

  function getSearchHistory() {
    try {
      const raw = localStorage.getItem(HIST_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function addSearchHistory(term) {
    term = (term || "").trim();
    if (!term) return;
    let hist = getSearchHistory().filter(function (t) {
      return t.toLowerCase() !== term.toLowerCase();
    });
    hist.unshift(term);
    hist = hist.slice(0, 5);
    try {
      localStorage.setItem(HIST_KEY, JSON.stringify(hist));
    } catch (e) {
      /* ignore */
    }
  }

  /* ---------------------------------------------------------------------
   * Theme (dark default / light alternate)
   * ------------------------------------------------------------------- */
  const THEME_KEY = "pp_theme";

  function getTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || "dark";
    } catch (e) {
      return "dark";
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      /* ignore */
    }
    document.querySelectorAll(".pp-theme-switch").forEach(function (btn) {
      btn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
      const icon = btn.querySelector("i");
      if (icon) {
        icon.className = theme === "light" ? "bi bi-moon-stars" : "bi bi-sun";
      }
    });
  }

  function initTheme() {
    applyTheme(getTheme());
    document.querySelectorAll(".pp-theme-switch").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const next = getTheme() === "light" ? "dark" : "light";
        applyTheme(next);
        showToast(
          next === "light" ? "Modo claro ativado" : "Modo escuro ativado",
          "info",
          next === "light" ? "bi-sun" : "bi-moon-stars"
        );
      });
    });
  }

  /* ---------------------------------------------------------------------
   * Toasts
   * ------------------------------------------------------------------- */
  function ensureToastContainer() {
    let c = document.querySelector(".pp-toast-container");
    if (!c) {
      c = document.createElement("div");
      c.className =
        "pp-toast-container toast-container position-fixed bottom-0 end-0 p-3";
      c.style.zIndex = "1080";
      document.body.appendChild(c);
    }
    return c;
  }

  function showToast(message, type, icon) {
    type = type || "info";
    icon = icon || "bi-info-circle";
    const container = ensureToastContainer();
    const el = document.createElement("div");
    el.className = "toast " + type;
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-atomic", "true");
    el.innerHTML =
      '<div class="toast-body d-flex align-items-center gap-2">' +
      '<i class="bi ' +
      icon +
      '"></i><span>' +
      message +
      "</span></div>";
    container.appendChild(el);
    if (window.bootstrap && window.bootstrap.Toast) {
      const t = new window.bootstrap.Toast(el, { delay: 2600 });
      el.addEventListener("hidden.bs.toast", function () {
        el.remove();
      });
      t.show();
    } else {
      setTimeout(function () {
        el.remove();
      }, 2600);
    }
  }

  /* ---------------------------------------------------------------------
   * Product card markup
   * ------------------------------------------------------------------- */
  function priceBlockHTML(p) {
    const hasOld = p.oldPrice && p.oldPrice > p.price;
    return (
      '<div class="price-row">' +
      (hasOld
        ? '<span class="old-price">' + formatBRL(p.oldPrice) + "</span>"
        : "") +
      '<span class="new-price">' +
      formatBRL(p.price) +
      "</span>" +
      "</div>"
    );
  }

  function cardHTML(p) {
    const fav = isFavorite(p.id);
    return (
      '<article class="pp-card reveal" data-id="' +
      p.id +
      '" data-category="' +
      escapeHTML(p.category) +
      '">' +
      '<a href="produto.html?id=' +
      p.id +
      '" class="thumb-wrap" aria-label="Ver ' +
      escapeHTML(p.title) +
      '">' +
      (p.discountPercent
        ? '<span class="pp-discount-tag">-' + p.discountPercent + "%</span>"
        : "") +
      '<img src="' +
      safeUrl(p.image) +
      '" alt="' +
      escapeHTML(p.title) +
      '" loading="lazy">' +
      "</a>" +
      '<div class="badges-row">' +
      badgesHTML(p.badges) +
      "</div>" +
      '<button type="button" class="pp-fav-btn js-fav-btn' +
      (fav ? " active" : "") +
      '" data-id="' +
      p.id +
      '" aria-pressed="' +
      (fav ? "true" : "false") +
      '" aria-label="Favoritar produto">' +
      '<i class="bi ' +
      (fav ? "bi-heart-fill" : "bi-heart") +
      '"></i></button>' +
      '<div class="body">' +
      '<span class="cat-tag">' +
      escapeHTML(p.category) +
      "</span>" +
      '<a href="produto.html?id=' +
      p.id +
      '"><h3 class="title">' +
      escapeHTML(p.title) +
      "</h3></a>" +
      '<div class="rating-row"><span class="stars" aria-hidden="true">' +
      starsHTML(p.rating || 0) +
      "</span><span>" +
      (p.rating || 0).toFixed(1).replace(".", ",") +
      "</span><span>(" +
      formatCompact(p.reviews || 0) +
      ")</span></div>" +
      priceBlockHTML(p) +
      '<div class="cta-row"><a href="produto.html?id=' +
      p.id +
      '" class="btn btn-pp-cta btn-sm">Ver oferta</a></div>' +
      "</div>" +
      "</article>"
    );
  }

  function escapeHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Usar SEMPRE que um link/imagem de produto for inserido em um atributo
  // (src="...", href="..."). Bloqueia esquemas perigosos (javascript:, data:)
  // e escapa aspas — importante agora que produtos podem vir do painel
  // admin, não só do array fixo de antes.
  function safeUrl(url) {
    const s = String(url || "").trim();
    if (!/^https?:\/\//i.test(s) && !/^assets\//i.test(s)) return "";
    return escapeHTML(s);
  }

  function skeletonCards(n) {
    let html = "";
    for (let i = 0; i < n; i++) {
      html += '<div class="pp-skel pp-skel-card"></div>';
    }
    return html;
  }

  /* ---------------------------------------------------------------------
   * Favorite-button delegation (works for dynamically rendered cards)
   * ------------------------------------------------------------------- */
  function initFavDelegation() {
    document.addEventListener("click", function (e) {
      const btn = e.target.closest(".js-fav-btn");
      if (!btn) return;
      e.preventDefault();
      const id = btn.getAttribute("data-id");
      const added = toggleFavorite(id);
      btn.classList.toggle("active", added);
      btn.setAttribute("aria-pressed", added ? "true" : "false");
      const icon = btn.querySelector("i");
      if (icon) icon.className = added ? "bi bi-heart-fill" : "bi bi-heart";
      btn.classList.add("pop");
      setTimeout(function () {
        btn.classList.remove("pop");
      }, 350);
      showToast(
        added ? "Adicionado aos favoritos" : "Removido dos favoritos",
        added ? "success" : "removed",
        added ? "bi-heart-fill" : "bi-heart"
      );
    });
    updateFavCount();
  }

  /* ---------------------------------------------------------------------
   * Share
   * ------------------------------------------------------------------- */
  function shareProduct(p, channel) {
    const url =
      window.location.origin +
      window.location.pathname.replace(/[^/]*$/, "") +
      "produto.html?id=" +
      p.id;
    const text = p.title + " — " + formatBRL(p.price) + " na Port Promos!";
    let shareUrl = "";
    switch (channel) {
      case "whatsapp":
        shareUrl = "https://chat.whatsapp.com/Irc1ZAEOgQYDOvAE1nA97b";
        break;
      case "instagram":
        shareUrl = "https://www.instagram.com/portpromos?igsh=Z3l2MDNya2J0ZWox";
        break;
      default:
        return;
    }
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=500");
  }

  /* ---------------------------------------------------------------------
   * Navbar chrome: scroll shadow + back-to-top
   * ------------------------------------------------------------------- */
  function initChrome() {
    const navbar = document.querySelector(".pp-navbar");
    const backTop = document.querySelector(".pp-back-to-top");
    function onScroll() {
      const y = window.scrollY || window.pageYOffset;
      if (navbar) navbar.classList.toggle("is-scrolled", y > 8);
      if (backTop) backTop.classList.toggle("show", y > 480);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    if (backTop) {
      backTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  /* ---------------------------------------------------------------------
   * Horizontal scrollers
   * ------------------------------------------------------------------- */
  function initScrollers() {
    document.querySelectorAll(".pp-scroller-wrap").forEach(function (wrap) {
      const track = wrap.querySelector(".pp-scroller");
      const prev = wrap.querySelector(".pp-scroll-btn.prev");
      const next = wrap.querySelector(".pp-scroll-btn.next");
      if (!track) return;
      function amount() {
        return Math.min(track.clientWidth * 0.85, 640);
      }
      function refreshButtons() {
        if (prev) prev.disabled = track.scrollLeft <= 4;
        if (next)
          next.disabled =
            track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      }
      if (prev) {
        prev.addEventListener("click", function () {
          track.scrollBy({ left: -amount(), behavior: "smooth" });
        });
      }
      if (next) {
        next.addEventListener("click", function () {
          track.scrollBy({ left: amount(), behavior: "smooth" });
        });
      }
      track.addEventListener("scroll", refreshButtons, { passive: true });
      window.addEventListener("resize", refreshButtons);
      refreshButtons();
    });
  }

  /* ---------------------------------------------------------------------
   * Scroll reveal
   * ------------------------------------------------------------------- */
  function initReveal() {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      io.observe(el);
    });
  }

  /* Re-observe newly injected .reveal elements (after dynamic render) */
  function observeNewReveals() {
    initReveal();
  }

  /* ---------------------------------------------------------------------
   * Countdown timers — counts down to 23:59:59 of current day
   * ------------------------------------------------------------------- */
  function initCountdowns() {
    const els = document.querySelectorAll("[data-countdown]");
    if (!els.length) return;
    function tick() {
      const now = new Date();
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      let diff = Math.max(0, end - now);
      const h = Math.floor(diff / 3600000);
      diff -= h * 3600000;
      const m = Math.floor(diff / 60000);
      diff -= m * 60000;
      const s = Math.floor(diff / 1000);
      els.forEach(function (el) {
        const hh = el.querySelector(".pp-cd-h");
        const mm = el.querySelector(".pp-cd-m");
        const ss = el.querySelector(".pp-cd-s");
        if (hh) hh.textContent = String(h).padStart(2, "0");
        if (mm) mm.textContent = String(m).padStart(2, "0");
        if (ss) ss.textContent = String(s).padStart(2, "0");
      });
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------------------
   * Search
   * ------------------------------------------------------------------- */
  function buildSearchIndex() {
    if (typeof PRODUCTS === "undefined") return [];
    return PRODUCTS;
  }

  function searchProducts(query, limit) {
    limit = limit || 8;
    const list = buildSearchIndex();
    const q = (query || "").trim().toLowerCase();
    if (!q) return [];
    return list
      .filter(function (p) {
        return (
          p.title.toLowerCase().indexOf(q) !== -1 ||
          (p.category && p.category.toLowerCase().indexOf(q) !== -1) ||
          (p.brand && p.brand.toLowerCase().indexOf(q) !== -1) ||
          (p.shortDesc && p.shortDesc.toLowerCase().indexOf(q) !== -1)
        );
      })
      .slice(0, limit);
  }

  function popularProducts(limit) {
    limit = limit || 5;
    const list = buildSearchIndex().slice();
    list.sort(function (a, b) {
      return (b.reviews || 0) - (a.reviews || 0);
    });
    return list.slice(0, limit);
  }

  function initSearch() {
    document.querySelectorAll(".pp-search").forEach(function (wrap) {
      const input = wrap.querySelector("input");
      const suggest = wrap.querySelector(".pp-search-suggest");
      const clearBtn = wrap.querySelector(".clear-btn");
      const form = wrap.querySelector("form");
      if (!input || !suggest) return;

      function renderSuggestions(query) {
        const q = (query || "").trim();
        let html = "";
        if (!q) {
          const hist = getSearchHistory();
          const pop = popularProducts(5);
          if (hist.length) {
            html +=
              '<div class="pp-suggest-section-title">Pesquisas recentes</div>';
            html += hist
              .map(function (term) {
                return (
                  '<button type="button" class="pp-suggest-item js-search-term" data-term="' +
                  escapeHTML(term) +
                  '"><i class="bi bi-clock-history"></i><span class="name">' +
                  escapeHTML(term) +
                  "</span></button>"
                );
              })
              .join("");
          }
          if (pop.length) {
            html += '<div class="pp-suggest-section-title">Em alta</div>';
            html += pop.map(searchResultItemHTML).join("");
          }
          if (!html) {
            html =
              '<div class="pp-suggest-item"><span class="name">Digite para buscar produtos…</span></div>';
          }
        } else {
          const results = searchProducts(q, 6);
          if (results.length) {
            html += results.map(searchResultItemHTML).join("");
            html +=
              '<a class="pp-suggest-item" style="justify-content:center;color:var(--pp-royal-light);font-weight:700;" href="ofertas.html?q=' +
              encodeURIComponent(q) +
              '">Ver todos os resultados para "' +
              escapeHTML(q) +
              '" <i class="bi bi-arrow-right"></i></a>';
          } else {
            html =
              '<div class="pp-suggest-item"><span class="name">Nenhum produto encontrado para "' +
              escapeHTML(q) +
              '"</span></div>';
          }
        }
        suggest.innerHTML = html;
      }

      function searchResultItemHTML(p) {
        return (
          '<a class="pp-suggest-item" href="produto.html?id=' +
          p.id +
          '">' +
          '<img src="' +
          safeUrl(p.image) +
          '" alt="" loading="lazy">' +
          '<span class="name">' +
          escapeHTML(p.title) +
          "</span>" +
          '<span class="price">' +
          formatBRL(p.price) +
          "</span></a>"
        );
      }

      function openSuggest() {
        renderSuggestions(input.value);
        suggest.classList.add("show");
      }
      function closeSuggest() {
        suggest.classList.remove("show");
      }

      input.addEventListener("focus", openSuggest);
      input.addEventListener("input", function () {
        renderSuggestions(input.value);
        suggest.classList.add("show");
        if (clearBtn) clearBtn.style.display = input.value ? "block" : "none";
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          closeSuggest();
          input.blur();
        }
        if (e.key === "Enter") {
          e.preventDefault();
          const q = input.value.trim();
          if (q) {
            addSearchHistory(q);
            window.location.href = "ofertas.html?q=" + encodeURIComponent(q);
          }
        }
      });
      if (clearBtn) {
        clearBtn.addEventListener("click", function () {
          input.value = "";
          clearBtn.style.display = "none";
          renderSuggestions("");
          input.focus();
        });
      }
      suggest.addEventListener("click", function (e) {
        const termBtn = e.target.closest(".js-search-term");
        if (termBtn) {
          const term = termBtn.getAttribute("data-term");
          input.value = term;
          addSearchHistory(term);
          window.location.href = "ofertas.html?q=" + encodeURIComponent(term);
        }
      });
      if (form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          const q = input.value.trim();
          if (q) {
            addSearchHistory(q);
            window.location.href = "ofertas.html?q=" + encodeURIComponent(q);
          }
        });
      }
      document.addEventListener("click", function (e) {
        if (!wrap.contains(e.target)) closeSuggest();
      });
    });
  }

  /* ---------------------------------------------------------------------
   * Init everything common to all pages
   * ------------------------------------------------------------------- */
  function initCommon() {
    initTheme();
    initFavDelegation();
    initChrome();
    initScrollers();
    initReveal();
    initCountdowns();
    initSearch();
    updateFavCount();
  }

  document.addEventListener("DOMContentLoaded", initCommon);

  /* ---------------------------------------------------------------------
   * Produtos vêm do Supabase agora (assets/js/products-data.js faz o
   * fetch de forma assíncrona). As páginas que renderizam PRODUCTS
   * (home/catalog/product/favoritos) precisam esperar os dois:
   * o DOM estar pronto E os produtos terem chegado.
   * ------------------------------------------------------------------- */
  let productsReady = false;
  const productsReadyCallbacks = [];

  window.addEventListener("pp:products-loaded", function () {
    productsReady = true;
    productsReadyCallbacks.forEach(function (cb) {
      cb();
    });
    productsReadyCallbacks.length = 0;
  });

  function onProductsReady(cb) {
    function run() {
      if (productsReady) {
        cb();
      } else {
        productsReadyCallbacks.push(cb);
      }
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", run);
    } else {
      run();
    }
  }

  return {
    formatBRL: formatBRL,
    formatNumber: formatNumber,
    formatCompact: formatCompact,
    hashSeed: hashSeed,
    deterministic: deterministic,
    deterministicInt: deterministicInt,
    starsHTML: starsHTML,
    categoryIcon: categoryIcon,
    CATEGORY_ICONS: CATEGORY_ICONS,
    badgesHTML: badgesHTML,
    BADGE_LABELS: BADGE_LABELS,
    getFavorites: getFavorites,
    isFavorite: isFavorite,
    toggleFavorite: toggleFavorite,
    updateFavCount: updateFavCount,
    getSearchHistory: getSearchHistory,
    addSearchHistory: addSearchHistory,
    searchProducts: searchProducts,
    popularProducts: popularProducts,
    showToast: showToast,
    cardHTML: cardHTML,
    priceBlockHTML: priceBlockHTML,
    skeletonCards: skeletonCards,
    safeUrl: safeUrl,
    escapeHTML: escapeHTML,
    shareProduct: shareProduct,
    initScrollers: initScrollers,
    initReveal: initReveal,
    observeNewReveals: observeNewReveals,
    initCommon: initCommon,
    applyTheme: applyTheme,
    getTheme: getTheme,
    onProductsReady: onProductsReady,
  };
})();
