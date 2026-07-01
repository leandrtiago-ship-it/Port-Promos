/* ==========================================================================
   Port Promos — products-data.js
   Antes: array PRODUCTS hardcoded.
   Agora: PRODUCTS começa vazio e é preenchido via fetch assíncrono na
   tabela `products` do Supabase. Quando os dados chegam (ou falham),
   disparamos o evento "pp:products-loaded" — é nele que main.js/home.js/
   catalog.js/product.js/favoritos.js se baseiam pra saber a hora de
   renderizar a página.

   O formato de cada item de PRODUCTS continua EXATAMENTE igual ao
   formato antigo, então nenhum outro arquivo precisou ser reescrito —
   só precisaram esperar esse evento antes de ler PRODUCTS.
   ========================================================================== */
var PRODUCTS = [];

(function () {
  "use strict";

  function formatDateBR(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return dd + "/" + mm + "/" + d.getFullYear();
  }

  // Converte uma linha da tabela `products` (+ join com categories) para
  // o mesmo formato que o array PRODUCTS sempre teve.
  function mapRow(row) {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      shortDesc: row.short_desc,
      fullText: row.full_text,
      features: row.features || [],
      category: row.categories ? row.categories.name : null,
      brand: row.brand,
      store: row.store,
      image: row.image_url,
      oldPrice: row.old_price,
      price: row.price,
      discountPercent: row.discount_percent,
      rating: row.rating,
      reviews: row.reviews,
      sold: row.sold,
      stock: row.stock,
      badges: row.badges || [],
      link: row.link,
      addedDate: formatDateBR(row.created_at),
      priceHistory: row.price_history || [],
    };
  }

  async function loadProducts() {
    try {
      const { data, error } = await PP_SB.from("products")
        .select("*, categories(name)")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      PRODUCTS.length = 0;
      (data || []).forEach(function (row) {
        PRODUCTS.push(mapRow(row));
      });

      // ── Fisher-Yates shuffle: produtos em ordem aleatória a cada visita ──
      for (var _i = PRODUCTS.length - 1; _i > 0; _i--) {
        var _j = Math.floor(Math.random() * (_i + 1));
        var _tmp = PRODUCTS[_i];
        PRODUCTS[_i] = PRODUCTS[_j];
        PRODUCTS[_j] = _tmp;
      }
      // Registra o índice aleatório para que o catálogo respeite esta ordem
      PRODUCTS.forEach(function (p, idx) { p._randomIdx = idx; });
    } catch (err) {
      console.error("Port Promos: falha ao carregar produtos do Supabase.", err);
      // PRODUCTS fica vazio; a página renderiza um estado "sem ofertas"
      // em vez de travar esperando para sempre.
      if (window.PP && typeof PP.showToast === "function") {
        PP.showToast(
          "Não foi possível carregar as ofertas agora. Tente recarregar a página.",
          "error",
          "bi-exclamation-triangle"
        );
      }
    } finally {
      window.dispatchEvent(new Event("pp:products-loaded"));
    }
  }

  loadProducts();
})();
