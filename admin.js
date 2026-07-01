/* ==========================================================================
   Port Promos — admin.js
   Painel administrativo: lista, cria, edita, duplica, oculta e exclui
   produtos. Upload de imagem com compressão automática (canvas -> WebP)
   antes de subir pro bucket do Supabase Storage.
   ========================================================================== */
(function () {
  "use strict";

  let CURRENT_USER = null;
  let ALL_PRODUCTS = [];
  let CATEGORIES = [];
  let PENDING_IMAGES = []; // [{blob, name, previewUrl}]
  let EDITING_PRODUCT = null; // produto sendo editado (objeto completo) ou null = criando
  let SLUG_TOUCHED = false;

  /* ---------------------------------------------------------------------
   * Util
   * ------------------------------------------------------------------- */
  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function byId(id) {
    return document.getElementById(id);
  }

  let webpSupportPromise = null;
  function supportsWebP() {
    if (webpSupportPromise) return webpSupportPromise;
    webpSupportPromise = new Promise(function (resolve) {
      const c = document.createElement("canvas");
      c.width = 1;
      c.height = 1;
      c.toBlob(
        function (blob) {
          resolve(!!blob && blob.type === "image/webp");
        },
        "image/webp"
      );
    });
    return webpSupportPromise;
  }

  async function compressImage(file, maxDim, quality) {
    let bitmap;
    if (window.createImageBitmap) {
      bitmap = await createImageBitmap(file);
    } else {
      bitmap = await new Promise(function (resolve, reject) {
        const img = new Image();
        img.onload = function () {
          resolve(img);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
    }
    let w = bitmap.width,
      h = bitmap.height;
    if (w > maxDim || h > maxDim) {
      const scale = maxDim / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);

    const useWebp = await supportsWebP();
    const mime = useWebp ? "image/webp" : "image/jpeg";
    const ext = useWebp ? "webp" : "jpg";
    const blob = await new Promise(function (resolve) {
      canvas.toBlob(resolve, mime, quality);
    });
    return { blob: blob, ext: ext, mime: mime };
  }

  /* ---------------------------------------------------------------------
   * Carregamento de dados
   * ------------------------------------------------------------------- */
  async function loadCategories() {
    const { data, error } = await PP_SB.from("categories")
      .select("*")
      .order("name");
    if (error) {
      console.error(error);
      return;
    }
    CATEGORIES = data || [];

    const filterSel = byId("pp-admin-filter-cat");
    const formSel = byId("pf-category");
    CATEGORIES.forEach(function (c) {
      const o1 = document.createElement("option");
      o1.value = c.id;
      o1.textContent = c.name;
      filterSel.appendChild(o1);

      const o2 = document.createElement("option");
      o2.value = c.id;
      o2.textContent = c.name;
      formSel.appendChild(o2);
    });
  }

  async function loadProducts() {
    const { data, error } = await PP_SB.from("products")
      .select("*, categories(id, name)")
      .order("created_at", { ascending: false });
    if (error) {
      PP.showToast("Erro ao carregar produtos: " + error.message, "error", "bi-exclamation-triangle");
      return;
    }
    ALL_PRODUCTS = data || [];
    renderStats();
    renderTable();
  }

  function renderStats() {
    byId("pp-stat-total").textContent = ALL_PRODUCTS.length;
    byId("pp-stat-active").textContent = ALL_PRODUCTS.filter(function (p) { return p.status === "active"; }).length;
    byId("pp-stat-hidden").textContent = ALL_PRODUCTS.filter(function (p) { return p.status === "hidden"; }).length;
    byId("pp-stat-draft").textContent = ALL_PRODUCTS.filter(function (p) { return p.status === "draft"; }).length;
  }

  function statusBadge(status) {
    const map = {
      active: '<span class="badge" style="background:var(--pp-success);">Ativo</span>',
      hidden: '<span class="badge" style="background:var(--pp-orange);">Oculto</span>',
      draft: '<span class="badge" style="background:#666;">Rascunho</span>',
    };
    return map[status] || status;
  }

  function renderTable() {
    const search = byId("pp-admin-search").value.trim().toLowerCase();
    const catFilter = byId("pp-admin-filter-cat").value;
    const statusFilter = byId("pp-admin-filter-status").value;

    const filtered = ALL_PRODUCTS.filter(function (p) {
      if (search && !p.title.toLowerCase().includes(search)) return false;
      if (catFilter && p.category_id !== catFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      return true;
    });

    const tbody = byId("pp-admin-tbody");
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">Nenhum produto encontrado.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered
      .map(function (p) {
        const catName = p.categories ? PP.escapeHTML(p.categories.name) : "—";
        return (
          "<tr>" +
          '<td><img src="' + PP.safeUrl(p.image_url) + '" alt=""></td>' +
          "<td><strong>" + PP.escapeHTML(p.title) + "</strong><br><small style=\"color:var(--text-muted)\">" + PP.escapeHTML(p.slug) + "</small></td>" +
          "<td>" + catName + "</td>" +
          "<td>" + PP.formatBRL(p.price) + "</td>" +
          "<td>" + (p.stock ?? 0) + "</td>" +
          "<td>" + statusBadge(p.status) + "</td>" +
          '<td class="text-end">' +
          '<div class="btn-group btn-group-sm">' +
          '<button type="button" class="btn btn-pp-ghost js-edit" data-id="' + p.id + '" title="Editar"><i class="bi bi-pencil"></i></button>' +
          '<button type="button" class="btn btn-pp-ghost js-duplicate" data-id="' + p.id + '" title="Duplicar"><i class="bi bi-copy"></i></button>' +
          '<button type="button" class="btn btn-pp-ghost js-toggle" data-id="' + p.id + '" title="' + (p.status === "active" ? "Ocultar" : "Tornar ativo") + '"><i class="bi ' + (p.status === "active" ? "bi-eye-slash" : "bi-eye") + '"></i></button>' +
          '<button type="button" class="btn btn-pp-ghost js-delete" data-id="' + p.id + '" title="Excluir" style="color:#e5484d;"><i class="bi bi-trash"></i></button>' +
          "</div></td>" +
          "</tr>"
        );
      })
      .join("");
  }

  /* ---------------------------------------------------------------------
   * Modal: abrir em modo criar / editar
   * ------------------------------------------------------------------- */
  function clearForm() {
    byId("pp-product-form").reset();
    byId("pf-id").value = "";
    byId("pf-status").value = "active";
    byId("pf-img-preview").innerHTML = "";
    PENDING_IMAGES.forEach(function (i) { URL.revokeObjectURL(i.previewUrl); });
    PENDING_IMAGES = [];
    EDITING_PRODUCT = null;
    SLUG_TOUCHED = false;
  }

  function openModalForCreate() {
    clearForm();
    byId("ppProductModalTitle").textContent = "Novo produto";
    new bootstrap.Modal(byId("ppProductModal")).show();
  }

  function openModalForEdit(product) {
    clearForm();
    EDITING_PRODUCT = product;
    byId("ppProductModalTitle").textContent = "Editar produto";
    byId("pf-id").value = product.id;
    byId("pf-title").value = product.title || "";
    byId("pf-slug").value = product.slug || "";
    byId("pf-shortdesc").value = product.short_desc || "";
    byId("pf-fulltext").value = product.full_text || "";
    byId("pf-features").value = (product.features || []).join("\n");
    byId("pf-category").value = product.category_id || "";
    byId("pf-brand").value = product.brand || "";
    byId("pf-store").value = product.store || "";
    byId("pf-status").value = product.status || "active";
    byId("pf-oldprice").value = product.old_price ?? "";
    byId("pf-price").value = product.price ?? "";
    byId("pf-stock").value = product.stock ?? 0;
    byId("pf-rating").value = product.rating ?? 4.7;
    byId("pf-reviews").value = product.reviews ?? 0;
    byId("pf-sold").value = product.sold ?? "";
    byId("pf-badges").value = (product.badges || []).join(", ");
    byId("pf-link").value = product.link || "";
    SLUG_TOUCHED = true; // não regenerar slug de um produto já existente

    if (product.image_url) {
      const wrap = document.createElement("div");
      wrap.className = "item";
      wrap.innerHTML =
        '<img src="' + PP.safeUrl(product.image_url) + '" alt="">' +
        '<span class="primary-tag">Atual</span>';
      byId("pf-img-preview").appendChild(wrap);
    }

    new bootstrap.Modal(byId("ppProductModal")).show();
  }

  /* ---------------------------------------------------------------------
   * Upload de imagens (drop zone)
   * ------------------------------------------------------------------- */
  function renderImagePreviews() {
    const row = byId("pf-img-preview");
    // mantém o preview "Atual" (do produto em edição) se não houver novas imagens
    if (PENDING_IMAGES.length === 0) {
      if (EDITING_PRODUCT && EDITING_PRODUCT.image_url) return; // já está renderizado
      row.innerHTML = "";
      return;
    }
    row.innerHTML = "";
    PENDING_IMAGES.forEach(function (img, idx) {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML =
        '<img src="' + img.previewUrl + '" alt="">' +
        (idx === 0 ? '<span class="primary-tag">Capa</span>' : "") +
        '<button type="button" class="btn-close btn-close-white" style="position:absolute;top:-6px;right:-6px;background:#e5484d;border-radius:50%;width:18px;height:18px;padding:0;" data-idx="' + idx + '"></button>';
      row.appendChild(div);
    });
    row.querySelectorAll("[data-idx]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const idx = Number(btn.getAttribute("data-idx"));
        URL.revokeObjectURL(PENDING_IMAGES[idx].previewUrl);
        PENDING_IMAGES.splice(idx, 1);
        renderImagePreviews();
      });
    });
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList).slice(0, 6 - PENDING_IMAGES.length);
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const { blob, ext } = await compressImage(file, 1280, 0.82);
        PENDING_IMAGES.push({
          blob: blob,
          ext: ext,
          name: file.name,
          previewUrl: URL.createObjectURL(blob),
        });
      } catch (err) {
        console.error("Falha ao comprimir imagem", err);
        PP.showToast("Não foi possível processar uma das imagens.", "error", "bi-exclamation-triangle");
      }
    }
    renderImagePreviews();
  }

  /* ---------------------------------------------------------------------
   * Salvar (criar ou atualizar)
   * ------------------------------------------------------------------- */
  async function uploadPendingImages(slug) {
    const uploaded = [];
    for (let i = 0; i < PENDING_IMAGES.length; i++) {
      const img = PENDING_IMAGES[i];
      const path = "products/" + slug + "/" + Date.now() + "-" + i + "." + img.ext;
      const { error } = await PP_SB.storage
        .from("product-images")
        .upload(path, img.blob, { contentType: img.mime || "image/webp" });
      if (error) {
        console.error(error);
        PP.showToast("Falha ao enviar uma imagem: " + error.message, "error", "bi-exclamation-triangle");
        continue;
      }
      const { data: pub } = PP_SB.storage.from("product-images").getPublicUrl(path);
      uploaded.push({ path: path, url: pub.publicUrl });
    }
    return uploaded;
  }

  function buildPayload() {
    const oldPrice = byId("pf-oldprice").value ? Number(byId("pf-oldprice").value) : null;
    const price = Number(byId("pf-price").value);
    const discount = oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : null;
    const features = byId("pf-features").value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
    const badges = byId("pf-badges").value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);

    return {
      title: byId("pf-title").value.trim(),
      slug: byId("pf-slug").value.trim(),
      short_desc: byId("pf-shortdesc").value.trim() || null,
      full_text: byId("pf-fulltext").value.trim() || null,
      features: features,
      category_id: byId("pf-category").value || null,
      brand: byId("pf-brand").value.trim() || null,
      store: byId("pf-store").value || null,
      status: byId("pf-status").value,
      old_price: oldPrice,
      price: price,
      discount_percent: discount,
      stock: Number(byId("pf-stock").value) || 0,
      rating: byId("pf-rating").value !== "" ? Number(byId("pf-rating").value) : 0,
      reviews: byId("pf-reviews").value !== "" ? Number(byId("pf-reviews").value) : 0,
      sold: byId("pf-sold").value !== "" ? Number(byId("pf-sold").value) : null,
      badges: badges,
      link: byId("pf-link").value.trim(),
    };
  }

  async function saveProduct() {
    const form = byId("pp-product-form");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const saveBtn = byId("pf-save-btn");
    const saveBtnText = byId("pf-save-btn-text");
    saveBtn.disabled = true;
    saveBtnText.textContent = "Salvando...";

    try {
      const payload = buildPayload();
      const isEditing = !!EDITING_PRODUCT;
      let productId = isEditing ? EDITING_PRODUCT.id : null;

      if (isEditing) {
        const { error } = await PP_SB.from("products").update(payload).eq("id", productId);
        if (error) throw error;
      } else {
        const { data, error } = await PP_SB.from("products").insert(payload).select().single();
        if (error) throw error;
        productId = data.id;
      }

      if (PENDING_IMAGES.length > 0) {
        const uploaded = await uploadPendingImages(payload.slug);
        if (uploaded.length > 0) {
          await PP_SB.from("products").update({ image_url: uploaded[0].url }).eq("id", productId);
          if (isEditing) {
            await PP_SB.from("product_images").delete().eq("product_id", productId);
          }
          const rows = uploaded.map(function (u, idx) {
            return { product_id: productId, storage_path: u.path, position: idx, is_primary: idx === 0 };
          });
          await PP_SB.from("product_images").insert(rows);
        }
      }

      await PP_Auth.logAction(
        CURRENT_USER.user.id,
        isEditing ? "product.update" : "product.create",
        "product",
        productId,
        { slug: payload.slug, title: payload.title }
      );

      PP.showToast(isEditing ? "Produto atualizado!" : "Produto criado!", "success", "bi-check-circle");
      bootstrap.Modal.getInstance(byId("ppProductModal")).hide();
      await loadProducts();
    } catch (err) {
      console.error(err);
      PP.showToast("Erro ao salvar: " + (err.message || err), "error", "bi-exclamation-triangle");
    } finally {
      saveBtn.disabled = false;
      saveBtnText.textContent = "Salvar produto";
    }
  }

  /* ---------------------------------------------------------------------
   * Ações da tabela: editar / duplicar / ocultar / excluir
   * ------------------------------------------------------------------- */
  async function duplicateProduct(product) {
    const suffix = "-copia-" + Math.random().toString(36).slice(2, 6);
    const payload = {
      title: product.title + " (cópia)",
      slug: product.slug + suffix,
      short_desc: product.short_desc,
      full_text: product.full_text,
      features: product.features,
      category_id: product.category_id,
      brand: product.brand,
      store: product.store,
      status: "draft",
      old_price: product.old_price,
      price: product.price,
      discount_percent: product.discount_percent,
      stock: product.stock,
      badges: product.badges,
      link: product.link,
      image_url: product.image_url,
    };
    const { data, error } = await PP_SB.from("products").insert(payload).select().single();
    if (error) {
      PP.showToast("Erro ao duplicar: " + error.message, "error", "bi-exclamation-triangle");
      return;
    }

    const { data: imgs } = await PP_SB.from("product_images").select("*").eq("product_id", product.id);
    if (imgs && imgs.length) {
      await PP_SB.from("product_images").insert(
        imgs.map(function (img) {
          return { product_id: data.id, storage_path: img.storage_path, position: img.position, is_primary: img.is_primary };
        })
      );
    }

    await PP_Auth.logAction(CURRENT_USER.user.id, "product.duplicate", "product", data.id, { from: product.id });
    PP.showToast("Produto duplicado como rascunho.", "success", "bi-check-circle");
    await loadProducts();
  }

  async function toggleStatus(product) {
    const newStatus = product.status === "active" ? "hidden" : "active";
    const { error } = await PP_SB.from("products").update({ status: newStatus }).eq("id", product.id);
    if (error) {
      PP.showToast("Erro: " + error.message, "error", "bi-exclamation-triangle");
      return;
    }
    await PP_Auth.logAction(CURRENT_USER.user.id, "product." + (newStatus === "active" ? "unhide" : "hide"), "product", product.id, null);
    await loadProducts();
  }

  async function deleteProduct(product) {
    if (!confirm('Excluir "' + product.title + '" definitivamente? Essa ação não pode ser desfeita.')) return;

    try {
      const { data: imgs } = await PP_SB.from("product_images").select("storage_path").eq("product_id", product.id);
      if (imgs && imgs.length) {
        await PP_SB.storage.from("product-images").remove(imgs.map(function (i) { return i.storage_path; }));
      }
    } catch (e) {
      console.warn("Não foi possível limpar arquivos do Storage:", e);
    }

    const { error } = await PP_SB.from("products").delete().eq("id", product.id);
    if (error) {
      PP.showToast("Erro ao excluir: " + error.message, "error", "bi-exclamation-triangle");
      return;
    }
    await PP_Auth.logAction(CURRENT_USER.user.id, "product.delete", "product", product.id, { title: product.title });
    PP.showToast("Produto excluído.", "success", "bi-check-circle");
    await loadProducts();
  }

  /* ---------------------------------------------------------------------
   * Init
   * ------------------------------------------------------------------- */
  async function init() {
    CURRENT_USER = await PP_Auth.requireAdmin();
    byId("pp-admin-name").textContent = CURRENT_USER.profile.full_name || CURRENT_USER.user.email;

    await loadCategories();
    await loadProducts();

    byId("pp-logout-btn").addEventListener("click", function () {
      PP_Auth.signOut();
    });

    byId("pp-admin-search").addEventListener("input", renderTable);
    byId("pp-admin-filter-cat").addEventListener("change", renderTable);
    byId("pp-admin-filter-status").addEventListener("change", renderTable);

    byId("pp-new-product-btn").addEventListener("click", openModalForCreate);

    byId("pp-admin-tbody").addEventListener("click", function (e) {
      const btn = e.target.closest("button[data-id]");
      if (!btn) return;
      const product = ALL_PRODUCTS.find(function (p) { return p.id === btn.getAttribute("data-id"); });
      if (!product) return;
      if (btn.classList.contains("js-edit")) openModalForEdit(product);
      else if (btn.classList.contains("js-duplicate")) duplicateProduct(product);
      else if (btn.classList.contains("js-toggle")) toggleStatus(product);
      else if (btn.classList.contains("js-delete")) deleteProduct(product);
    });

    byId("pf-title").addEventListener("input", function () {
      if (!SLUG_TOUCHED) byId("pf-slug").value = slugify(this.value);
    });
    byId("pf-slug").addEventListener("input", function () {
      SLUG_TOUCHED = true;
    });

    byId("pf-img-drop").addEventListener("click", function () {
      byId("pf-img-input").click();
    });
    byId("pf-img-input").addEventListener("change", function (e) {
      handleFiles(e.target.files);
      e.target.value = "";
    });
    byId("pf-img-drop").addEventListener("dragover", function (e) {
      e.preventDefault();
    });
    byId("pf-img-drop").addEventListener("drop", function (e) {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    });

    byId("pf-save-btn").addEventListener("click", saveProduct);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
