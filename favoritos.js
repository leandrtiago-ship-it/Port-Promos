/* ==========================================================================
   Port Promos — favoritos.js
   Renders the user's favorited products grid. Listens for live updates
   when favorites change (e.g. unfavorited from this very page).
   Depends on: products-data.js (PRODUCTS), main.js (PP)
   ========================================================================== */
(function () {
  "use strict";

  function byId(id) {
    return document.getElementById(id);
  }

  function render() {
    const mount = byId("pp-favorites-mount");
    const countEl = byId("pp-fav-page-count");
    if (!mount) return;

    const favIds = PP.getFavorites();
    const items = PRODUCTS.filter(function (p) {
      return favIds.indexOf(p.id) !== -1;
    });

    if (countEl) {
      countEl.textContent =
        items.length === 0
          ? "Nenhum produto favoritado"
          : items.length === 1
          ? "1 produto favoritado"
          : items.length + " produtos favoritados";
    }

    if (!items.length) {
      mount.innerHTML =
        '<div class="pp-empty">' +
        '<div class="ico"><i class="bi bi-heart"></i></div>' +
        "<h3>Você ainda não tem favoritos</h3>" +
        '<p class="text-muted-pp">Toque no coração de um produto para guardá-lo aqui e acompanhar o preço.</p>' +
        '<a href="ofertas.html" class="btn btn-pp-primary mt-2">Ver todas as ofertas</a>' +
        "</div>";
      return;
    }

    mount.innerHTML =
      '<div class="row g-3">' +
      items
        .map(function (p) {
          return '<div class="col-6 col-md-4 col-lg-3">' + PP.cardHTML(p) + "</div>";
        })
        .join("") +
      "</div>";

    PP.initReveal();
  }

  function init() {
    render();
    document.addEventListener("pp:favorites-changed", render);
  }

  PP.onProductsReady(init);
})();
